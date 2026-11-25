<template>
  <div class="restaurant-checkout">
    <b-modal v-if="['checkout', 'otp', 'online'].includes(state.phase)" ref="checkoutModal" visible title="سبد خرید شما" body-class="rc-body" footer-class="rc-checkout-footer" content-class="rc-modal" dialog-class="rc-checkout-dialog" size="lg" no-close-on-backdrop :aria-hidden="state.phase === 'otp' ? 'true' : null" :inert="state.phase === 'otp' ? '' : null" :no-close-on-esc="blocked || state.phase === 'otp'" :hide-header-close="blocked" @shown="focusPhone" @close="$emit('close')">
      <div class="rc" dir="rtl" data-checkout="checkout">
        <fieldset class="rc-choice" :disabled="blocked">
          <legend>نحوه دریافت سفارش</legend>
          <label v-for="option in fulfilments" :key="option.value" :class="{ active: state.fulfilment === option.value }">
            <input type="radio" name="restaurant-fulfilment" :value="option.value" :checked="state.fulfilment === option.value" @change="checkout.setFulfilment(option.value)" /><span class="rc-fulfilment-icon" :class="option.value === 'dine_in' ? 'rc-dine-icon' : 'rc-takeaway-icon'" aria-hidden="true"></span>{{ option.text }}
          </label>
        </fieldset>
        <section class="rc-section">
          <label for="restaurant-phone">شماره همراه مشتری <span class="rc-required">(الزامی)</span></label>
          <div class="rc-phone-group">
            <input id="restaurant-phone" class="rc-input rc-phone" type="tel" inputmode="none" readonly autocomplete="off" :disabled="blocked" :value="state.phone" :aria-invalid="state.phoneTouched && !validPhone ? 'true' : 'false'" aria-describedby="restaurant-phone-feedback" placeholder="۰۹۱۲۳۴۵۶۷۸۹" @keydown="phoneKeydown" @blur="state.phoneTouched = true" />
            <button id="restaurant-phone-verify" type="button" class="rc-button rc-secondary rc-view-discounts" :disabled="!validPhone || blocked || state.identifying || state.verified" @click="openOtp">تأیید شماره همراه</button>
          </div>
          <div class="rc-phone-pad" dir="ltr" aria-label="صفحه کلید شماره همراه">
            <button v-for="digit in 10" :key="digit" type="button" :disabled="blocked" :aria-label="number(digit - 1)" @click="phoneDigit(String(digit - 1))">{{ number(digit - 1) }}</button>
            <button type="button" :disabled="blocked" aria-label="حذف رقم آخر" @click="phoneDelete">⌫</button>
          </div>
          <p id="restaurant-phone-feedback" class="rc-phone-feedback" :class="state.phoneTouched && !validPhone ? 'rc-error' : 'rc-verified'" aria-live="polite">{{ state.phoneTouched && !validPhone ? 'شماره همراه معتبر وارد کنید.' : state.verified ? 'شماره همراه تأیید شد.' : '\u00a0' }}</p>
        </section>
        <section class="rc-section">
          <h2>کد تخفیف</h2>
          <p v-if="!state.verified" class="rc-discount-helper">برای مشاهده کدهای تخفیف خود ابتدا شماره همراه خود را وارد و تأیید نمایید.</p>
          <discount-section v-if="state.verified && state.codes.length" mode="basket" :personal-codes="state.codes" :public-offers="[]" :applied-code="state.discountCode" :locked="blocked || state.quoting" @apply="checkout.applyCode($event)" />
          <p v-if="state.verified && !state.codes.length" role="status">کد تخفیفی در حال حاضر برای شما وجود ندارد</p>
          <form class="rc-code" @submit.prevent="checkout.applyCode(state.codeInput)">
            <input v-model="state.codeInput" class="rc-input" name="restaurant-discount" aria-label="کد تخفیف" autocomplete="off" placeholder="کد تخفیف" :disabled="blocked || state.quoting" />
            <button class="rc-button rc-secondary" type="submit" :disabled="blocked || state.quoting || !state.codeInput.trim()">اعمال</button>
          </form>
          <div v-if="state.discountCode" class="rc-applied"><span>کد {{ state.discountCode }} اعمال شد.</span><button type="button" :disabled="blocked || state.quoting" @click="checkout.applyCode('')">حذف کد</button></div>
        </section>
        <p class="rc-quote-status" aria-hidden="true">&nbsp;</p>
        <span class="sr-only" role="status" aria-live="polite">{{ state.quoting ? 'در حال به‌روزرسانی' : '' }}</span>
        <div class="rc-table-wrap" :aria-busy="state.quoting ? 'true' : 'false'">
          <table class="rc-table" :class="{ 'rc-table-updating': state.quoting }">
            <caption class="sr-only">اقلام سفارش و مبلغ هر قلم به تومان</caption>
            <thead><tr><th scope="col">محصول</th><th scope="col">تعداد</th><th scope="col">قیمت واحد</th><th scope="col">جمع</th></tr></thead>
            <tbody><tr v-for="item in state.items.filter(row => row.count > 0)" :key="item.key">
              <th scope="row">{{ item.name }}<small>{{ item.unit_name }}</small></th>
              <td><div class="rc-stepper"><button type="button" :disabled="blocked" :aria-label="'کم کردن ' + item.name" @click="changeCount(item, -1)">−</button><bdi>{{ number(item.count) }}</bdi><button type="button" :disabled="blocked" :aria-label="'افزودن ' + item.name" @click="changeCount(item, 1)">+</button></div></td>
              <td>{{ number(unitPrice(item)) }}</td><td>{{ number(Math.round(unitPrice(item) * item.count)) }}</td>
            </tr></tbody>
            <tfoot>
              <tr><th scope="row" colspan="3">جمع اقلام</th><td>{{ billAmount('total_amount') }}</td></tr>
              <tr :class="{ 'rc-discount': state.bill && state.bill.discount_amount }"><th scope="row" colspan="3">تخفیف</th><td>{{ state.bill && state.bill.discount_amount ? '− ' : '' }}{{ billAmount('discount_amount') }}</td></tr>
              <tr><th scope="row" colspan="3">مالیات</th><td>{{ billAmount('tax_amount') }}</td></tr>
              <tr class="rc-total"><th scope="row" colspan="3">مبلغ قابل پرداخت</th><td>{{ billAmount('payment_amount') }}</td></tr>
            </tfoot>
          </table>
        </div>
        <p v-if="!state.items.some(item => item.count > 0)" role="status">سبد خرید شما خالی است.</p>
      </div>
      <template #modal-footer>
        <div class="rc rc-footer-content" dir="rtl">
        <div class="rc-footer-total" :aria-busy="state.quoting ? 'true' : 'false'"><span>مبلغ قابل پرداخت</span><strong>{{ state.quoting ? 'در حال به‌روزرسانی…' : billAmount('payment_amount') }}</strong></div>
        <p v-if="state.error" class="rc-error rc-checkout-error" role="alert">{{ state.error }}</p>
        <button v-if="state.unresolved" class="rc-button rc-primary" type="button" :disabled="state.paying" @click="checkout.retry()">بررسی دوباره درخواست</button>
        <template v-else>
          <button v-if="!state.bill && !state.quoting && state.error" type="button" class="rc-button rc-secondary rc-quote-retry" @click="checkout.preview()">محاسبه دوباره مبلغ</button>
          <div class="rc-payment-options">
            <button type="button" class="rc-button rc-primary" :disabled="!payable" @click="checkout.online()">{{ state.paying ? 'در حال اتصال…' : 'پرداخت آنلاین' }}</button>
            <!-- BACKEND: §19 future click creates a pending-payment order immediately and routes the authoritative amount through the restaurant admin terminal to POS; show «پرداخت سفارش با موفقیت انجام شد» only after authoritative confirmation. Current 30-second manual fallback remains. -->
            <button type="button" class="rc-button rc-secondary" :disabled="!payable" @click="checkout.openCard()">کارت میکشم</button>
          </div>
        </template>
        </div>
      </template>
    </b-modal>
    <b-modal v-if="state.phase === 'otp'" visible title="تأیید شماره همراه" hide-footer body-class="rc-body" content-class="rc-modal" dialog-class="rc-otp-dialog" return-focus="#restaurant-phone" @shown="focusOtp" @hide="checkout.closeOtp()">
      <form class="rc" dir="rtl" data-checkout="otp" @submit.prevent="checkout.verify()">
        <p>کد تأیید شماره <bdi>{{ state.phone }}</bdi> را وارد کنید.</p>
        <label for="restaurant-otp">کد تأیید</label>
        <input id="restaurant-otp" v-model="state.otp" class="rc-input rc-phone" inputmode="numeric" autocomplete="one-time-code" maxlength="8" :disabled="state.identifying" />
        <p v-if="state.otpError" class="rc-error" role="alert">{{ state.otpError }}</p>
        <button class="rc-button rc-primary rc-wide" :disabled="state.identifying" type="submit">{{ state.identifying ? 'در حال بررسی…' : 'تأیید کد و مشاهده تخفیف‌ها' }}</button>
        <button class="rc-button rc-secondary rc-wide" :disabled="state.identifying || resendSeconds > 0" type="button" @click="checkout.viewDiscounts()">{{ resendSeconds > 0 ? 'ارسال دوباره تا ' + number(resendSeconds) + ' ثانیه دیگر' : 'ارسال دوباره کد' }}</button>
        <button class="rc-text-button" type="button" @click="checkout.closeOtp()">بازگشت به سبد خرید</button>
      </form>
    </b-modal>
    <b-modal v-if="state.phase === 'card'" visible title="پرداخت با کارت" hide-footer hide-header-close no-close-on-backdrop no-close-on-esc body-class="rc-body" content-class="rc-modal">
      <div class="rc rc-card-payment" dir="rtl" data-checkout="card">
        <p>مبلغ قابل پرداخت</p><strong class="rc-payable">{{ number(state.bill.payment_amount) }} <small>تومان</small></strong>
        <button class="rc-button rc-secondary rc-wide rc-edit" type="button" @click="checkout.edit()">ویرایش سفارش</button>
        <p v-if="!cardActions" class="rc-wait" role="status">دکمه‌های تأیید و لغو تا {{ number(cardSeconds) }} ثانیه دیگر نمایش داده می‌شوند.</p>
        <div v-if="cardActions" class="rc-card-actions">
          <button class="rc-button rc-primary rc-confirm" type="button" :disabled="state.paying || state.unresolved" @click="checkout.confirmCard()">تأیید پرداخت</button>
          <button class="rc-button rc-secondary rc-cancel" type="button" :disabled="state.paying || state.unresolved" @click="checkout.cancel()">سفارش کنسل شد</button>
        </div>
        <p v-if="state.error" class="rc-error" role="alert">{{ state.error }}</p>
        <button v-if="state.unresolved" type="button" class="rc-button rc-primary rc-wide" :disabled="state.paying" @click="checkout.retry()">بررسی دوباره درخواست</button>
      </div>
    </b-modal>
    <b-modal v-if="state.phase === 'result'" visible :title="state.result.state === 'cancelled' ? 'سفارش لغو شد' : 'سفارش شما ثبت شد'" hide-footer hide-header-close no-close-on-backdrop body-class="rc-body" content-class="rc-modal">
      <div class="rc" dir="rtl" data-checkout="result">
        <template v-if="state.result.state !== 'cancelled'"><p>شماره سفارش: <bdi>{{ state.result.order_ref }}</bdi></p><p role="status">درخواست تأیید پرداخت شما برای بررسی ثبت شد.</p></template>
        <p v-else role="status">سفارش شما لغو شد.</p>
        <button type="button" class="rc-button rc-primary rc-wide" @click="$emit('close')">بازگشت به منو</button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { createCheckout, phone } from '~/utils/restaurantCheckout.cjs';
import DiscountSection from '~/pages/index/components/discountSection.vue';
export default {
  components: { DiscountSection },
  props: { adapter: { type: Object, required: true }, items: { type: Array, required: true } },
  data() {
    const checkout = createCheckout({ adapter: this.adapter, items: this.items,
      redirect: url => window.location.assign(url), complete: result => this.$emit('complete', result) });
    return { checkout, state: checkout.state, clock: Date.now(), timer: null, phoneTimer: null, focusFrame: null, checkoutScroll: null,
      fulfilments: [{ value: 'takeaway', text: 'بیرون بر' }, { value: 'dine_in', text: 'سرو در رستوران' }] };
  },
  watch: {
    'state.identifying'(value) {
      if (!value && this.state.phase === 'otp') this.$nextTick(this.focusOtp);
    },
    'state.phase'(phase, previous) {
      if (phase === 'otp') this.$nextTick(() => this.setCheckoutInert(true));
      else if (previous === 'otp') this.$nextTick(() => {
        this.setCheckoutInert(false);
        // Let Bootstrap unregister the destroyed top portal before returning
        // focus. Otherwise its focus trap can steal it back during dismissal.
        cancelAnimationFrame(this.focusFrame);
        this.focusFrame = requestAnimationFrame(() => {
          if (this.state.phase === 'otp') return;
          this.setCheckoutInert(false);
          const modal = this.$refs.checkoutModal && this.$refs.checkoutModal.$refs.modal;
          if (!modal) return;
          const focus = modal.querySelector('#restaurant-phone');
          if (focus) focus.focus({ preventScroll: true });
          this.restoreCheckoutScroll();
        });
      });
    },
  },
  computed: {
    validPhone() { return !!phone(this.state.phone); },
    blocked() { return this.state.paying || this.state.unresolved; },
    payable() { return this.validPhone && !!this.state.bill && !this.state.quoting && !this.blocked && this.state.items.some(item => item.count > 0); },
    cardActions() { return this.state.cardOpenedAt !== null && this.clock - this.state.cardOpenedAt >= 30000; },
    cardSeconds() { return Math.max(0, Math.ceil((30000 - (this.clock - this.state.cardOpenedAt)) / 1000)); },
    resendSeconds() { return Math.max(0, Math.ceil((this.state.resendAt - this.clock) / 1000)); },
  },
  mounted() { this.timer = setInterval(() => { this.clock = Date.now(); }, 100); this.checkout.preview(); },
  beforeDestroy() { clearInterval(this.timer); clearTimeout(this.phoneTimer); cancelAnimationFrame(this.focusFrame); this.checkout.destroy(); },
  methods: {
    number(value) { return Number(value || 0).toLocaleString('fa-IR'); },
    billAmount(field) { return this.state.bill ? this.number(this.state.bill[field]) + ' تومان' : '…'; },
    openOtp() {
      const modal = this.$refs.checkoutModal.$refs.modal;
      this.checkoutScroll = [...modal.querySelectorAll('.modal-content, .modal-body')].map(element => ({ element, top: element.scrollTop }));
      if (modal.contains(document.activeElement)) document.activeElement.blur();
      this.checkout.viewDiscounts();
    },
    restoreCheckoutScroll() { (this.checkoutScroll || []).forEach(({ element, top }) => { element.scrollTop = top; }); },
    setCheckoutInert(value) {
      const modal = this.$refs.checkoutModal && this.$refs.checkoutModal.$refs.modal;
      if (!modal) return;
      if (value && modal.contains(document.activeElement)) document.activeElement.blur();
      modal.inert = value;
      // Bootstrap's portal can patch its wrapper a tick after the component.
      // Release that ancestor before restoring focus, as well as the dialog.
      modal.parentElement.inert = value;
      if (!value) modal.parentElement.removeAttribute('aria-hidden');
    },
    focusOtp() { const input = document.getElementById('restaurant-otp'); if (input) input.focus({ preventScroll: true }); this.restoreCheckoutScroll(); },
    focusPhone() { const input = document.getElementById('restaurant-phone'); if (input && this.state.phase === 'checkout') input.focus({ preventScroll: true }); },
    phoneDigit(digit) { const limit = this.state.phone.startsWith('+98') ? 13 : this.state.phone.startsWith('0098') ? 14 : 11; if (Array.from(this.state.phone).length < limit) this.setPhone(this.state.phone + digit); this.$nextTick(this.focusPhone); },
    phoneDelete() { this.setPhone(Array.from(this.state.phone).slice(0, -1).join('')); this.$nextTick(this.focusPhone); },
    phoneKeydown(event) { if (/^[0-9]$/.test(event.key)) { event.preventDefault(); this.phoneDigit(event.key); } else if (event.key === '+' && !this.state.phone) { event.preventDefault(); this.setPhone('+'); } else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); this.phoneDelete(); } },
    unitPrice(item) { return item.price * (1 - (item.discount_percent || 0) / 100); },
    setPhone(value) { this.checkout.setPhone(value); clearTimeout(this.phoneTimer); this.phoneTimer = setTimeout(() => this.checkout.preview(), 200); },
    changeCount(item, direction) {
      if (this.blocked) return;
      item.count = Math.max(0, Number((item.count + direction * item.add_unit).toFixed(8)));
      this.$emit('count', { key: item.key, count: item.count }); this.checkout.preview();
    },
  },
};
</script>

<style>
.rc-modal { background: var(--lz-surface); color: var(--lz-ink); border-radius: var(--lz-radius-panel); }
/* Natural content height, with scrolling confined to the body at the viewport cap. */
.modal .rc-checkout-dialog .modal-content, .modal .rc-otp-dialog .modal-content { max-height: 92vh; max-height: 92dvh; overflow: hidden; }
.modal .rc-checkout-dialog .modal-content { height: min(810px, 92vh); height: min(810px, 92dvh); }
.rc-checkout-dialog .rc-body, .rc-otp-dialog .rc-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.rc-checkout-dialog .rc-body { flex: 1 1 auto; }
.rc-checkout-dialog .rc-checkout-footer { flex: 0 0 auto; display: block; position: relative; z-index: 1; max-height: 45vh; max-height: 45dvh; overflow-y: auto; background: var(--lz-surface); border-top: 1px solid var(--lz-border); box-shadow: 0 -6px 16px rgba(0, 0, 0, .16); padding: var(--lz-space-3) var(--lz-space-4) max(var(--lz-space-3), env(safe-area-inset-bottom)); }
.rc-footer-content { width: 100%; }
.rc-footer-total { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; margin-bottom: var(--lz-space-2); }
.rc-footer-total strong { font-variant-numeric: tabular-nums; }
.rc-footer-content .rc-payment-options { margin-top: 0; }
.rc-footer-content .rc-error, .rc-footer-content .rc-quote-retry { margin: 0 0 var(--lz-space-2); }
.rc-checkout-dialog .modal-header, .rc-otp-dialog .modal-header { flex-shrink: 0; }
.rc-modal .modal-header { border-color: var(--lz-border); align-items: center; justify-content: space-between; }
.rc-modal .modal-title { font-size: var(--lz-text-lg); font-weight: 700; }
.rc-modal .modal-header .close { color: var(--lz-ink); opacity: 1; min-width: 44px; min-height: 44px; margin: 0; padding: 0; }
.rc-body { padding: var(--lz-space-4); }
.rc { font-family: var(--lz-font); color: var(--lz-ink); text-align: right; }
.rc label, .rc h2, .rc legend { display: block; font-size: var(--lz-text-body); font-weight: 700; margin-bottom: var(--lz-space-2); }
.rc-choice { display: grid; grid-template-columns: 1fr 1fr; gap: var(--lz-space-2); margin-bottom: var(--lz-space-4); }
.rc-choice legend { grid-column: 1 / -1; }
.rc-choice label { display: flex; gap: var(--lz-space-2); align-items: center; padding: var(--lz-space-3); border: 1px solid var(--lz-border); border-radius: var(--lz-radius-control); min-height: 48px; margin: 0; cursor: pointer; }
.rc-choice label.active { background: var(--lz-accent-wash); border-color: var(--lz-accent); color: var(--lz-accent-strong); }
.rc-choice input { accent-color: var(--lz-accent); }
.rc-fulfilment-icon { flex: 0 0 20px; width: 20px; height: 20px; background: currentColor; }
.rc-dine-icon { mask: url('~assets/immersive-icons/plate-utensils.svg') center / contain no-repeat; }
.rc-takeaway-icon { mask: url('~assets/immersive-icons/person-walking.svg') center / contain no-repeat; }
.rc-table-wrap { max-width: 100%; overflow-x: auto; }
.rc-table { width: 100%; border-collapse: collapse; font-size: var(--lz-text-sm); }
.rc-table-updating { opacity: .5; }
.rc-table th, .rc-table td { padding: var(--lz-space-3) var(--lz-space-1); border-bottom: 1px solid var(--lz-border); text-align: right; }
.rc-table th:first-child { min-width: 85px; }
.rc-table td { font-variant-numeric: tabular-nums; white-space: nowrap; }
.rc-table small { display: block; color: var(--lz-ink-muted); font-weight: 400; }
.rc-table tfoot { background: var(--lz-surface-soft); border-top: 2px solid var(--lz-border); }
.rc-table tfoot .rc-discount { color: var(--lz-success); }
.rc-table tfoot .rc-total { color: var(--lz-ink); font-weight: 700; }
.rc-stepper { display: flex; align-items: center; justify-content: flex-start; direction: rtl; }
.rc-stepper button { min-width: 44px; min-height: 44px; background: var(--lz-surface-soft); color: var(--lz-ink); border: 0; border-radius: var(--lz-radius-control); }
.rc-stepper bdi { min-width: 24px; text-align: center; }
.rc-section { padding-top: var(--lz-space-4); margin-top: var(--lz-space-3); }
.rc-required, .rc-wait { color: var(--lz-ink-muted); font-size: var(--lz-text-sm); font-weight: 400; }
.rc-input { width: 100%; min-height: 48px; background: var(--lz-surface); color: var(--lz-ink); border: 1px solid var(--lz-border); border-radius: var(--lz-radius-control); padding: var(--lz-space-3); font: inherit; }
.rc-input::placeholder { color: var(--lz-ink-muted); opacity: 1; }
/* Phone hint only: visibly faded in either theme; entered text keeps --lz-ink. */
.rc-checkout-dialog #restaurant-phone::placeholder { color: var(--lz-ink-muted); opacity: .35; }
.rc-input:focus-visible, .rc-button:focus-visible, .rc-stepper button:focus-visible { outline: 2px solid var(--lz-accent); outline-offset: 2px; }
.rc-phone { direction: ltr; text-align: center; font-variant-numeric: tabular-nums; }
.rc-phone-group { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--lz-space-2); align-items: start; }
.rc-phone-group .rc-input { min-width: 0; }
.rc-phone-group .rc-view-discounts { width: auto; margin: 0; white-space: nowrap; }
.rc-phone-pad { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; max-width: 100%; margin-top: var(--lz-space-2); }
@media (min-width: 700px) { .rc-phone-pad { grid-template-columns: repeat(11, minmax(0, 1fr)); } }
.rc-phone-pad button { min-width: 0; height: 55px; border: 1px solid var(--lz-border); border-radius: var(--lz-radius-control); background: var(--lz-surface); color: var(--lz-ink); font: inherit; }
.rc-phone-pad button:nth-child(1) { background: #f5f5f5; color: #181818; }
.rc-phone-pad button:nth-child(2) { background: #ededed; color: #181818; }
.rc-phone-pad button:nth-child(3) { background: #e5e5e5; color: #181818; }
.rc-phone-pad button:nth-child(4) { background: #dddddd; color: #181818; }
.rc-phone-pad button:nth-child(5) { background: #d5d5d5; color: #181818; }
.rc-phone-pad button:nth-child(6) { background: #cdcdcd; color: #181818; }
.rc-phone-pad button:nth-child(7) { background: #c5c5c5; color: #181818; }
.rc-phone-pad button:nth-child(8) { background: #bdbdbd; color: #181818; }
.rc-phone-pad button:nth-child(9) { background: #b5b5b5; color: #181818; }
.rc-phone-pad button:nth-child(10) { background: #adadad; color: #181818; }
.rc-phone-pad button:nth-child(11) { background: #d7e1e5; color: #18272d; }
.rc-phone-pad button:focus-visible { outline: 2px solid var(--lz-accent); outline-offset: -2px; }
.rc-phone-feedback { min-height: 1.5em; margin-bottom: 0; }
.rc-discount-helper { color: var(--lz-ink-muted); font-size: var(--lz-text-sm); }
.rc-quote-status { min-height: 1.5em; margin-top: var(--lz-space-3); margin-bottom: 0; }
.rc-quote-retry { width: 100%; }
.rc-button { min-height: 48px; border-radius: var(--lz-radius-control); padding: var(--lz-space-3); font: inherit; font-weight: 700; border: 1px solid var(--lz-accent); cursor: pointer; }
.rc-button:disabled { opacity: .55; cursor: default; }
.rc-primary { background: var(--lz-accent); color: var(--lz-on-accent, white); }
.rc-secondary { background: var(--lz-surface); color: var(--lz-accent-strong); }
#restaurant-phone-verify:not(:disabled) { background: #8A1318; border-color: #8A1318; color: #fff; }
.rc-wide, .rc-view-discounts { width: 100%; margin-top: var(--lz-space-3); }
.rc-code, .rc-payment-options, .rc-card-actions { display: grid; grid-template-columns: 1fr auto; gap: var(--lz-space-2); margin-top: var(--lz-space-3); }
.rc-payment-options, .rc-card-actions { grid-template-columns: 1fr 1fr; }
.rc-totals { padding-top: var(--lz-space-4); margin: var(--lz-space-4) 0; }
.rc-totals > div { display: flex; gap: var(--lz-space-2); justify-content: space-between; margin-top: var(--lz-space-2); }
.rc-totals dd { margin: 0; white-space: nowrap; }
.rc-total { border-top: 1px solid var(--lz-border); padding-top: var(--lz-space-3); font-weight: 700; }
.rc-error { color: var(--lz-danger, var(--lz-accent-strong)); margin-top: var(--lz-space-2); }
.rc-verified, .rc-applied { color: var(--lz-accent-strong); margin-top: var(--lz-space-2); }
.rc-applied { display: flex; justify-content: space-between; }
.rc-applied button, .rc-text-button { border: 0; background: transparent; color: var(--lz-accent-strong); min-height: 44px; text-decoration: underline; }
.rc-card-payment { text-align: center; }
.rc-payable { display: block; font-size: var(--lz-text-display); margin-block: var(--lz-space-4); }
.rc-payable small { font-size: var(--lz-text-body); }
.rc-wait { margin-top: var(--lz-space-4); }
.rc .offers--basket { margin: var(--lz-space-3) 0; }
@media (max-width: 480px) { .rc-table { font-size: var(--lz-text-sm); } .rc-body { padding: var(--lz-space-3); } }
</style>
