import Vue from 'vue'

export default function ({ $axios, store }) {
  $axios.onRequest(config => {
    if (!navigator.onLine)
      Vue.prototype.$toasted.show('No internet connection')
  });

  $axios.onError(e => {
    if (e.response) {
      if (e.response.data) {
        const code = parseInt(e.response.data.status);
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
          case 401:
            //Vue.prototype.$toasted.error('You do not have access to this page');
            store.dispatch('logout');
            break;
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
