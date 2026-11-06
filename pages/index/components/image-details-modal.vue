<template>
  <!--
    Full-screen photo viewer. The photo grows out of the thumbnail that was
    tapped and a tap anywhere (on the photo or beside it) closes it again.
  -->
  <transition name="lightbox" @enter="onEnter">
    <div v-if="visible" class="lightbox" role="dialog" aria-modal="true" aria-label="تصویر غذا" @click="close">
      <button type="button" class="lightbox__close" aria-label="بستن تصویر" @click.stop="close">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
        </svg>
      </button>
      <img class="lightbox__img" :src="src" alt="">
    </div>
  </transition>
</template>

<script>
import { reducedMotion, takeMediaRect } from '../../../utils/motion';

export default {
  name: 'image-details-modal',
  props: {
    visible: { type: Boolean, default: false },
    src: String,
  },
  watch: {
    visible(open) {
      if (typeof document !== 'undefined') document.body.style.overflow = open ? 'hidden' : '';
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKey);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  },
  methods: {
    onKey(e) {
      if (this.visible && e.key === 'Escape') this.close();
    },
    close() {
      this.$emit('update:visible', false);
    },
    // Grow the photo out of the thumbnail that was tapped.
    onEnter(el) {
      const img = el.querySelector('.lightbox__img');
      const from = takeMediaRect();
      if (!img || reducedMotion()) return;
      const to = img.getBoundingClientRect();
      if (from && from.width && to.width) {
        const scale = from.width / to.width;
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        img.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, borderRadius: '28px' },
            { transform: 'translate(0, 0) scale(1)', borderRadius: '20px' },
          ],
          { duration: 420, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)' },
        );
      } else {
        img.animate(
          [{ transform: 'scale(0.86)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: 320, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)' },
        );
      }
    },
  },
};
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 3200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px));
  background: rgba(20, 12, 13, 0.86);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  cursor: zoom-out;
}

.lightbox__img {
  width: min(92vw, 78vh, 560px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
}

.lightbox__close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 12px;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lightbox__close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.28s ease;
}

.lightbox-enter,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-leave-active .lightbox__img {
  transition: transform 0.28s ease;
  transform: scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-enter-active,
  .lightbox-leave-active,
  .lightbox-leave-active .lightbox__img { transition: none; }
}
</style>
