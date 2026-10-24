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

        <p class="notif__body">{{ n.body }}</p>

        <div class="notif__actions">
          <nuxt-link v-if="n.linkUrl" :to="n.linkUrl" class="notif__link">مشاهده</nuxt-link>
          <!-- Acknowledgement is explicit so management can report on who
               actually confirmed a message, not merely who loaded the page. -->
          <button
            v-if="!n.ackDate"
            type="button"
            class="notif__ack"
            :disabled="acking === n.id"
            @click="acknowledge(n)"
          >{{ acking === n.id ? '...' : 'تأیید دریافت' }}</button>
          <span v-else class="notif__acked">دریافت تأیید شد</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'NotificationList',
  data() {
    return { loading: false, items: [], acking: null };
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        // Fetching marks them delivered server-side; seen is set separately
        // once they are actually on screen.
        const { data } = await this.$axios.get('/api/enduser/profile/notifications');
        this.items = data.items || [];
        this.$emit('unseen', data.unseenCount || 0);
        this.markVisibleSeen();
      } catch (e) {
        this.items = [];
      } finally {
        this.loading = false;
      }
    },
    async markVisibleSeen() {
      const ids = this.items.filter((n) => !n.seenDate).map((n) => n.id);
      if (!ids.length) return;
      try {
        await this.$axios.put('/api/enduser/profile/notifications/seen', { ids });
        const now = new Date().toISOString();
        this.items.forEach((n) => { if (ids.includes(n.id)) this.$set(n, 'seenDate', now); });
        this.$emit('unseen', 0);
      } catch (e) { /* leaving them unseen is harmless */ }
    },
    async acknowledge(n) {
      this.acking = n.id;
      try {
        await this.$axios.put(`/api/enduser/profile/notifications/${n.id}/ack`);
        this.$set(n, 'ackDate', new Date().toISOString());
      } catch (e) {
        this.$bvToast.toast('ثبت تأیید ممکن نشد.', { variant: 'danger' });
      } finally {
        this.acking = null;
      }
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

.notif__ack {
  border: 1px solid var(--laviz-border);
  background: transparent;
  border-radius: 6px;
  padding: 3px 10px;
  font-family: inherit;
  font-size: 12px;
  color: var(--laviz-text);
  cursor: pointer;
}

.notif__acked { font-size: 12px; color: var(--laviz-success); }
</style>
