<template>
  <div class="order-history">
    <p v-if="!orders || orders.length === 0" class="order-history__empty">
      سفارشی ثبت نشده است.
    </p>

    <div v-else class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        :class="{ 'order-card--pending': ![4, 20].includes(Number(order.status)) }"
      >
        <div class="order-card__header">
          <span class="order-card__id">
            {{ order.orderNumber || order.id.slice(0, 8) }}
          </span>
          <span class="order-card__status" :class="`order-card__status--${statusClass(order.status)}`">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <!-- One date only: when the order was placed. The delivery date is not shown. -->
        <div class="order-card__meta">
          <small class="order-card__label">تاریخ ثبت سفارش:</small>
          <span>{{ orderDateText(order.createDate) }}</span>
        </div>

        <div class="order-card__items">
          <div
            v-for="item in parseOrderItems(order)"
            :key="item.id"
            class="order-item"
          >
            <!-- Photo, name with the count under it, and the line's price at the
                 left end. A food without a photo leaves the slot empty.
                 BACKEND: a line may carry `thumbnail`, the menu's own photo path. -->
            <div class="order-item-line">
              <span class="order-item-thumb" :class="{ 'order-item-thumb--empty': !imageSrc(item) }">
                <img v-if="imageSrc(item)" :src="imageSrc(item)" alt="" loading="lazy" @error="onImageError(item)" />
              </span>
              <span class="order-item-info">
                <span class="order-item-title">{{ item.title }}</span>
                <span class="order-item-count">تعداد: {{ item.count }}</span>
              </span>
              <span class="order-item-price">{{ formatNum(item.total) }} تومان</span>
            </div>

            <!-- What the customer wrote for this food (if anything) and the
                 restaurant's answer to it. BACKEND: a line of an order may carry
                 `review: { rating, comment, adminReply }`; every part is optional. -->
            <div v-if="item.comment || item.adminReply" class="order-item-review">
              <p v-if="item.comment" class="order-item-review__comment">
                <span class="order-item-review__label">نظر شما:</span>
                {{ item.comment }}
              </p>
              <p v-if="item.adminReply" class="order-item-review__reply">
                <span class="order-item-review__label">پاسخ رستوران:</span>
                {{ item.adminReply }}
              </p>
            </div>
          </div>
        </div>

        <div class="order-card__total">
          <strong>{{ formatNum(order.totalAmount) }} تومان</strong>
        </div>

        <!-- An order the restaurant did not accept (11) is not rated and has no
             receipt: it shows the restaurant's reason instead. -->
        <template v-if="Number(order.status) === 11">
          <p class="order-card__reject">
            <span class="order-card__reject-label">توضیح رستوران:</span>
            {{ order.rejectReason || 'رستوران نتوانست این سفارش را بپذیرد.' }}
          </p>
          <!-- It can still be ordered again: the same foods go into the basket. -->
          <div class="order-card__actions order-card__actions--solo">
            <button type="button" class="order-action-reorder" @click="$emit('reorder', order)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" />
              </svg>
              سفارش مجدد
            </button>
          </div>
        </template>
        <template v-else>
        <p class="order-card__rate-caption">به این سفارش امتیاز بدهید</p>
          <!-- Tapping a star rates every food of the order with it and opens the
               review sheet to add words or change single foods. -->
          <!-- BACKEND: §5, GET /profile/orders items[].review.rating is this customer's
               saved product rating. Average valid 1-5 values without rounding; unrated
               lines have no weight. Only absent item rating data permits order.rating
               as a legacy fallback. No usable rating leaves every star empty. -->
          <star-rating3d
            class="order-card__stars"
            :size="32"
            :value="ratingOf(order)"
            label="امتیاز شما به این سفارش"
            @select="(stars) => $emit('review', order, stars)"
          />
        <div class="order-card__actions">
          <!-- «سفارش مجدد»: the same foods, in the basket, and the basket opens. A solid
               red button, on the right of the print icon. -->
          <button type="button" class="order-action-reorder" @click="$emit('reorder', order)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" />
            </svg>
            سفارش مجدد
          </button>
          <!-- The receipt is a printer icon: same action as before (the PDF), no word. -->
          <button
            v-if="![3, 5].includes(Number(order.status))"
            type="button"
            class="order-action-icon"
            aria-label="دریافت رسید (چاپ)"
            title="رسید"
            :disabled="downloadingReceiptId === order.id"
            :aria-busy="downloadingReceiptId === order.id"
            @click="$emit('download-receipt', order)"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M7 9V3.5h10V9" />
              <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
              <rect x="7" y="14" width="10" height="6.5" rx="1" />
            </svg>
          </button>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment-jalaali';
import StarRating3d from './starRating3d.vue';
import { orderDateText } from '~/utils/orderDateText';

export default {
  name: 'OrderHistory',
  components: { StarRating3d },
  props: {
    orders: { type: Array, default: () => [] },
    downloadingReceiptId: { type: String, default: null },
  },
  data() {
    // Foods whose photo failed to load: they leave the slot empty.
    return { failedImages: {} };
  },
  methods: {
    orderDateText,
    imageSrc(item) {
      const path = item.thumbnail;
      if (!path || this.failedImages[item.id]) return '';
      if (/^https?:\/\//i.test(path)) return path;
      return (this.$axios.defaults.baseURL || '') + path;
    },
    onImageError(item) {
      this.$set(this.failedImages, item.id, true);
    },
    // Explicit item rating data (including null/0) takes precedence over a stale
    // order aggregate. Quantity never weights a customer's product rating.
    ratingOf(order) {
      const validRating = (value) => {
        if (typeof value !== 'number' && typeof value !== 'string') return 0;
        const number = Number(value);
        return Number.isFinite(number) && number >= 1 && number <= 5 ? number : 0;
      };
      const lines = order && (order.items || order.orderItems);
      const reviewedLines = (Array.isArray(lines) ? lines : []).filter(line =>
        line && line.review && Object.prototype.hasOwnProperty.call(line.review, 'rating'));
      if (reviewedLines.length) {
        const ratings = reviewedLines.map(line => validRating(line.review.rating)).filter(Boolean);
        return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
      }
      return validRating(order && order.rating);
    },
    formatJalaliDate(value, includeTime = false) {
      if (!value) return '';
      const date = moment(value);
      if (!date.isValid()) return String(value);

      const format = includeTime ? 'jYYYY/jMM/jDD - HH:mm' : 'jYYYY/jMM/jDD';
      return date.format(format).replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
    },
    statusLabel(status) {
      const map = {
        2: 'پرداخت شده (نقدی)',
        3: 'پرداخت ناموفق',
        10: 'درانتظار تایید',
        12: 'درحال آماده‌سازی',
        13: 'تحویل پیک',
        4: 'تحویل شده',
        5: 'در انتظار پرداخت',
        11: 'متأسفانه قادر به انجام این سفارش نبودیم',
        1: 'پرداخت شده',
        20: 'تحویل شده',
      };
      return map[status] || 'در پیگیری';
    },
    statusClass(status) {
      if ([4, 20].includes(Number(status))) return 'completed';
      if (Number(status) === 11) return 'rejected';
      if (Number(status) === 13) return 'shipping';
      if (Number(status) === 12) return 'preparing';
      return 'pending';
    },
    // Lines of one order, read from `items` on the order (same fields as the
    // current-order endpoint: productTitle, count, amount = unit price).
    parseOrderItems(order) {
      const lines = order.items || order.orderItems || [];
      return lines.map((line, index) => ({
        id: line.id || `${order.id}-${index}`,
        title: line.productTitle || line.title || line.name || 'محصول',
        count: line.count,
        total: line.total != null ? line.total : Number(line.amount) * Number(line.count),
        thumbnail: line.thumbnail || line.image || '',
        comment: ((line.review && line.review.comment) || '').trim(),
        adminReply: ((line.review && line.review.adminReply) || '').trim(),
      }));
    },
    formatNum(val) {
      return Number(val || 0).toLocaleString();
    },
  },
};
</script>

<style scoped>
.order-history {
  padding: 0;
}

.order-history__empty {
  text-align: center;
  color: var(--lz-ink-muted);
  font-size: 0.85rem;
  padding: 1.5rem 0;
  margin: 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.order-card {
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 10px;
  padding: 1rem;
  background: var(--lz-surface-light);
  transition: border-color 0.15s;
}

.order-card:hover {
  border-color: rgba(42, 35, 24, 0.15);
}

.order-card--pending {
  border-left: 3px solid var(--lz-accent);
}

.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.7rem;
}

.order-card__id {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--lz-ink);
}

.order-card__status {
  /* A long status (the restaurant could not do the order) wraps inside its pill. */
  min-width: 0;
  max-width: 72%;
  text-align: center;
  text-wrap: balance;
  line-height: 1.6;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 14px;
  padding: 0.3rem 0.7rem;
}

/* The restaurant could not do it: the same orange as the card on the first page. */
.order-card__status--rejected {
  background: var(--lz-warning-wash);
  color: var(--lz-ink);
  border: 1px solid var(--lz-warning);
}

.order-card__status--completed {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.order-card__status--shipping {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.order-card__status--preparing {
  background: rgba(255, 152, 0, 0.15);
  color: #ff9800;
}

.order-card__status--pending {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.order-card__meta {
  /* One line: "تاریخ ثبت سفارش: سه‌شنبه ۱۸ آبان ۱۴۰۵". */
  font-size: 0.8rem;
  color: var(--lz-ink-muted);
  margin-bottom: 0.7rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

.order-card__label {
  display: inline;
  font-size: inherit;
  font-weight: 700;
}

.order-card__items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

/* One food: photo on the right, name with the count under it, price at the left. */
.order-item-line {
  direction: rtl;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--lz-ink);
}

.order-item-thumb {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--lz-surface-soft, #eeeef0);
}

/* No photo: the slot stays empty, no placeholder drawing. */
.order-item-thumb--empty { opacity: 0.55; }

.order-item-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-item-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-item-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
}

.order-item-count {
  font-size: 0.78rem;
  color: var(--lz-ink-muted);
}

.order-item-price {
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

/* The customer's own words for a food, and the restaurant's answer. */
.order-item-review {
  margin: 0.35rem 0 0.2rem;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--lz-surface-soft, #f6f6f6);
  font-size: 0.78rem;
  line-height: 1.8;
}

.order-item-review p { margin: 0; }

.order-item-review__label {
  font-weight: 600;
  color: var(--lz-ink);
}

.order-item-review__comment { color: var(--laviz-muted); }

/* The answer: normal ink, and a rule on the right like the messages tab. */
.order-item-review__reply {
  margin-top: 4px;
  padding-right: 8px;
  border-right: 3px solid var(--lz-success, #2e9a6d);
  color: var(--lz-ink);
}

.order-card__total {
  text-align: left;
  font-size: 0.9rem;
  color: var(--lz-ink);
  margin-bottom: 0.7rem;
}

.order-card__reject {
  margin: 0;
  padding: 2px 10px 2px 0;
  border-right: 3px solid var(--lz-warning, #d47a0b);
  font-size: 0.8rem;
  line-height: 1.9;
  color: var(--lz-ink);
}

.order-card__reject-label { font-weight: 600; }

/* The reason is followed by a lone button: a little air above it. */
.order-card__actions--solo { margin-top: 0.75rem; }

.order-card__rate-caption {
  margin: 0 0 2px;
  font-size: 12px;
  color: var(--laviz-muted);
}

.order-card__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* The stars have a row of their own; the buttons come under them. */
.order-card__stars { margin-bottom: 4px; }

/* «سفارش مجدد»: solid brand red, white text; it takes the row, the print icon keeps
   its own width on the left. */
.order-action-reorder {
  flex: 1 1 auto;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--lz-accent);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.order-action-reorder:active { transform: scale(0.97); }

.order-action-btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--lz-accent);
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: opacity 0.15s;
}

/* The receipt: a square icon button the height of the review button, a 44px+
   touch target, outlined in the brand colour. */
.order-action-icon {
  flex: 0 0 auto;
  align-self: stretch;
  min-width: 48px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--lz-accent);
  border-radius: 8px;
  background: transparent;
  color: var(--lz-accent);
  cursor: pointer;
}

.order-action-icon:active { transform: scale(0.94); }
.order-action-icon:disabled { opacity: 0.5; cursor: default; }
</style>
