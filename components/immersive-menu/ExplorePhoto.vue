<template><span class="explore-photo"><img v-if="verifiedSrc && !failed" :src="verifiedSrc" alt="" loading="lazy" decoding="async" @error="failed = true" /></span></template>
<script>
export default {
  props: { src: { type: String, default: '' } },
  data() { return { verifiedSrc: '', failed: false, near: false, request: 0 }; },
  watch: { src() { this.verify(); } },
  mounted() {
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { this.near = true; this.observer.disconnect(); this.verify(); }
    }, { root: this.$el.closest('.story-explore__scroll'), rootMargin: '120px' });
    this.observer.observe(this.$el);
  },
  beforeDestroy() { this.request++; this.observer.disconnect(); if (this.controller) this.controller.abort(); },
  methods: {
    async verify() {
      const request = ++this.request; this.verifiedSrc = ''; this.failed = false;
      if (this.controller) this.controller.abort();
      if (!this.near || !this.src || /\.svg(?:[?#]|$)/i.test(this.src)) return;
      const src = this.src; this.controller = new AbortController();
      try {
        // Read only the thumbnail headers, never collect full image blobs for the grid.
        const response = await fetch(src, { credentials: 'omit', signal: this.controller.signal });
        const raster = response.ok && /^image\/(jpeg|png|webp|avif|gif)$/i.test((response.headers.get('content-type') || '').split(';')[0].trim());
        if (response.body) response.body.cancel().catch(() => {});
        if (request === this.request && raster) this.verifiedSrc = src;
      } catch (error) {
        if (request === this.request && error instanceof TypeError && /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(src)) this.verifiedSrc = src;
      }
    },
  },
};
</script>
<style scoped>
.explore-photo { position: absolute; inset: 0; }
.explore-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
