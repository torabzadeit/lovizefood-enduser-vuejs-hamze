<template>
  <!--
    The last delivered order, offered for a review at the top of the first page.
    It is a prompt, not an order list: the title says what happened, the card
    shows just enough to recognise the order (number, when it arrived, what was
    in it, the total once), and the review is one tap away: a row of stars that
    opens the review sheet with that rating already chosen, or the main button.
    The receipt stays as a quiet second action.
  -->
  <section class="lorc" aria-labelledby="lorc-title">
    <article class="lorc__card">
    <header class="lorc__head">
      <span class="lorc__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" focusable="false">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <div class="lorc__head-text">
        <h2 id="lorc-title" class="lorc__title">آخرین سفارش شما تحویل شد</h2>
        <p class="lorc__hint">با ثبت نظر، به بهبود کیفیت ما کمک کنید.</p>
      </div>
      <button type="button" class="lorc__close" aria-label="بستن" @click="$emit('dismiss')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>

      <div class="lorc__top">
        <div class="lorc__who">
          <p class="lorc__no">سفارش {{ number }}</p>
          <p v-if="orderDate" class="lorc__meta">{{ orderDate }}</p>
        </div>
        <span class="lorc__chip">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          تحویل شده
        </span>
      </div>

      <ul v-if="lines.length" class="lorc__items">
        <li v-for="line in lines" :key="line.id">
          <span class="lorc__item-name">{{ line.title }}</span>
          <span class="lorc__item-count">× {{ line.count }}</span>
        </li>
      </ul>

      <p v-if="total" class="lorc__total">
        <span>جمع کل</span>
        <strong>{{ money(total) }} تومان</strong>
      </p>

      <div class="lorc__rate" role="group" aria-label="امتیاز شما به این سفارش">
        <span class="lorc__rate-label">امتیاز شما</span>
        <span class="lorc__stars">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="lorc__star"
            :aria-label="star + ' ستاره'"
            @click="$emit('review', order, star)"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
            </svg>
          </button>
        </span>
      </div>

      <div class="lorc__actions">
        <button type="button" class="lorc__btn lorc__btn--primary" @click="$emit('review', order)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
          </svg>
          ثبت نظر و امتیاز
        </button>
        <button type="button" class="lorc__btn lorc__btn--ghost" :disabled="downloading" @click="$emit('receipt', order)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" />
          </svg>
          {{ downloading ? '...' : 'رسید PDF' }}
        </button>
      </div>
    </article>
  </section>
</template>

<script>
import { orderDateText } from '~/utils/orderDateText';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const faDigits = (text) => String(text).replace(/[0-9]/g, (d) => FA_DIGITS[d]);

export default {
  name: 'LastOrderReviewCard',
  props: {
    order: { type: Object, required: true },
    downloading: { type: Boolean, default: false },
  },
  computed: {
    number() {
      return this.order.orderNumber || String(this.order.id || '').slice(0, 8);
    },
    // "تاریخ ثبت سفارش: سه‌شنبه ۱۸ آبان ۱۴۰۵": the one date an order card shows. The
    // delivery date and time are not shown.
    orderDate() {
      const text = orderDateText(this.order.createDate);
      return text ? `تاریخ ثبت سفارش: ${text}` : '';
    },
    lines() {
      const lines = this.order.items || this.order.orderItems || [];
      return lines.map((line, index) => ({
        id: line.id || `${this.order.id}-${index}`,
        title: line.productTitle || line.title || line.name || 'محصول',
        count: faDigits(line.count),
      }));
    },
    total() {
      return Number(this.order.totalAmount || 0);
    },
  },
  methods: {
    money(value) {
      return Number(value || 0).toLocaleString('fa-IR');
    },
  },
};
</script>

<style scoped>
/* A full-width band like the offers and menu sections below it. */
.lorc {
  direction: rtl;
  background: var(--lz-surface);
  padding: var(--lz-space-3) var(--lz-space-4);
  margin-inline: calc(50% - 50vw);
  margin-bottom: var(--lz-space-2);
}

@media (min-width: 768px) {
  .lorc { margin-inline: 0; }
}

.lorc__head {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  margin-bottom: var(--lz-space-3);
}

.lorc__badge {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-success-wash);
  color: var(--lz-success);
}

.lorc__head-text { flex: 1 1 auto; min-width: 0; }

.lorc__title {
  margin: 0;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  line-height: 1.5;
  color: var(--lz-ink);
}

.lorc__hint {
  margin: 0;
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.lorc__close {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  margin: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--lz-ink-muted);
  cursor: pointer;
}

.lorc__card {
  padding: var(--lz-space-3);
  border: 1px solid var(--lz-border-hairline);
  border-radius: var(--lz-radius-card);
  background: var(--lz-surface-raised);
  box-shadow: 0 6px 18px rgba(30, 24, 25, 0.08);
}

.lorc__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--lz-space-3);
}

.lorc__no {
  margin: 0;
  font-size: var(--lz-text-body);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

.lorc__meta {
  margin: 2px 0 0;
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.lorc__chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--lz-success-wash);
  color: var(--lz-success);
  font-size: var(--lz-text-caption);
  font-weight: 600;
  line-height: 1.6;
}

.lorc__items {
  margin: var(--lz-space-3) 0 0;
  padding: var(--lz-space-3) 0 0;
  list-style: none;
  border-top: 1px solid var(--lz-border-hairline);
}

/* Name and count stay together ("چلو وزیری × ۱"), not at opposite edges. */
.lorc__items li {
  display: flex;
  justify-content: flex-start;
  gap: var(--lz-space-2);
  font-size: var(--lz-text-sm);
  line-height: 1.9;
  color: var(--lz-ink);
}

.lorc__item-count { color: var(--lz-ink-muted); }

.lorc__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: var(--lz-space-2) 0 0;
  padding-top: var(--lz-space-2);
  border-top: 1px dashed var(--lz-border);
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.lorc__total strong {
  font-size: var(--lz-text-body);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

/* ---- quick rating ---- */
.lorc__rate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lz-space-3);
  margin-top: var(--lz-space-3);
  padding: var(--lz-space-2) var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface-light);
}

.lorc__rate-label {
  font-size: var(--lz-text-sm);
  font-weight: 600;
  color: var(--lz-ink);
}

.lorc__stars { display: inline-flex; }

.lorc__star {
  width: 40px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  /* Saffron outline: a gold star reads as "rate me" on both themes. */
  color: var(--lz-saffron);
  cursor: pointer;
  transition: transform 0.12s ease;
}

.lorc__star:active { transform: scale(0.85); }

/* ---- actions ---- */
.lorc__actions {
  display: flex;
  gap: var(--lz-space-2);
  margin-top: var(--lz-space-3);
}

.lorc__btn {
  min-height: 48px;
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
  cursor: pointer;
  transition: transform 0.12s ease;
}

.lorc__btn:active { transform: scale(0.96); }
.lorc__btn:disabled { opacity: 0.5; cursor: default; }

/* The main action: solid brand, white text, in both themes. */
.lorc__btn--primary {
  flex: 1 1 auto;
  border: 0;
  background: var(--lz-accent);
  color: #fff;
}

.lorc__btn--ghost {
  flex: 0 0 auto;
  border: 1px solid var(--lz-border-strong);
  background: transparent;
  color: var(--lz-ink);
}

@media (prefers-reduced-motion: reduce) {
  .lorc__btn,
  .lorc__star { transition: none; }
}
</style>
