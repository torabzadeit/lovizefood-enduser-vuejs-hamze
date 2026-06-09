<template>
  <div class="product-card" :class="{ 'product-card--out': isOutOfStock }">
    <div class="product-card__media" @click="showImageDetailsModal(image)">
      <img class="product-card__img" :src="finalImage" :alt="name" />
      <span v-if="isSpecial" class="product-card__badge">غذای روز</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">{{ name }}</h3>
      <p v-if="isSpecial && specialDaysText" class="product-card__special">{{ specialDaysText }}</p>
      <p v-if="description" class="product-card__desc">{{ description }}</p>
      <div class="product-card__price">
        <template v-if="discount_percent">
          <span class="product-card__price-old">{{ formatNum(price) }}</span>
          <span class="product-card__price-now">{{ formatNum(price - (price / 100) * discount_percent) }} تومان</span>
          <span class="product-card__discount-tag">{{ discount_percent }}٪</span>
        </template>
        <template v-else>
          <span class="product-card__price-now">{{ formatNum(price) }} تومان</span>
        </template>
      </div>
    </div>
    <div class="product-card__actions">
      <template v-if="!isOutOfStock">
        <div class="product-card__stepper">
          <button type="button" class="product-card__stepper-btn" @click="$emit('decrease')" aria-label="کم کردن">−</button>
          <span class="product-card__count">{{ count }}</span>
          <button type="button" class="product-card__stepper-btn product-card__stepper-btn--plus" @click="$emit('increase')" aria-label="افزودن">+</button>
        </div>
        <span class="product-card__unit">{{ unit_name }}</span>
      </template>
      <span v-else class="product-card__out-label">اتمام موجودی</span>
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
  },
  methods: {
    showImageDetailsModal(imageString) {
      this.$emit('imageClick', imageString);
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
.product-card {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.85rem;
  padding: 0.85rem;
  background: #fff;
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(42, 35, 24, 0.04);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.product-card:hover {
  box-shadow: 0 6px 20px rgba(42, 35, 24, 0.08);
}

.product-card--out {
  opacity: 0.65;
}

.product-card__media {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.product-card__img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 12px;
}

.product-card__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  background: #c17f24;
  color: #fff;
}

.product-card__body {
  flex: 1;
  min-width: 120px;
}

.product-card__name {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 0.25rem;
  line-height: 1.4;
}

.product-card__special {
  font-size: 0.75rem;
  color: #9a6318;
  background: #f4e4c8;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  margin: 0 0 0.35rem;
}

.product-card__desc {
  font-size: 0.8rem;
  color: #7a6e62;
  margin: 0 0 0.35rem;
  line-height: 1.5;
}

.product-card__price-now {
  font-size: 1rem;
  font-weight: 800;
  color: #2a2318;
}

.product-card__price-old {
  font-size: 0.8rem;
  color: #c44536;
  text-decoration: line-through;
  margin-left: 0.35rem;
}

.product-card__discount-tag {
  font-size: 0.72rem;
  color: #2d6a4f;
  font-weight: 700;
  margin-right: 0.35rem;
}

.product-card__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 72px;
}

.product-card__stepper {
  display: flex;
  align-items: center;
  background: #f7f3eb;
  border-radius: 999px;
  padding: 2px;
  border: 1px solid rgba(42, 35, 24, 0.08);
}

.product-card__stepper-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #c17f24;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.product-card__stepper-btn--plus {
  background: linear-gradient(135deg, #c17f24, #e8a838);
  color: #fff;
}

.product-card__count {
  min-width: 1.75rem;
  text-align: center;
  font-weight: 800;
  font-size: 0.95rem;
}

.product-card__unit {
  font-size: 0.75rem;
  color: #7a6e62;
}

.product-card__out-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #c44536;
}

@media (max-width: 400px) {
  .product-card__img {
    width: 72px;
    height: 72px;
  }
}
</style>
