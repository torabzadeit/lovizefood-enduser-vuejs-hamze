<template><immersive-menu v-if="session" restaurant-mode /></template>

<script>
import ImmersiveMenu from './immersive-menu.vue';

export default {
  components: { ImmersiveMenu },
  data() { return { session: null, generation: 0 }; },
  async middleware({ app, redirect }) {
    if (!app.$restaurantMock || !await app.$restaurantMock.authorize()) return redirect('/');
  },
  async mounted() {
    window.addEventListener('storage', this.sessionChanged);
    await this.refreshSession();
  },
  beforeDestroy() { this.generation++; window.removeEventListener('storage', this.sessionChanged); this.$restaurantMock && this.$restaurantMock.clearBasket(); },
  methods: {
    async refreshSession() {
      const generation = ++this.generation;
      const session = await this.$restaurantMock.authorize();
      if (generation !== this.generation || this._isDestroyed || this._isBeingDestroyed) return;
      if (session) this.session = session;
      else this.$router.replace('/');
    },
    sessionChanged(event) {
      if (event.key !== 'token' && event.key !== null) return;
      this.session = null; this.$restaurantMock.clearBasket();
      return this.refreshSession();
    },
  },
};
</script>
