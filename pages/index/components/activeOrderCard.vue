<template>
  <!--
    The order that is still on its way, at the top of the first page. It says in
    plain words where the order is (title), which order it is and when it is due
    (subline), shows the stage on a short track, and offers two actions: call the
    restaurant, and open the details. It lives in the page flow, not the fixed
    header, so it scrolls away with the content.
  -->
  <section class="aoc" :class="{ 'aoc--warning': isRejected, 'aoc--leaving': leaving }" role="status" aria-live="polite">
    <div class="aoc__main">
      <!-- Not accepted: an orange warning card instead of the green one. -->
      <span class="aoc__icon" aria-hidden="true">
        <svg v-if="isRejected" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
          <path d="M12 3.5 2.8 19.5h18.4L12 3.5z" /><path d="M12 10v4.2M12 17.2v.1" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" focusable="false">
          <path d="M7 14.5A4 4 0 0 1 6.2 6.7 4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 5.8 2.7A4 4 0 0 1 17 14.5V19H7v-4.5z" />
          <path d="M7 16.5h10" />
        </svg>
      </span>
      <div class="aoc__text">
        <p class="aoc__title">{{ title }}</p>
        <p class="aoc__sub">
          سفارش {{ number }}<template v-if="deliveryText && !isRejected"> · تحویل {{ deliveryText }}</template>
        </p>
      </div>
    </div>

    <ol class="aoc__steps" aria-label="مراحل سفارش">
      <li
        v-for="(step, i) in steps"
        :key="step"
        class="aoc__step"
        :class="{
          'aoc__step--done': i < stepIndex,
          'aoc__step--current': i === stepIndex && !isRejected,
          'aoc__step--failed': isRejected && i === stepIndex,
          'aoc__step--muted': isRejected && i > stepIndex,
        }"
        :aria-current="i === stepIndex && !isRejected ? 'step' : null"
      >
        <span class="aoc__dot" aria-hidden="true">
          <svg v-if="i < stepIndex" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <svg v-else-if="isRejected && i === stepIndex" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        <span class="aoc__step-label">{{ step }}</span>
      </li>
    </ol>

    <!-- Not accepted: the restaurant says why, and the foods are on the card itself
         (there is no details panel for this state). -->
    <template v-if="isRejected">
      <p class="aoc__reject">
        <span class="aoc__reject-label">توضیح رستوران:</span>
        {{ rejectReason }}
      </p>

      <ul v-if="items.length" class="aoc__items aoc__items--card">
        <li v-for="(item, idx) in items" :key="idx">
          <span>{{ item.title }} × {{ item.count }}</span>
          <span>{{ money(item.lineTotal) }} تومان</span>
        </li>
      </ul>
    </template>

    <div class="aoc__actions">
      <a v-if="telHref" class="aoc__btn aoc__btn--ghost" :href="telHref">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
        تماس با پشتیبانی
      </a>
      <!-- «متوجه شدم»: the card fades away and the order lives on in the profile's
           order history. -->
      <button v-if="isRejected" type="button" class="aoc__btn aoc__btn--solid" @click="acknowledge">
        متوجه شدم
      </button>
      <button v-else type="button" class="aoc__btn aoc__btn--solid" :aria-expanded="expanded ? 'true' : 'false'" @click="expanded = !expanded">
        {{ expanded ? 'بستن جزئیات' : 'مشاهده جزئیات' }}
      </button>
    </div>

    <div v-if="expanded && !isRejected" class="aoc__details">
      <dl class="aoc__facts">
        <div>
          <dt>شماره سفارش</dt>
          <dd>{{ number }}</dd>
        </div>
        <div v-if="deliveryText">
          <dt>تحویل</dt>
          <dd>{{ deliveryText }}</dd>
        </div>
        <div v-if="order.deliveryAddress">
          <dt>آدرس</dt>
          <dd>{{ order.deliveryAddress }}</dd>
        </div>
        <div v-if="order.comment">
          <dt>توضیحات</dt>
          <dd>{{ order.comment }}</dd>
        </div>
      </dl>

      <ul v-if="items.length" class="aoc__items">
        <li v-for="(item, idx) in items" :key="idx">
          <span>{{ item.title }} × {{ item.count }}</span>
          <span>{{ money(item.lineTotal) }} تومان</span>
        </li>
      </ul>

      <p v-if="order.shippingCost || order.taxAmount" class="aoc__extras">
        <span v-if="order.shippingCost">ارسال: {{ money(order.shippingCost) }} تومان</span>
        <span v-if="order.taxAmount">مالیات: {{ money(order.taxAmount) }} تومان</span>
      </p>

      <div class="aoc__details-actions">
        <button type="button" class="aoc__btn aoc__btn--ghost" :disabled="downloading" @click="$emit('receipt', order)">
          {{ downloading ? '...' : 'رسید PDF' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script>
// The stages a customer can follow, and where each order status sits on them.
// Statuses are the ones the order list already knows (see orderHistory.vue):
// 1/2 paid, 10 waiting for the restaurant, 12 being prepared, 13 handed to the
// courier. Anything else is shown as "being followed up" on the first stage.
//
// BACKEND CONTRACT: the order (GET /profile/orders/current and
// GET /profile/orders) must carry `deliveryType`:
//   'sendToMe'  the restaurant's courier brings it  -> last stage «تحویل پیک شده»
//   'iWillCome' the customer comes to the restaurant -> last stage «آماده دریافت»
//   'snapp'     the customer's own Snapp courier collects it -> «آماده دریافت»
// Status 13 is the last stage for all three: for 'sendToMe' it means "handed to
// the courier", for 'iWillCome' and 'snapp' it must mean "ready, waiting at the
// restaurant" (set it when the kitchen marks a pickup order ready). Without
// `deliveryType` the card falls back to the courier wording.
const STEPS = ['ثبت سفارش', 'تأیید رستوران', 'آماده‌سازی', 'تحویل پیک شده'];
const PICKUP_TYPES = ['iWillCome', 'snapp'];
const PICKUP_LAST_STEP = 'آماده دریافت';
const PICKUP_READY_TITLE = 'سفارش شما آماده دریافت است';

// 11: the restaurant did not accept the order, at the confirmation stage. The card
// turns orange, shows the restaurant's reason (`rejectReason` on the order) and the
// foods, and offers «متوجه شدم» (see utils/orderAck.js for what the backend sends
// and how the acknowledgement is stored).
const REJECTED = 11;
const DEFAULT_REJECT_REASON = 'رستوران نتوانست این سفارش را بپذیرد.';

const BY_STATUS = {
  1: { step: 0, title: 'پرداخت سفارش شما انجام شد' },
  2: { step: 0, title: 'پرداخت سفارش شما انجام شد' },
  10: { step: 1, title: 'سفارش شما منتظر تأیید رستوران است' },
  [REJECTED]: { step: 1, title: 'سفارش شما تأیید نشد' },
  12: { step: 2, title: 'سفارش شما در حال آماده‌سازی است' },
  13: { step: 3, title: 'سفارش شما به پیک تحویل داده شد' },
};

export default {
  name: 'ActiveOrderCard',
  props: {
    order: { type: Object, required: true },
    // Lines of the order: { title, count, lineTotal }.
    items: { type: Array, default: () => [] },
    // The restaurant's landline, as the shop info has it (any digit script).
    phone: { type: String, default: '' },
    // "امروز ۱۳:۳۰" or a date: the parent knows how dates are formatted.
    deliveryText: { type: String, default: '' },
    downloading: { type: Boolean, default: false },
  },
  data() {
    return { expanded: false, leaving: false };
  },
  computed: {
    isRejected() {
      return Number(this.order.status) === REJECTED;
    },
    rejectReason() {
      return String(this.order.rejectReason || '').trim() || DEFAULT_REJECT_REASON;
    },
    // The customer collects it (comes in, or sends a Snapp) rather than the
    // restaurant's courier bringing it.
    isPickup() {
      return PICKUP_TYPES.includes(this.order.deliveryType);
    },
    steps() {
      return this.isPickup ? [...STEPS.slice(0, -1), PICKUP_LAST_STEP] : STEPS;
    },
    known() {
      const known = BY_STATUS[this.order.status] || { step: 0, title: 'سفارش شما در حال پیگیری است' };
      // "Handed to the courier" makes no sense for a pickup order.
      if (this.isPickup && Number(this.order.status) === 13) {
        return { ...known, title: PICKUP_READY_TITLE };
      }
      return known;
    },
    stepIndex() {
      return this.known.step;
    },
    title() {
      return this.known.title;
    },
    number() {
      return this.order.orderNumber || String(this.order.id || '').slice(0, 8);
    },
    // A tel: link the phone dials directly: Persian/Arabic digits to ASCII and
    // anything that is not a digit or a leading + removed.
    telHref() {
      const ascii = String(this.phone || '')
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
      const digits = ascii.replace(/(?!^\+)[^\d]/g, '');
      return digits ? `tel:${digits}` : '';
    },
  },
  methods: {
    money(value) {
      return Number(value || 0).toLocaleString();
    },
    // «متوجه شدم»: the card shrinks and fades out, then tells the page, which marks
    // the order as acknowledged (it then only shows in the profile's order history).
    acknowledge() {
      if (this.leaving) return;
      const done = () => this.$emit('acknowledge', this.order);
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (calm) {
        done();
        return;
      }
      // Pin the current height first, so the card can animate down to nothing.
      const el = this.$el;
      el.style.height = `${el.offsetHeight}px`;
      el.style.overflow = 'hidden';
      void el.offsetHeight;
      this.leaving = true;
      setTimeout(done, 480);
    },
  },
};
</script>

<style scoped>
.aoc {
  direction: rtl;
  display: flex;
  flex-direction: column;
  gap: var(--lz-space-3);
  padding: var(--lz-space-3);
  margin: var(--lz-space-3) 0;
  background: var(--lz-success-wash);
  border: 1px solid color-mix(in srgb, var(--lz-success) 28%, transparent);
  border-radius: var(--lz-radius-card);
  color: var(--lz-ink);
}

/* ---- the order was not accepted: the same card in orange ---- */
.aoc--warning {
  background: var(--lz-warning-wash);
  border-color: color-mix(in srgb, var(--lz-warning) 50%, transparent);
}

.aoc--warning .aoc__icon { background: var(--lz-warning); color: #fff; }
html[data-theme='dark'] .aoc--warning .aoc__icon { color: #1d1100; }

/* The restaurant's reason: normal ink, an orange rule on the right. */
.aoc__reject {
  margin: 0;
  padding: 2px 10px 2px 0;
  border-right: 3px solid var(--lz-warning);
  font-size: var(--lz-text-sm);
  line-height: 1.9;
  color: var(--lz-ink);
}

.aoc__reject-label {
  font-weight: 600;
  color: var(--lz-ink);
}

/* The foods sit right on the card (no details panel here). */
.aoc__items--card {
  margin: 0;
  padding: var(--lz-space-2) 0 0;
  border-top: 1px dashed color-mix(in srgb, var(--lz-warning) 45%, transparent);
  font-size: var(--lz-text-sm);
  line-height: 1.8;
}

/* The main action here is orange too, with dark text (like saffron, never white). */
.aoc--warning .aoc__btn--solid {
  border-color: var(--lz-warning);
  background: var(--lz-warning);
  color: #2b1700;
}

html[data-theme='dark'] .aoc--warning .aoc__btn--solid { color: #2b1700; }

/* The stage where it stopped: an orange dot with a cross; the later stages fade. */
.aoc__step--failed .aoc__dot {
  border-color: var(--lz-warning);
  background: var(--lz-warning);
  color: #2b1700;
}

.aoc__step--failed { color: var(--lz-ink); font-weight: 600; }
.aoc__step--muted { opacity: 0.5; }

/* «متوجه شدم»: the card shrinks, fades and drifts up. Its height is pinned in
   script first, so it can animate down to zero. */
.aoc--leaving {
  height: 0 !important;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  transition:
    height 0.45s ease,
    margin 0.45s ease,
    padding 0.45s ease,
    border-width 0.45s ease,
    opacity 0.32s ease,
    transform 0.45s ease;
}

.aoc__main {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  min-width: 0;
}

.aoc__icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-success);
  /* White on the light theme's dark green, dark on the dark theme's light green. */
  color: #fff;
}

html[data-theme='dark'] .aoc__icon,
html[data-theme='dark'] .aoc__btn--solid { color: #0e0f10; }

.aoc__text { min-width: 0; }

.aoc__title {
  margin: 0;
  font-size: var(--lz-text-body);
  font-weight: var(--lz-weight-semibold);
  line-height: 1.5;
  color: var(--lz-ink);
}

.aoc__sub {
  margin: 2px 0 0;
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

/* ---- stage track ---- */
.aoc__steps {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.aoc__step {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  color: var(--lz-ink-muted);
}

/* The line between two dots. The steps run right to left, so the next dot is on
   the left: the line starts just left of this dot and ends just right of the
   next one. Physical left/right on purpose; the card is always rtl. */
.aoc__step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 8px;
  right: calc(50% + 12px);
  left: calc(-50% + 12px);
  height: 2px;
  border-radius: 1px;
  background: var(--lz-border-strong);
}

.aoc__step--done:not(:last-child)::after { background: var(--lz-success); }

.aoc__dot {
  position: relative;
  z-index: 1;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--lz-border-strong);
  border-radius: 50%;
  background: var(--lz-surface);
  color: #fff;
}

.aoc__step--done .aoc__dot {
  border-color: var(--lz-success);
  background: var(--lz-success);
}

.aoc__step--current .aoc__dot {
  border-color: var(--lz-success);
  background: var(--lz-surface);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lz-success) 24%, transparent);
}

.aoc__step--current .aoc__dot::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lz-success);
  /* The stage the order is in right now: the inner dot breathes... */
  animation: aoc-breathe 1.8s ease-in-out infinite;
}

/* ...and a ring spreads out from it and fades, again and again. A transform and an
   opacity only, so it costs the page nothing. */
.aoc__step--current .aoc__dot::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  border: 2px solid var(--lz-success);
  border-radius: 50%;
  pointer-events: none;
  animation: aoc-ripple 1.8s ease-out infinite;
}

@keyframes aoc-ripple {
  0% { transform: scale(1); opacity: 0.75; }
  100% { transform: scale(2.3); opacity: 0; }
}

@keyframes aoc-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.62); }
}

html[data-theme='dark'] .aoc__step--done .aoc__dot { color: #0e0f10; }

.aoc__step-label {
  font-size: var(--lz-text-caption);
  line-height: 1.4;
}

.aoc__step--current { color: var(--lz-ink); font-weight: 600; }
.aoc__step--done { color: var(--lz-ink); }

/* ---- actions ---- */
.aoc__actions {
  display: flex;
  gap: var(--lz-space-2);
}

.aoc__btn {
  flex: 1 1 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 var(--lz-space-3);
  border-radius: var(--lz-radius-chip);
  font-family: inherit;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.aoc__btn:active { transform: scale(0.96); }
.aoc__btn:disabled { opacity: 0.5; cursor: default; }

.aoc__btn--solid {
  border: 1px solid var(--lz-success);
  background: var(--lz-success);
  color: #fff;
}

.aoc__btn--ghost {
  border: 1px solid var(--lz-border-strong);
  background: transparent;
  color: var(--lz-ink);
}

/* ---- details ---- */
.aoc__details {
  padding-top: var(--lz-space-3);
  border-top: 1px dashed color-mix(in srgb, var(--lz-success) 40%, transparent);
  font-size: var(--lz-text-sm);
  line-height: 1.7;
}

.aoc__facts { margin: 0; }

.aoc__facts > div {
  display: flex;
  gap: var(--lz-space-2);
}

.aoc__facts dt {
  flex: 0 0 auto;
  font-weight: 600;
  color: var(--lz-ink-muted);
}

.aoc__facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }

.aoc__items {
  margin: var(--lz-space-2) 0 0;
  padding: var(--lz-space-2) 0 0;
  list-style: none;
  border-top: 1px solid var(--lz-border-hairline);
}

.aoc__items li {
  display: flex;
  justify-content: space-between;
  gap: var(--lz-space-3);
}

.aoc__extras {
  display: flex;
  gap: var(--lz-space-3);
  margin: var(--lz-space-1) 0 0;
  color: var(--lz-ink-muted);
}

.aoc__details-actions {
  display: flex;
  gap: var(--lz-space-2);
  margin-top: var(--lz-space-3);
}

@media (prefers-reduced-motion: reduce) {
  .aoc__btn { transition: none; }
  /* Still shows which stage it is (the ring and the dot), just without moving. */
  .aoc__step--current .aoc__dot::before { animation: none; }
  .aoc__step--current .aoc__dot::after { animation: none; display: none; }
}
</style>
