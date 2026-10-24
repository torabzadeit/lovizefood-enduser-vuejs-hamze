<template>
  <!-- Only shown when the customer actually has something to use: a personal
       code issued to them, or a shop-wide campaign. An empty section would be
       a dead row on the menu. -->
  <section v-if="offers.length" class="offers">
    <h2 class="offers__title">تخفیف‌ها و کوپن‌ها</h2>

    <div class="offers__list">
      <button
        v-for="offer in offers"
        :key="offer.id"
        type="button"
        class="offer-card"
        :class="{ 'offer-card--personal': offer.personal }"
        @click="open(offer)"
      >
        <span class="offer-card__head">
          <span class="offer-card__badge">{{ offer.badge }}</span>
          <span class="offer-card__icon" aria-hidden="true">{{ offer.personal ? '🎁' : '٪' }}</span>
        </span>
        <span class="offer-card__title">{{ offer.title }}</span>
        <span class="offer-card__hint">{{ offer.hint }}</span>
        <span class="offer-card__more">جزئیات ›</span>
      </button>
    </div>

    <!-- Bottom sheet, matching the rest of the app's sheets. -->
    <transition name="offer-sheet">
      <div v-if="selected" class="offer-sheet" @click.self="close">
        <div class="offer-sheet__panel" role="dialog" :aria-label="selected.title">
          <div class="offer-sheet__grip" aria-hidden="true"></div>

          <header class="offer-sheet__header">
            <button type="button" class="offer-sheet__close" aria-label="بستن" @click="close">✕</button>
            <h3 class="offer-sheet__title">{{ selected.title }}</h3>
          </header>

          <p v-if="selected.scope" class="offer-sheet__scope">{{ selected.scope }}</p>

          <div class="offer-sheet__highlight">
            <span class="offer-sheet__highlight-icon" aria-hidden="true">{{ selected.personal ? '🎁' : '٪' }}</span>
            <span>
              <strong>{{ selected.headline }}</strong>
              <small v-if="selected.sub">{{ selected.sub }}</small>
            </span>
          </div>

          <p v-if="selected.code" class="offer-sheet__code">
            کد:
            <span class="offer-sheet__code-value" @click="copy(selected.code)">{{ selected.code }}</span>
            <small v-if="copied === selected.code">کپی شد</small>
          </p>

          <p class="offer-sheet__note">
            کوپن‌ها در صفحه «سبد خرید» قابل انتخاب هستند؛ در هر سفارش امکان انتخاب یک کوپن وجود دارد.
          </p>

          <button type="button" class="offer-sheet__ok" @click="close">متوجه شدم</button>
        </div>
      </div>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'DiscountSection',
  props: {
    /** Codes issued to this customer, from /profile/active-discount-codes. */
    personalCodes: { type: Array, default: () => [] },
    /** Shop-wide campaigns anyone can use. */
    publicOffers: { type: Array, default: () => [] },
  },
  data() {
    return { selected: null, copied: null };
  },
  computed: {
    offers() {
      const personal = this.personalCodes.map((c) => ({
        id: 'p-' + c.id,
        personal: true,
        badge: 'ویژه شما',
        title: c.title || 'کد تخفیف شما',
        hint: this.remaining(c),
        headline: `تا ${this.fa(c.amount)} تومان تخفیف`,
        sub: this.remaining(c),
        scope: 'این کد فقط برای شما صادر شده است',
        code: c.code,
      }));

      const shop = this.publicOffers.map((o) => ({
        id: 'g-' + (o.id || o.code),
        personal: false,
        badge: 'همه مشتریان',
        title: o.title || 'تخفیف ویژه',
        hint: o.hint || 'روی سبد خرید اعمال می‌شود',
        headline: o.headline || o.title,
        sub: o.sub || '',
        scope: 'ویژه این سفارش',
        code: o.code || '',
      }));

      return [...personal, ...shop];
    },
  },
  methods: {
    fa(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    },
    remaining(c) {
      if (c.remainingDays === null || c.remainingDays === undefined) return 'بدون محدودیت زمانی';
      if (c.remainingDays === 0) return 'امروز آخرین مهلت';
      if (c.remainingDays === 1) return 'یک روز مانده';
      return `${this.fa(c.remainingDays)} روز مانده`;
    },
    open(offer) {
      this.selected = offer;
      if (process.client) document.body.style.overflow = 'hidden';
    },
    close() {
      this.selected = null;
      if (process.client) document.body.style.overflow = '';
    },
    copy(code) {
      const done = () => {
        this.copied = code;
        setTimeout(() => { this.copied = null; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => {});
      } else {
        const el = document.createElement('input');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(el);
      }
    },
  },
  beforeDestroy() {
    if (process.client) document.body.style.overflow = '';
  },
};
</script>

<style scoped>
/* Full-width band, matching the menu sections: edge to edge, with the canvas
   showing only as the gap above and below. */
.offers {
  background: var(--lz-surface);
  padding: var(--lz-space-3) var(--lz-space-4);
  /* Same viewport-relative full bleed as the menu bands. */
  margin-inline: calc(50% - 50vw);
  margin-bottom: var(--lz-space-2);
}

@media (min-width: 768px) {
  .offers {
    margin-inline: 0;
  }
}

.offers__title {
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  letter-spacing: var(--lz-track-lg);
  color: var(--lz-ink);
  margin: 0 0 var(--lz-space-3);
}

.offers__list {
  display: flex;
  gap: var(--lz-space-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: var(--lz-space-1);
}

.offers__list::-webkit-scrollbar { display: none; }

.offer-card {
  flex: 0 0 auto;
  width: 170px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--lz-space-3);
  border: 1px solid var(--lz-border-hairline);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface);
  box-shadow: var(--lz-shadow-chip);
  font-family: inherit;
  text-align: right;
  cursor: pointer;
}

.offer-card--personal {
  border-color: var(--lz-accent);
  background: var(--lz-accent-wash);
}

.offer-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.offer-card__badge {
  font-size: var(--lz-text-caption);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-accent-strong);
}

.offer-card__icon { font-size: var(--lz-text-body); }

.offer-card__title {
  font-size: var(--lz-text-body);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

.offer-card__hint {
  font-size: var(--lz-text-caption);
  color: var(--lz-ink-muted);
}

.offer-card__more {
  margin-top: var(--lz-space-1);
  font-size: var(--lz-text-caption);
  color: var(--lz-accent-strong);
}

/* ---- bottom sheet ---- */
.offer-sheet {
  position: fixed;
  inset: 0;
  z-index: 1035;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: flex-end;
}

.offer-sheet__panel {
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--lz-surface);
  border-radius: var(--lz-radius-card) var(--lz-radius-card) 0 0;
  padding: var(--lz-space-2) var(--lz-space-4) calc(var(--lz-space-4) + env(safe-area-inset-bottom));
}

.offer-sheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--lz-border);
  margin: var(--lz-space-1) auto var(--lz-space-2);
}

.offer-sheet__header {
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  justify-content: space-between;
  gap: var(--lz-space-3);
}

.offer-sheet__title {
  margin: 0;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

.offer-sheet__close {
  border: 0;
  background: transparent;
  font-size: 18px;
  color: var(--lz-ink);
  cursor: pointer;
  padding: var(--lz-space-1);
}

.offer-sheet__scope {
  margin: var(--lz-space-3) 0 var(--lz-space-2);
  padding: var(--lz-space-3);
  border: 1px solid var(--lz-border-hairline);
  border-radius: var(--lz-radius-control);
  font-size: var(--lz-text-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__highlight {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  padding: var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-success-wash);
}

.offer-sheet__highlight-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-surface);
  font-size: var(--lz-text-body);
}

.offer-sheet__highlight strong {
  display: block;
  font-size: var(--lz-text-lg);
  color: var(--lz-ink);
}

.offer-sheet__highlight small {
  display: block;
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.offer-sheet__code {
  margin: var(--lz-space-3) 0 0;
  font-size: var(--lz-text-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__code-value {
  font-weight: var(--lz-weight-semibold);
  letter-spacing: 1px;
  color: var(--lz-accent);
  cursor: pointer;
  margin: 0 var(--lz-space-1);
}

.offer-sheet__code small { color: var(--lz-success); margin-right: var(--lz-space-2); }

.offer-sheet__note {
  margin: var(--lz-space-3) 0 var(--lz-space-4);
  padding: var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface-light);
  font-size: var(--lz-text-sm);
  line-height: var(--lz-leading-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__ok {
  width: 100%;
  border: 1px solid var(--lz-border);
  border-radius: var(--lz-radius-chip);
  background: var(--lz-surface);
  padding: var(--lz-space-3);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
  cursor: pointer;
}

.offer-sheet-enter-active,
.offer-sheet-leave-active { transition: opacity 0.2s ease; }

.offer-sheet-enter-active .offer-sheet__panel,
.offer-sheet-leave-active .offer-sheet__panel { transition: transform 0.25s ease; }

.offer-sheet-enter,
.offer-sheet-leave-to { opacity: 0; }

.offer-sheet-enter .offer-sheet__panel,
.offer-sheet-leave-to .offer-sheet__panel { transform: translateY(100%); }
</style>
