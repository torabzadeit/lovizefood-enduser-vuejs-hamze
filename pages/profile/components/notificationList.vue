<template>
  <div class="notif">
    <p v-if="loading" class="notif__state">در حال بارگذاری…</p>
    <p v-else-if="!items.length" class="notif__state">پیامی ندارید.</p>

    <ul v-else class="notif__list">
      <li
        v-for="n in items"
        :key="n.id"
        class="notif__item"
        :class="{ 'notif__item--unseen': !n.seenDate }"
      >
        <div class="notif__head">
          <span class="notif__dot" v-if="!n.seenDate" aria-label="خوانده نشده"></span>
          <strong class="notif__title">{{ n.title }}</strong>
          <small class="notif__date">{{ faDate(n.createDate) }}</small>
        </div>

        <!-- Management's answer to a review: which food and what the customer
             wrote are quoted above the answer, so the message makes sense alone. -->
        <div v-if="n.type === 'review_reply' && n.data" class="notif__review">
          <div class="notif__review-head">
            <span class="notif__review-product">{{ n.data.productTitle }}</span>
            <span class="notif__review-stars" :aria-label="'امتیاز شما: ' + n.data.rating + ' از ۵'">
              <span
                v-for="star in 5"
                :key="star"
                class="notif__review-star"
                :class="{ 'notif__review-star--on': star <= Number(n.data.rating) }"
                aria-hidden="true"
              >★</span>
            </span>
          </div>
          <p v-if="n.data.comment" class="notif__review-comment">«{{ n.data.comment }}»</p>
        </div>

        <p class="notif__body" :class="{ 'notif__body--reply': n.type === 'review_reply' }">{{ n.body }}</p>

        <div class="notif__actions">
          <nuxt-link v-if="n.linkUrl" :to="n.linkUrl" class="notif__link">مشاهده</nuxt-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
/*
 * BACKEND CONTRACT: GET /api/enduser/profile/notifications
 *
 *   { items: [ ... ], unseenCount: <number> }
 *
 * Every item:
 *   id         string   unique
 *   title      string   headline, shown as is
 *   body       string   the message text, shown as is
 *   createDate ISO date
 *   seenDate   ISO date | null   set by PUT .../notifications/seen { ids }
 *   linkUrl    string | null     optional in-app route, shows a «مشاهده» link
 *   type       string | null     optional; only 'review_reply' is special here
 *   data       object | null     extra fields for the type
 *
 * type 'review_reply': the restaurant management answered a customer's review
 * of a product. Create one notification for that customer at the moment
 * management saves the answer (the same moment `adminReply` appears on that
 * line of GET /profile/orders/{id}/review).
 *   title  fixed text: «پاسخ مدیریت به نظر شما»
 *   body   the management's answer, exactly as written in the admin panel
 *   data   { productTitle, rating (1-5), comment (the customer's own review
 *            text, may be empty), orderNumber }
 * The app quotes productTitle, the stars and the customer's comment above the
 * answer, so the message reads on its own.
 */
export default {
  name: 'NotificationList',
  props: { active: { type: Boolean, default: false } },
  data() {
    return { loading: false, items: [], markingSeen: false };
  },
  mounted() {
    document.addEventListener('visibilitychange', this.onVisibility);
    this.load();
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.onVisibility);
  },
  watch: {
    active(value) { if (value) this.load(); },
  },
  methods: {
    onVisibility() {
      if (this.active && document.visibilityState === 'visible') this.load();
    },
    async load() {
      if (this.loading || !localStorage.getItem('token')) return;
      const token = localStorage.getItem('token');
      let loaded = false;
      this.loading = true;
      try {
        // BACKEND: GET may record delivery, but must leave seenDate unchanged.
        // Only an active messages tab in a visible document sends seen IDs.
        const { data } = await this.$axios.get('/api/enduser/profile/notifications');
        if (this._isBeingDestroyed || this._isDestroyed || localStorage.getItem('token') !== token) return;
        this.items = data.items || [];
        this.$emit('unseen', data.unseenCount || 0);
        loaded = true;
      } catch (e) { /* Keep the last loaded messages on a transient error. */ }
      finally {
        this.loading = false;
      }
      if (loaded) {
        await this.$nextTick();
        if (localStorage.getItem('token') === token) this.markVisibleSeen();
      }
    },
    async markVisibleSeen() {
      if (!this.active || this.loading || this.markingSeen || this._isBeingDestroyed || this._isDestroyed ||
          document.visibilityState !== 'visible' || !localStorage.getItem('token')) return;
      const ids = this.items.filter((n) => !n.seenDate).map((n) => n.id);
      if (!ids.length) return;
      const token = localStorage.getItem('token');
      this.markingSeen = true;
      try {
        await this.$axios.put('/api/enduser/profile/notifications/seen', { ids });
        if (this._isBeingDestroyed || this._isDestroyed || localStorage.getItem('token') !== token) return;
        const now = new Date().toISOString();
        this.items.forEach((n) => { if (ids.includes(n.id)) this.$set(n, 'seenDate', now); });
        this.$emit('unseen', this.items.filter((n) => !n.seenDate).length);
      } catch (e) { /* leaving them unseen is harmless */ }
      finally { this.markingSeen = false; }
    },
    faDate(value) {
      try {
        return new Date(value).toLocaleDateString('fa-IR', {
          month: 'long', day: 'numeric',
        });
      } catch (e) {
        return '';
      }
    },
  },
};
</script>

<style scoped>
.notif__state {
  text-align: center;
  color: var(--laviz-muted);
  font-size: 14px;
  padding: 12px 0;
  margin: 0;
}

.notif__list { list-style: none; margin: 0; padding: 0; }

.notif__item {
  padding: 10px 0;
  border-bottom: 1px solid var(--laviz-border-light, #f6f6f6);
}

.notif__item:last-child { border-bottom: 0; }

.notif__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.notif__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--laviz-primary);
  flex: 0 0 auto;
}

.notif__title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--laviz-text);
}

.notif__date { font-size: 11px; color: var(--laviz-faint, #a6a8b0); }

.notif__body {
  margin: 4px 0 6px;
  font-size: 14px;
  line-height: 24px;
  color: var(--laviz-muted);
}

/* The review being answered: food, the customer's stars and words. */
.notif__review {
  margin: 6px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--lz-surface-soft, #f6f6f6);
}

.notif__review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notif__review-product {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--laviz-text);
}

.notif__review-stars { flex: 0 0 auto; display: inline-flex; }
.notif__review-star { font-size: 14px; line-height: 1; color: var(--laviz-border, #d5d8df); }
.notif__review-star--on { color: #ffc700; }

.notif__review-comment {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--laviz-muted);
}

/* The answer itself reads as the message: normal ink, a rule on the right. The
   text is Persian, and this list's direction is not rtl, so physical sides. */
.notif__body--reply {
  color: var(--laviz-text);
  padding-right: 10px;
  border-right: 3px solid var(--lz-success, #2e9a6d);
}

.notif__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notif__link {
  font-size: 13px;
  font-weight: 600;
  color: var(--laviz-primary);
  text-decoration: none;
}

</style>
