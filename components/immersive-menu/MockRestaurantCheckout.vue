<template>
  <restaurant-checkout :adapter="adapter" :items="items" @count="setCount" @complete="complete" @close="$emit('close')" />
</template>
<script>
import RestaurantCheckout from './RestaurantCheckout.vue';
import { disconnectedAdapter } from '~/utils/restaurantCheckout.cjs';
export default {
  components: { RestaurantCheckout },
  data() {
    // BACKEND/TODO §19: merger injects the real scoped adapter into the reusable
    // RestaurantCheckout. Do not expose this dev-only route in production by
    // removing its guard or replacing the API base URL. Customer identity never
    // uses registerModal/global token; real SMS, ownership and POS attestation
    // are mapped at the adapter boundary documented beside its operations.
    return { adapter: this.$restaurantMock && this.$restaurantMock.checkoutAdapter ? this.$restaurantMock.checkoutAdapter() : disconnectedAdapter(),
      items: this.$store.getters['restaurantMockBasket/selectedProducts'].map(item => ({ ...item,
        add_unit: this.$store.getters['restaurantMockBasket/products'].find(product => product.key === item.key).add_unit })) };
  },
  methods: {
    setCount(value) { this.$store.commit('restaurantMockBasket/setCount', value); },
    complete() { this.items.forEach(item => this.setCount({ key: item.key, count: 0 })); },
  },
};
</script>
