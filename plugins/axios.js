import Vue from 'vue'
import restoreCustomerSession from '../utils/customerSession.cjs'

export default function ({ $axios }) {
  // localStorage survives refreshes. Restore the credential before any page
  // can issue an authenticated request (including a direct /profile load).
  if (process.client) {
    restoreCustomerSession(window.localStorage, $axios)
  }

  $axios.onRequest(config => {
    if (process.client) {
      const session = restoreCustomerSession(window.localStorage, $axios)
      if (session) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${session.token}`
      }
    }

    if (!navigator.onLine)
      Vue.prototype.$toasted.show('No internet connection')
  });

  $axios.onError(e => {
    if (e.response) {
      // Read the HTTP status first. Nest's error body uses `statusCode`, not
      // `status`, so the old `e.response.data.status` lookup was always
      // undefined and none of the cases below ever matched — 401s in
      // particular were silently swallowed and the stale token kept being
      // resent.
      const httpStatus = e.response.status;

      if (httpStatus === 401) {
        // The token no longer maps to a user (expired, or the account is
        // gone). Drop it so the app returns to the logged-out state instead of
        // retrying with a credential that can never work.
        if (typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          Vue.prototype.$toasted.error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
          if (typeof window !== 'undefined') window.location.reload();
        }
        return false;
      }

      if (e.response.data) {
        const code = parseInt(e.response.data.statusCode || e.response.data.status || httpStatus);
        switch (code) {
          case 400:
            if (Array.isArray(e.response.data.result)) {
              e.response.data.result.forEach(item => {
                Vue.prototype.$toasted.error(item.error.value);
              });
            } else {
              const item = e.response.data.result;
              if (item.error)
                Vue.prototype.$toasted.error(item.error.value);
              else if (item.value)
                Vue.prototype.$toasted.error(item.value);
            }
            break;
          // 401 is handled above, before this switch.
          case 403:
            Vue.prototype.$toasted.error('You do not have access to this page');
            break;
          case 404:
            Vue.prototype.$toasted.error('There is a Problem');
            break;
          case 500:
            if (e && e.response && e.response.data && e.response.data.result) {
              if (Array.isArray(e.response.data.result)) {
                e.response.data.result.forEach(item => {
                  Vue.prototype.$toasted.error(item.error.value);
                });
              } else {
                const item = e.response.data.result;
                if (item.error)
                  Vue.prototype.$toasted.error(item.error.value);
                else if (item.value)
                  Vue.prototype.$toasted.error(item.value);
              }
              return false;
            }

            Vue.prototype.$toasted.error('Server error occurred');
            break;
        }
        return false
      }
    }
  })
}
