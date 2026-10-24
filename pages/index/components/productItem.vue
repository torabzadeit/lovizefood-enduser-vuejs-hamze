<template>
  <div class="product-card" :class="{ 'product-card--out': isOutOfStock }">
    <!-- Left column: picture on top, the add control directly beneath it. -->
    <div class="product-card__side">
      <div class="product-card__media" @click="showImageDetailsModal(image)">
        <img class="product-card__img" :src="finalImage" alt="" @error="onImageError" />
        <span v-if="isSpecial" class="product-card__badge">غذای روز</span>
      </div>

      <div class="product-card__actions">
        <!-- Chef's-daily foods for a future day are shown as a preview only. -->
        <span v-if="locked" class="product-card__locked-label">{{ lockedLabel }}</span>
        <template v-else-if="!isOutOfStock">
          <button
            v-if="!count"
            type="button"
            class="product-card__add"
            @click="$emit('increase')"
          >
            <span class="product-card__add-plus" aria-hidden="true">+</span> افزودن
          </button>
          <div v-else class="product-card__stepper">
            <button type="button" class="product-card__stepper-btn" @click="$emit('decrease')" aria-label="کم کردن">−</button>
            <span class="product-card__count">{{ count }}</span>
            <button type="button" class="product-card__stepper-btn" @click="$emit('increase')" aria-label="افزودن">+</button>
          </div>
          <!-- The unit (پرس / عدد) sat under the add button and only added
               noise; the stepper count already reads as a quantity. The prop
               stays because the cart still labels its lines with it. -->
        </template>
        <span v-else class="product-card__out-label">اتمام موجودی</span>
      </div>
    </div>

    <div class="product-card__body">
      <h3 class="product-card__name">{{ name }}</h3>
      <span v-if="showRating && ratingCount" class="product-card__rating">
        <span class="product-card__rating-star" aria-hidden="true">★</span>
        {{ ratingAverage }}
        <small>({{ ratingCount }})</small>
      </span>
      <p v-if="isSpecial && specialDaysText" class="product-card__special">{{ specialDaysText }}</p>
      <p v-if="description" class="product-card__desc">{{ description }}</p>
      <div class="product-card__price">
        <template v-if="discount_percent">
          <span class="product-card__discount-tag">٪{{ discount_percent }}</span>
          <span class="product-card__price-old">{{ formatNum(price) }}</span>
          <span class="product-card__price-now">{{ formatNum(price - (price / 100) * discount_percent) }}</span>
          <span class="product-card__currency">تومان</span>
        </template>
        <template v-else>
          <span class="product-card__price-now">{{ formatNum(price) }}</span>
          <span class="product-card__currency">تومان</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductItem',
  emits: ['decrease', 'increase', 'imageClick'],
  props: {
    discount_percent: undefined,
    name: undefined,
    description: String,
    price: undefined,
    count: undefined,
    isOutOfStock: { type: Boolean, default: true },
    unit_name: undefined,
    image: String,
    isSpecial: { type: Boolean, default: false },
    specialDaysText: { type: String, default: '' },
    ratingAverage: { type: [Number, String], default: 0 },
    ratingCount: { type: [Number, String], default: 0 },
    showRating: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    lockedLabel: { type: String, default: 'فقط در روز خودش' },
  },
  methods: {
    showImageDetailsModal(imageString) {
      this.$emit('imageClick', imageString);
    },
    // A product whose stored file is missing would otherwise render as a broken
    // image; fall back to the same placeholder used when no image is set.
    onImageError(event) {
      const placeholder = require('@/assets/media/no-image.jpg');
      if (event.target.getAttribute('src') !== placeholder) {
        event.target.setAttribute('src', placeholder);
      }
    },
    formatNum(val) {
      return val?.toLocaleString();
    },
  },
  computed: {
    finalImage() {
      if (this.image) return this.image;
      return require('@/assets/media/no-image.jpg');
    },
  },
};
</script>

<style scoped>
/* Metrics read from the reference menu row (values are exact, not eyeballed):
   image 104x104, title 16/600/28, description 14/400/24 at 60% ink,
   price 16/600/28 with a 12/600/20 currency suffix, and a 32px-tall add
   control on #FFEDF6 with #BC0060 text at radius 6. */
.product-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  background: var(--laviz-surface);
  border-bottom: 1px solid var(--laviz-border-light, #f6f6f6);
}

.product-card--out { opacity: 0.55; }

.product-card__side {
  order: 2;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.product-card__media {
  flex: 0 0 auto;
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: var(--laviz-radius);
  overflow: hidden;
  cursor: pointer;
}

.product-card__img {
  width: 104px;
  height: 104px;
  object-fit: cover;
  background: var(--laviz-surface-light, #f6f6f6);
  display: block;
}

.product-card__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: #fff;
  background: var(--laviz-primary);
  border-radius: 999px;
  padding: 4px 8px;
}

.product-card__body {
  order: 1;
  flex: 1 1 auto;
  min-width: 0;
}

.product-card__name {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  color: var(--laviz-text);
  margin: 0 0 2px;
}

.product-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--laviz-text);
  margin-bottom: 2px;
}

.product-card__rating-star { color: #ffc700; font-size: 13px; }
.product-card__rating small { color: var(--laviz-muted); font-weight: 400; }

.product-card__special {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--laviz-primary);
  margin: 0 0 2px;
}

.product-card__desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: var(--laviz-muted);
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.product-card__price-old {
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: var(--laviz-muted);
  text-decoration: line-through;
}

.product-card__price-now {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  color: var(--laviz-text);
}

.product-card__currency {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--laviz-text);
}

.product-card__discount-tag {
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: #fff;
  background: var(--laviz-primary);
  border-radius: 999px;
  padding: 4px 7px;
}

.product-card__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.product-card__add {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 32px;
  padding: 4px 12px;
  border: 0;
  border-radius: 6px;
  background: var(--laviz-add-bg, #ffedf6);
  color: var(--laviz-add-ink, #bc0060);
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
}

.product-card__stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 104px;
  height: 32px;
  padding: 4px 12px;
  background: var(--laviz-add-bg, #ffedf6);
  color: var(--laviz-add-ink, #bc0060);
  border-radius: 6px;
}

.product-card__stepper-btn {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  width: 18px;
  height: 24px;
  cursor: pointer;
}

.product-card__count {
  min-width: 14px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}

.product-card__add-plus {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.product-card__unit {
  font-size: 12px;
  line-height: 20px;
  color: var(--laviz-faint, #a6a8b0);
}

.product-card__out-label,
.product-card__locked-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  border-radius: 6px;
  padding: 4px 12px;
  white-space: nowrap;
}

.product-card__out-label { color: var(--laviz-danger); background: #fff0ee; }
.product-card__locked-label { color: var(--laviz-muted); background: var(--laviz-surface-soft, #eeeef0); }

@media (max-width: 360px) {
  .product-card__media,
  .product-card__img { width: 88px; height: 88px; }
}
</style>
