import { localMockAllowed, verifiedMockScope } from '~/utils/mockRestaurant.cjs';
import { createLocalAdapter } from '~/utils/restaurantCheckoutAdapter.cjs';

export default function ({ app, $axios, store }, inject) {
  let owner = null;
  let generation = 0;
  const enabled = () => process.client && localMockAllowed(process.dev, window.location.origin, $axios.defaults.baseURL);
  // Classification only, never authorization. Keep device credentials out of
  // ordinary customer restoration even when the local API cannot be reached.
  const isDeviceCredential = () => enabled() && /^mock-restaurant-/.test(localStorage.getItem('token') || '');
  const clearBasket = () => store.commit('restaurantMockBasket/reset');
  const authorize = async () => {
    if (!enabled()) return null;
    const token = localStorage.getItem('token');
    if (owner !== token) { clearBasket(); owner = token; generation++; }
    if (!token) return null;
    const request = generation;
    const current = () => request === generation && owner === token && localStorage.getItem('token') === token;
    try {
      const response = await $axios.get('/api/enduser/mock/restaurant/session', { headers: { Authorization: `Bearer ${token}` } });
      if (!current()) return null;
      if (!verifiedMockScope(response.data)) {
        clearBasket();
        // BACKEND: §18. Only an explicit local mock denial for this SAME device
        // grant permits cleanup. Outages, malformed replies and ordinary users
        // must retain their credentials; a late A reply must never clear B.
        const data = response.data;
        if (isDeviceCredential() && data && data.mockOnly === true && data.scope === null && data.user === null) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          $axios.setHeader('Authorization', false);
          owner = null; generation++;
        }
        return null;
      }
      if (typeof $axios.setHeader === 'function') $axios.setHeader('Authorization', `Bearer ${token}`);
      return { token, user: response.data.user };
    } catch (_) { if (current()) clearBasket(); return null; }
  };
  inject('restaurantMock', { enabled, authorize, clearBasket, isDeviceCredential,
    checkoutAdapter: () => createLocalAdapter({ axios: $axios, allowed: enabled, owner: () => localStorage.getItem('token'),
      dev: process.dev, pageOrigin: process.client ? window.location.origin : '' }),
  });
  // A dedicated local lane; URL, stored user fields and a phone number grant nothing.
  app.router.beforeEach(async (to, from, next) => {
    if (!enabled()) return next(to.path === '/restaurant-mock' ? '/' : undefined);
    const session = await authorize();
    if (session && to.path !== '/restaurant-mock') return next('/restaurant-mock');
    if (!session && to.path === '/restaurant-mock') return next('/');
    next();
  });
  // Nuxt awaits plugins before mounting pages. Recover a grant revoked by a
  // mock restart before root restores it or sends any customer-only requests.
  if (isDeviceCredential()) return authorize();
}
