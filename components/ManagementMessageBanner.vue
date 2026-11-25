<template>
  <nuxt-link v-if="hasUnread" to="/profile?tab=messages" class="management-message-banner" :class="{ 'management-message-banner--paused': !motionVisible || !documentVisible }" dir="rtl">
    <span class="management-message-banner__icon" aria-hidden="true">
      <span v-show="animationReady" ref="animation" class="management-message-banner__animation"></span>
      <svg v-show="!animationReady" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" focusable="false">
        <path d="M4 4h16v12H9l-5 4V4z" stroke-linejoin="round" />
        <path d="M8 8h8M8 12h5" stroke-linecap="round" />
      </svg>
    </span>
    <span class="management-message-banner__copy">
      <span>از رستوران لاویز پیام جدیدی دارید</span>
    </span>
    <span class="management-message-banner__action">مشاهده</span>
  </nuxt-link>
</template>

<script>
export default {
  name: 'ManagementMessageBanner',
  props: { token: { type: String, required: true } },
  data() {
    return { hasUnread: false, refreshing: false, motionVisible: false, documentVisible: true, animationReady: false };
  },
  watch: {
    hasUnread(value) {
      if (this.motionObserver) this.motionObserver.disconnect();
      this.motionVisible = false;
      if (!value) this.destroyAnimation();
      if (value) this.$nextTick(this.observeBanner);
    },
  },
  mounted() {
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.motionPreference.addEventListener) this.motionPreference.addEventListener('change', this.syncAnimation);
    else this.motionPreference.addListener(this.syncAnimation);
    this.updateDocumentVisibility();
    document.addEventListener('visibilitychange', this.updateDocumentVisibility);
    this.refresh();
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.updateDocumentVisibility);
    if (this.motionPreference) {
      if (this.motionPreference.removeEventListener) this.motionPreference.removeEventListener('change', this.syncAnimation);
      else this.motionPreference.removeListener(this.syncAnimation);
    }
    if (this.motionObserver) this.motionObserver.disconnect();
    this.destroyAnimation();
  },
  methods: {
    updateDocumentVisibility() {
      this.documentVisible = document.visibilityState === 'visible';
      this.syncAnimation();
    },
    observeBanner() {
      if (this._isBeingDestroyed || this._isDestroyed || !this.hasUnread) return;
      if (!('IntersectionObserver' in window)) { this.motionVisible = true; this.syncAnimation(); return; }
      this.motionObserver = new IntersectionObserver(entries => {
        this.motionVisible = entries.some(entry => entry.isIntersecting);
        this.syncAnimation();
      });
      this.motionObserver.observe(this.$el);
    },
    async syncAnimation() {
      const visible = this.hasUnread && this.motionVisible && this.documentVisible;
      if (!visible) { if (this.animationPlayer) this.animationPlayer.pause(); return; }
      if (this.motionPreference && this.motionPreference.matches) {
        if (this.animationPlayer) this.animationPlayer.pause();
        this.animationReady = false;
        return;
      }
      if (this.animationPlayer) { this.animationReady = true; this.animationPlayer.play(); return; }
      if (this.loadingAnimation) return;
      this.loadingAnimation = true;
      try {
        const [player, asset] = await Promise.all([
          import('lottie-web/build/player/lottie_light'),
          import('~/assets/lottie/message-notification.json'),
        ]);
        if (this._isBeingDestroyed || this._isDestroyed || !this.hasUnread || !this.$refs.animation) return;
        this.animationPlayer = (player.default || player).loadAnimation({
          container: this.$refs.animation, renderer: 'svg', loop: true, autoplay: false,
          animationData: asset.default || asset,
        });
        const instance = this.animationPlayer;
        instance.addEventListener('DOMLoaded', () => {
          if (this.animationPlayer !== instance) return;
          this.animationReady = !(this.motionPreference && this.motionPreference.matches);
          if (this.animationReady && this.motionVisible && this.documentVisible) instance.play();
        });
        instance.addEventListener('data_failed', () => { if (this.animationPlayer === instance) this.destroyAnimation(); });
      } catch (e) { /* The static icon and CSS attention remain available. */ }
      finally { this.loadingAnimation = false; }
    },
    destroyAnimation() {
      if (this.animationPlayer) this.animationPlayer.destroy();
      this.animationPlayer = null;
      this.animationReady = false;
    },
    async refresh() {
      if (this.refreshing || this._isBeingDestroyed || this._isDestroyed ||
          document.visibilityState !== 'visible' || !this.token || localStorage.getItem('token') !== this.token) return;
      this.refreshing = true;
      const token = this.token;
      try {
        // BACKEND: GET /api/enduser/profile/notifications returns { items,
        // unseenCount }; this inbox contains restaurant/management messages,
        // including review replies. GET must not set seenDate. Only the visible
        // messages tab sends PUT /notifications/seen { ids }. No new endpoint.
        const { data } = await this.$axios.get('/api/enduser/profile/notifications');
        if (this._isBeingDestroyed || this._isDestroyed || localStorage.getItem('token') !== token) return;
        if (data && Array.isArray(data.items)) {
          this.hasUnread = Number(data.unseenCount) > 0 || data.items.some(n => !n.seenDate);
        }
      } catch (e) { /* Keep the last successful result until the next refresh. */ }
      finally { this.refreshing = false; }
    },
  },
};
</script>

<style scoped>
.management-message-banner {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  min-height: 72px;
  padding: var(--lz-space-3) var(--lz-space-4);
  /* A direct child of Bootstrap's container: cancel its actual 15px gutters,
     rather than using viewport width, so the desktop canvas stays 720px. */
  margin: var(--lz-space-5) -15px var(--lz-space-6);
  border-block: 1px solid var(--lz-message-border);
  border-radius: 0;
  background: var(--lz-message-surface);
  color: var(--lz-message-ink);
  font-size: var(--lz-text-body);
  font-weight: var(--lz-weight-semibold);
  line-height: 1.7;
  text-decoration: none;
}
.management-message-banner__icon {
  flex: 0 0 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lz-saffron);
  color: var(--lz-saffron-ink);
  border-radius: var(--lz-radius-control);
}
.management-message-banner__copy { flex: 1; min-width: 0; display: grid; gap: 2px; }
.management-message-banner__animation { width: 36px; height: 36px; position: absolute; }
.management-message-banner__action { flex: 0 0 auto; color: #c21c2d; font-weight: 600; }
.management-message-banner:focus-visible { outline: 2px solid var(--lz-message-ink); outline-offset: -4px; }
.management-message-banner:active { opacity: 0.8; }

@media (prefers-reduced-motion: no-preference) {
  .management-message-banner { animation: message-enter 400ms ease-out both; }
  .management-message-banner__icon { animation: message-attention 2.8s ease-in-out infinite; }
  .management-message-banner--paused .management-message-banner__icon { animation-play-state: paused; }
  @keyframes message-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes message-attention {
    0%, 35%, 100% { transform: rotate(0) scale(1); }
    8%, 22% { transform: rotate(-9deg) scale(1.12); }
    15%, 29% { transform: rotate(8deg) scale(1.08); }
  }
}
</style>

<style>
html[data-theme="dark"] .management-message-banner__action { color: #ff7b86; }
</style>
