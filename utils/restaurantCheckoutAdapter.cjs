const { disconnectedAdapter } = require('./restaurantCheckout.cjs');
const { localMockAllowed } = require('./mockRestaurant.cjs');
const { RESTAURANT_TEST_OTP } = require('./restaurantOtpFixture.cjs');
function createLocalAdapter({ axios, allowed, owner, dev = false, pageOrigin = '' }) {
  const enabled = () => allowed() && localMockAllowed(dev, pageOrigin, axios.defaults.baseURL);
  if (!enabled()) return disconnectedAdapter();
  const originalOwner = owner();
  const origin = new URL(axios.defaults.baseURL).origin;
  const adapter = { localOnly: true, origin,
    // BACKEND §19: adapter-only local fixture capability, not an API field.
    // Production challenges must never return a test code. Generic checkout
    // adapters have no prefill capability; verification still uses the server.
    otpPrefill: challenge => enabled() && originalOwner && owner() === originalOwner
      && challenge.mockOnly === true && challenge.delivery === 'local_fixture'
      ? RESTAURANT_TEST_OTP : '',
  };
  for (const operation of ['preview', 'challenge', 'verify', 'discounts', 'confirmCard', 'cancel', 'online', 'reconcile', 'revoke']) {
    adapter[operation] = async body => {
      if (!enabled() || !originalOwner || owner() !== originalOwner) throw Error('Device changed');
      // BACKEND/TODO §19: LOCAL transport only, never map these paths to a real
      // server by changing baseURL. Merger implements the same operation API
      // with scoped customer grants, actual SMS, server quotes, idempotency,
      // POS attestation and reconciliation. No global login/register fallback.
      const response = await axios.post('/api/enduser/mock/restaurant/checkout/' + operation, body).catch(error => {
        if (error.response && error.response.data && error.response.data.unavailable) return { data: { unavailable: true } };
        throw error;
      });
      if (!enabled() || owner() !== originalOwner) throw Error('Device changed');
      if (response.data && response.data.unavailable) return disconnectedAdapter()[operation]();
      if (operation === 'online' && response.data.payment_link) return { ...response.data, payment_link: new URL(response.data.payment_link, origin).href };
      return response.data;
    };
  }
  return adapter;
}
module.exports = { createLocalAdapter };
