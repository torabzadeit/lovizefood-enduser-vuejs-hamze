<template>
  <div class="bank-card-form">
    <p class="bank-card-form__hint">شماره کارت خود را برای بازگشت وجه سفارش ثبت کنید.</p>
    <p v-if="loading" role="status">در حال دریافت اطلاعات…</p>
    <p v-if="savedNumber" class="bank-card-form__saved">
      شماره کارت ثبت‌شده:
      <bdi dir="ltr">{{ formattedNumber }}</bdi>
    </p>
    <form novalidate @submit.prevent="save">
      <div class="form-group">
        <label for="refund-bank-card" class="form-label">شماره کارت</label>
        <input
          id="refund-bank-card" ref="number" v-model="number" name="refund-bank-card"
          type="text" inputmode="numeric" autocomplete="off" spellcheck="false" dir="ltr"
          class="form-control bank-card-form__input" placeholder="شماره ۱۶ رقمی کارت"
          :disabled="!loaded || saving" :aria-invalid="feedbackError ? 'true' : 'false'"
          aria-describedby="bank-card-hint bank-card-feedback" @input="onNumberInput"
        />
        <p id="bank-card-hint" class="bank-card-form__hint">اعتبارسنجی فقط ساختار شماره کارت را بررسی می‌کند.</p>
      </div>
      <p id="bank-card-feedback" :role="feedbackError ? 'alert' : 'status'" :class="feedbackError ? 'bank-card-form__error' : 'bank-card-form__success'">{{ feedbackError || feedbackSuccess }}</p>
      <div class="form-actions">
        <button v-if="loaded" type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'در حال ذخیره…' : 'ذخیره شماره کارت' }}</button>
        <button v-else type="button" class="btn btn-outline-primary" :disabled="loading" @click="load">تلاش دوباره</button>
      </div>
    </form>
  </div>
</template>

<script>
import { normalizeBankCard, isValidBankCard, confirmedBankCard, formatBankCard } from '~/utils/bankCard.cjs';

export default {
  name: 'BankCardForm',
  props: { token: { type: String, required: true } },
  data() {
    return { number: '', savedNumber: '', loading: false, loaded: false, saving: false, submitted: false, error: '', success: '', requestId: 0 };
  },
  computed: {
    formattedNumber() { return formatBankCard(this.savedNumber); },
    // Re-evaluated for every input, including partial and pasted numbers.
    // Length feedback belongs to explicit Save, never to intermediate typing.
    cardValidation() {
      const digits = normalizeBankCard(this.number);
      if (/\D/.test(digits)) return 'characters';
      if (digits.length !== 16) return 'length';
      if (/^(\d)\1{15}$/.test(digits)) return 'repeated';
      return isValidBankCard(digits) ? 'valid' : 'checksum';
    },
    feedbackError() {
      if (this.error) return this.error;
      switch (this.cardValidation) {
        case 'characters': return 'شماره کارت فقط باید شامل رقم، فاصله یا خط تیره باشد.';
        case 'repeated': return 'شماره کارت نمی‌تواند از یک رقم تکراری تشکیل شده باشد.';
        case 'checksum': return 'شماره کارت واردشده صحیح نیست؛ رقم کنترل را بررسی کنید.';
        case 'length': return this.submitted ? 'شماره کارت باید دقیقاً ۱۶ رقم داشته باشد.' : '';
        default: return '';
      }
    },
    feedbackSuccess() {
      return this.success || (this.cardValidation === 'valid' ? 'ساختار شماره کارت صحیح است.' : '');
    },
  },
  mounted() { this.load(); window.addEventListener('storage', this.sessionChanged); },
  beforeDestroy() { this.clearPrivateState(); window.removeEventListener('storage', this.sessionChanged); },
  watch: { token() { this.clearPrivateState(); this.load(); } },
  methods: {
    current(request) {
      return !this._isBeingDestroyed && !this._isDestroyed && request === this.requestId &&
        !!this.token && localStorage.getItem('token') === this.token;
    },
    clearPrivateState() {
      this.requestId++;
      this.number = ''; this.savedNumber = ''; this.success = ''; this.error = '';
      this.submitted = false;
      this.loaded = false; this.loading = false; this.saving = false;
    },
    sessionChanged(event) {
      if (event.key === null || event.key === 'token' || event.key === 'user') {
        this.clearPrivateState();
        this.$emit('session-changed');
      }
    },
    clearFeedback() { this.error = ''; this.success = ''; },
    onNumberInput() { this.clearFeedback(); this.submitted = false; },
    async load() {
      this.clearPrivateState();
      const request = this.requestId;
      if (!this.current(request)) return;
      this.loading = true;
      try {
        // BACKEND: proposed authenticated GET/PUT /api/enduser/profile.bankCardNumber.
        // Never attach this field to cached auth.user; see BACKEND_CHANGES.md §14.
        const response = await this.$axios.get('/api/enduser/profile', { privateBankCard: true });
        if (!this.current(request)) return;
        this.savedNumber = confirmedBankCard(response.data?.bankCardNumber);
        this.loaded = true;
        this.$nextTick(() => { if (this.current(request)) this.$refs.number?.focus(); });
      } catch (_) {
        if (this.current(request)) this.error = 'دریافت اطلاعات کارت ممکن نشد. دوباره تلاش کنید.';
      } finally {
        if (this.current(request)) this.loading = false;
      }
    },
    async save() {
      if (this.saving || !this.loaded) return;
      this.clearFeedback();
      this.submitted = true;
      if (this.cardValidation !== 'valid') {
        this.$refs.number.focus();
        return;
      }
      const request = ++this.requestId;
      if (!this.current(request)) { this.clearPrivateState(); this.$emit('session-changed'); return; }
      const card = normalizeBankCard(this.number);
      this.saving = true;
      this.savedNumber = '';
      let phase = 'profile';
      try {
        // Read fresh personal fields so a card-only edit cannot blank name/family.
        const before = await this.$axios.get('/api/enduser/profile', { privateBankCard: true });
        if (!this.current(request)) return;
        if (!before.data || typeof before.data !== 'object' || Array.isArray(before.data)) throw new Error('profile');
        phase = 'save';
        // BACKEND: merge omitted fields; validate/authenticate on the server too.
        // A 200 that ignores the new field is NOT confirmation. No refund is sent here.
        await this.$axios.put('/api/enduser/profile', {
          name: before.data.name ?? before.data.first_name ?? '',
          family: before.data.family ?? before.data.last_name ?? '',
          bankCardNumber: card,
        }, { privateBankCard: true });
        if (!this.current(request)) return;
        phase = 'readback';
        const after = await this.$axios.get('/api/enduser/profile', { privateBankCard: true });
        if (!this.current(request)) return;
        if (confirmedBankCard(after.data?.bankCardNumber) !== card) {
          this.error = 'ذخیره شماره کارت در سرور تأیید نشد. دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.';
          return;
        }
        this.savedNumber = card;
        this.number = '';
        this.submitted = false;
        this.success = 'شماره کارت ذخیره شد.';
      } catch (_) {
        if (this.current(request)) this.error = phase === 'readback'
          ? 'تأیید ذخیره شماره کارت ممکن نشد. دوباره تلاش کنید.'
          : 'ذخیره شماره کارت ممکن نشد. دوباره تلاش کنید.';
      } finally {
        if (this.current(request)) this.saving = false;
        else if (!this._isDestroyed) this.clearPrivateState();
      }
    },
  },
};
</script>

<style scoped>
.bank-card-form__hint { margin: 8px 0 16px; color: var(--lz-ink-muted); font-size: var(--lz-text-sm); line-height: 1.8; }
.bank-card-form__saved { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 20px; }
.bank-card-form__saved bdi { unicode-bidi: isolate; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bank-card-form__input { text-align: left; unicode-bidi: isolate; min-height: 48px; background: var(--lz-surface); color: var(--lz-ink); border-color: var(--lz-border-strong); }
.bank-card-form__input::placeholder { text-align: right; color: var(--lz-ink-muted); }
.bank-card-form__input:focus-visible { outline: 2px solid var(--lz-ink); outline-offset: 3px; }
.bank-card-form__error { color: var(--lz-danger); line-height: 1.8; }
.bank-card-form__success { color: var(--lz-success); line-height: 1.8; }
.form-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.form-actions .btn { min-height: 44px; }
</style>
