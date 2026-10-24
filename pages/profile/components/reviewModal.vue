<template>
  <b-modal id="review-modal" centered hide-footer :title="'ثبت نظر برای سفارش ' + shortOrderId">
    <div v-if="loading" class="review-modal__state">در حال بارگذاری…</div>

    <div v-else-if="!rateable" class="review-modal__state">
      این سفارش هنوز قابل امتیازدهی نیست. پس از تحویل می‌توانید نظر خود را ثبت کنید.
    </div>

    <div v-else-if="!enabledItems.length" class="review-modal__state">
      برای محصولات این سفارش امکان ثبت نظر فعال نیست.
    </div>

    <template v-else>
      <div v-for="item in enabledItems" :key="item.productId" class="review-item">
        <div class="review-item__head">
          <span class="review-item__title">{{ item.title }}</span>
          <span v-if="item.adminReply" class="review-item__answered">پاسخ داده شده</span>
        </div>

        <div class="review-stars" role="radiogroup" :aria-label="'امتیاز ' + item.title">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="review-stars__btn"
            :class="{ 'review-stars__btn--on': star <= (draft[item.productId].rating || 0) }"
            role="radio"
            :aria-checked="draft[item.productId].rating === star"
            :aria-label="star + ' ستاره'"
            @click="setRating(item.productId, star)"
          >★</button>
          <span class="review-stars__hint">{{ ratingLabel(draft[item.productId].rating) }}</span>
        </div>

        <textarea
          v-model="draft[item.productId].comment"
          class="review-item__comment"
          rows="2"
          placeholder="نظر شما درباره این محصول (اختیاری)"
        ></textarea>

        <!-- Management's answer is the only part of a review the customer sees. -->
        <div v-if="item.adminReply" class="review-item__reply">
          <strong>پاسخ مدیریت:</strong>
          <p>{{ item.adminReply }}</p>
        </div>
      </div>

      <div class="review-modal__actions">
        <button type="button" class="review-btn" :disabled="!hasAnyRating || saving" @click="submit">
          {{ saving ? 'در حال ثبت…' : 'ثبت نظر' }}
        </button>
        <button type="button" class="review-btn review-btn--ghost" @click="close">انصراف</button>
      </div>
    </template>
  </b-modal>
</template>

<script>
const RATING_LABELS = ['', 'خیلی بد', 'بد', 'متوسط', 'خوب', 'عالی'];

export default {
  name: 'ReviewModal',
  data() {
    return {
      orderId: null,
      loading: false,
      saving: false,
      rateable: false,
      items: [],
      // Keyed by productId so the star buttons and textarea stay bound even as
      // the list re-renders.
      draft: {},
    };
  },
  computed: {
    shortOrderId() {
      return this.orderId ? String(this.orderId).slice(0, 8) : '';
    },
    enabledItems() {
      return this.items.filter((i) => i.reviewEnabled);
    },
    hasAnyRating() {
      return this.enabledItems.some((i) => (this.draft[i.productId] || {}).rating > 0);
    },
  },
  methods: {
    async open(order) {
      this.orderId = order.id;
      this.items = [];
      this.draft = {};
      this.loading = true;
      this.$bvModal.show('review-modal');
      try {
        const { data } = await this.$axios.get(`/api/enduser/profile/orders/${order.id}/review`);
        this.rateable = data.rateable;
        this.items = data.items || [];
        for (const item of this.items) {
          this.$set(this.draft, item.productId, {
            rating: item.rating || 0,
            comment: item.comment || '',
          });
        }
      } catch (e) {
        this.$bvToast.toast('دریافت اطلاعات نظر ممکن نشد.', { variant: 'danger' });
        this.close();
      } finally {
        this.loading = false;
      }
    },
    close() {
      this.$bvModal.hide('review-modal');
    },
    setRating(productId, star) {
      // Tapping the current star again clears it, so a rating can be undone.
      const current = this.draft[productId].rating;
      this.$set(this.draft[productId], 'rating', current === star ? 0 : star);
    },
    ratingLabel(rating) {
      return RATING_LABELS[rating] || '';
    },
    async submit() {
      const ratings = this.enabledItems
        .filter((i) => this.draft[i.productId].rating > 0)
        .map((i) => ({
          productId: i.productId,
          rating: this.draft[i.productId].rating,
          comment: (this.draft[i.productId].comment || '').trim() || undefined,
        }));
      if (!ratings.length) return;

      this.saving = true;
      try {
        await this.$axios.post(`/api/enduser/profile/orders/${this.orderId}/review`, { ratings });
        this.$bvToast.toast('نظر شما ثبت شد. سپاس از بازخوردتان.', { variant: 'success' });
        this.$emit('submitted', this.orderId);
        this.close();
      } catch (e) {
        const msg = e?.response?.data?.message || 'ثبت نظر ممکن نشد.';
        this.$bvToast.toast(msg, { variant: 'danger' });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
.review-modal__state {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--laviz-muted);
  font-size: 14px;
  line-height: 24px;
}

.review-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--laviz-border-light, #f6f6f6);
}

.review-item:last-of-type { border-bottom: 0; }

.review-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.review-item__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  color: var(--laviz-text);
}

.review-item__answered {
  font-size: 12px;
  font-weight: 600;
  color: var(--laviz-success);
  background: #eaf8ef;
  border-radius: 6px;
  padding: 2px 8px;
}

.review-stars {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 8px;
}

.review-stars__btn {
  border: 0;
  background: transparent;
  color: var(--laviz-border, #d5d8df);
  font-size: 26px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.1s ease;
}

.review-stars__btn:hover { transform: scale(1.1); }
.review-stars__btn--on { color: #ffc700; }

.review-stars__hint {
  margin-right: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--laviz-muted);
}

.review-item__comment {
  width: 100%;
  border: 1px solid var(--laviz-border);
  border-radius: var(--laviz-radius-sm);
  padding: 8px 10px;
  font-size: 14px;
  line-height: 24px;
  font-family: inherit;
  resize: vertical;
}

.review-item__comment:focus {
  outline: none;
  border-color: var(--laviz-primary);
}

.review-item__reply {
  margin-top: 8px;
  background: var(--laviz-surface-light, #f6f6f6);
  border-radius: var(--laviz-radius-sm);
  padding: 8px 10px;
  font-size: 13px;
  line-height: 22px;
}

.review-item__reply p { margin: 2px 0 0; color: var(--laviz-muted); }

.review-modal__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.review-btn {
  flex: 1;
  border: 0;
  border-radius: var(--laviz-radius-sm);
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: var(--laviz-primary);
  cursor: pointer;
}

.review-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.review-btn--ghost {
  flex: 0 0 auto;
  background: var(--laviz-surface-soft, #eeeef0);
  color: var(--laviz-text);
}
</style>
