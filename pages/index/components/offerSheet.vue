<template>
  <!--
    The details sheet of a discount code, from the approved mockup: a big title with
    the open-gift picture beside the close button, the terms under it, a green card
    with the discount (the percent coin on a white disc), the code in a dashed box
    that copies on tap, and a solid brand button.

    It moves itself to <body> when it opens. Used inside the basket, it would sit in
    a sliding (transformed) ancestor, where `position: fixed` means "fixed to the
    basket", not to the screen, and would lie under it.
  -->
  <transition name="osheet" @enter="moveToBody">
    <div v-if="offer" ref="root" class="osheet" @click.self="$emit('close')">
      <div class="osheet__panel" role="dialog" aria-modal="true" :aria-label="offer.title">
        <div class="osheet__grip" aria-hidden="true"></div>

        <header class="osheet__head">
          <button type="button" class="osheet__close" aria-label="بستن" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <img class="osheet__gift" src="@/assets/media/offers/gift-open.webp" width="380" height="336" alt="" />

          <div class="osheet__titles">
            <h3 class="osheet__title">{{ offer.title }}</h3>
            <p v-if="offer.scope" class="osheet__scope">{{ offer.scope }}</p>
          </div>
        </header>

        <div class="osheet__hero">
          <span class="osheet__badge" aria-hidden="true">
            <img src="@/assets/media/offers/percent-coin.webp" width="300" height="265" alt="" />
          </span>
          <div class="osheet__hero-text" :class="{ 'osheet__hero-text--long': (offer.headline || '').length > 13 }">
            <strong>{{ offer.headline }}</strong>
            <!-- The most the percentage can take off, when the server sets one. -->
            <small v-if="offer.cap" class="osheet__cap">{{ offer.cap }}</small>
            <small v-if="offer.sub">{{ offer.sub }}</small>
          </div>
        </div>

        <button v-if="showCode && offer.code" type="button" class="osheet__code" @click="copy(offer.code)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
          </svg>
          <span class="osheet__code-label">کد تخفیف:</span>
          <span class="osheet__code-value">{{ offer.code }}</span>
          <span v-if="copied === offer.code" class="osheet__copied" role="status">کپی شد</span>
        </button>

        <p v-if="showBasketNote" class="osheet__note">
          این تخفیف را می‌توانید در سبد خرید و در زمان پرداخت استفاده کنید.
        </p>

        <button type="button" class="osheet__ok" @click="$emit('close')">متوجه شدم</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'OfferSheet',
  props: {
    // The code's view model (see utils/offers.js); null keeps the sheet closed.
    offer: { type: Object, default: null },
    // On the first page the sheet tells where a code is chosen; in the basket the
    // customer is already there.
    showBasketNote: { type: Boolean, default: false },
    // The dashed box with the code (tap to copy). Off for the sheet that opens by
    // itself on the first page: the code is chosen in the basket there.
    showCode: { type: Boolean, default: true },
  },
  data() {
    return { copied: null };
  },
  watch: {
    // The page behind must not scroll while the sheet is open.
    offer(value) {
      if (process.client) document.body.style.overflow = value ? 'hidden' : '';
    },
  },
  methods: {
    // Called right after insertion and before the first paint, so the slide-up is
    // not interrupted. Vue removes the element from wherever it is on leave.
    moveToBody(el) {
      if (process.client && el && el.parentNode !== document.body) document.body.appendChild(el);
    },
    copy(code) {
      const done = () => {
        this.copied = code;
        setTimeout(() => { this.copied = null; }, 2000);
      };
      // The old way works where the clipboard API is missing or refused (a page
      // without permission, an in-app browser).
      const fallback = () => {
        const el = document.createElement('input');
        el.value = code;
        el.setAttribute('readonly', '');
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(el);
        el.select();
        try { if (document.execCommand('copy')) done(); } catch (e) { /* nothing more to try */ }
        document.body.removeChild(el);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(fallback);
      } else {
        fallback();
      }
    },
  },
  beforeDestroy() {
    if (process.client) document.body.style.overflow = '';
    // An open sheet lives in <body>, outside this component's own DOM.
    const root = this.$refs.root;
    if (root && root.parentNode) root.parentNode.removeChild(root);
  },
};
</script>

<style scoped>
.osheet {
  position: fixed;
  /* Physical sides on purpose: the sheet is flush with both screen edges. */
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  /* Above bootstrap's modals (1050) and their backdrop, so it covers the basket. */
  z-index: 1100;
  background: var(--lz-modal-backdrop);
  display: flex;
  align-items: flex-end;
}

.osheet__panel {
  direction: rtl;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--lz-surface-raised);
  border: 1px solid var(--lz-sheet-border);
  border-bottom: 0;
  box-shadow: var(--lz-shadow-sheet);
  border-radius: 24px 24px 0 0;
  padding: var(--lz-space-2) var(--lz-space-4) calc(20px + env(safe-area-inset-bottom));
}

.osheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--lz-border-strong);
  margin: var(--lz-space-1) auto var(--lz-space-1);
}

/* ---- header: close + gift on the left, title and terms on the right ---- */
.osheet__head {
  position: relative;
  min-height: 124px;
}

.osheet__close {
  position: absolute;
  left: 0;
  top: 8px;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: var(--lz-accent-wash);
  color: var(--lz-ink);
  cursor: pointer;
}

.osheet__gift {
  position: absolute;
  left: 38px;
  top: 0;
  width: 116px;
  height: auto;
  pointer-events: none;
}

.osheet__titles {
  /* Leaves the left side to the gift and the close button. */
  padding: 34px 0 0 130px;
}

.osheet__title {
  margin: 0;
  font-size: 30px;
  font-weight: var(--lz-weight-semibold);
  line-height: 1.35;
  color: var(--lz-ink);
}

.osheet__scope {
  margin: var(--lz-space-1) 0 0;
  font-size: var(--lz-text-body);
  line-height: 1.8;
  color: var(--lz-ink-muted);
}

/* ---- the discount: a green card, the percent coin on a white disc ---- */
.osheet__hero {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  margin-top: var(--lz-space-3);
  padding: var(--lz-space-3) var(--lz-space-4);
  border-radius: 22px;
  color: #fff;
  /* Both ends are deep enough for white text, in both themes. */
  background: linear-gradient(135deg, #0fa653 0%, #067a3d 100%);
  box-shadow: 0 10px 24px rgba(8, 128, 64, 0.3);
}

.osheet__badge {
  flex: 0 0 auto;
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}

.osheet__badge img {
  width: 74px;
  height: auto;
}

.osheet__hero-text {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
}

.osheet__hero-text strong {
  display: block;
  font-size: 36px;
  font-weight: var(--lz-weight-semibold);
  line-height: 1.3;
}

.osheet__hero-text--long strong { font-size: 26px; }

.osheet__hero-text small {
  display: block;
  font-size: var(--lz-text-body);
  line-height: 1.6;
  color: #fff;
  opacity: 0.94;
}

.osheet__hero-text .osheet__cap {
  font-weight: 500;
  opacity: 1;
}

/* ---- the code: a dashed box, one tap copies it ---- */
.osheet__code {
  width: 100%;
  min-height: 54px;
  margin-top: var(--lz-space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lz-space-2);
  padding: 0 var(--lz-space-3);
  border: 1.5px dashed var(--lz-border-strong);
  border-radius: 14px;
  background: var(--lz-surface-light);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  color: var(--lz-ink);
  cursor: pointer;
}

.osheet__code svg { flex: 0 0 auto; color: var(--lz-ink-muted); }
.osheet__code-label { color: var(--lz-ink-muted); }

.osheet__code-value {
  direction: ltr;
  font-weight: var(--lz-weight-semibold);
  letter-spacing: 0.5px;
}

.osheet__copied {
  font-size: var(--lz-text-sm);
  font-weight: 500;
  color: var(--lz-success);
}

.osheet__note {
  margin: var(--lz-space-3) 0 0;
  padding: var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface-light);
  font-size: var(--lz-text-body);
  font-weight: 500;
  line-height: var(--lz-leading-body);
  color: var(--lz-ink);
}

/* The main action: solid brand, white text, in both themes. */
.osheet__ok {
  width: 100%;
  min-height: 56px;
  margin-top: var(--lz-space-3);
  border: 0;
  border-radius: 999px;
  background: var(--lz-accent);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  color: #fff;
  cursor: pointer;
}

.osheet__ok:active { transform: scale(0.98); }

/* ---- motion ---- */
.osheet-enter-active,
.osheet-leave-active { transition: opacity 0.2s ease; }

.osheet-enter-active .osheet__panel,
.osheet-leave-active .osheet__panel { transition: transform 0.25s ease; }

.osheet-enter,
.osheet-leave-to { opacity: 0; }

.osheet-enter .osheet__panel,
.osheet-leave-to .osheet__panel { transform: translateY(100%); }

@media (prefers-reduced-motion: reduce) {
  .osheet-enter-active,
  .osheet-leave-active,
  .osheet-enter-active .osheet__panel,
  .osheet-leave-active .osheet__panel { transition: none; }
}
</style>
