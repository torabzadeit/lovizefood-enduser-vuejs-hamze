<template>
  <b-modal
    id="modal-profile"
    size="lg"
    hide-footer
    hide-header
    dialog-class="laviz-profile-modal"
    @shown="onModalShown"
  >
    <div class="laviz-profile-modal__header">
      <button type="button" class="laviz-profile-modal__close" aria-label="بستن" @click="$bvModal.hide('modal-profile')">
        ×
      </button>
      <h5 class="laviz-profile-modal__title">پروفایل من</h5>
    </div>
    <b-tabs v-model="tab">
      <b-tab title="اطلاعات">
        <div class="form-group mt-2">
          <label>نام</label>
          <input v-model="profile.name" class="form-control" />
        </div>
        <div class="form-group">
          <label>نام خانوادگی</label>
          <input v-model="profile.family" class="form-control" />
        </div>
        <div class="form-group">
          <label>موبایل</label>
          <input v-model="profile.mobile" class="form-control" disabled />
        </div>
        <button class="btn btn-primary btn-sm" @click="saveProfile">ذخیره</button>

        <hr class="my-3" />
        <h6>رمز عبور</h6>
        <p class="small text-muted" v-if="!hasPassword">
          می‌توانید یک رمز عبور اختیاری تنظیم کنید (ورود همچنان با کد پیامکی است).
        </p>
        <div class="form-group" v-if="hasPassword">
          <label>رمز فعلی</label>
          <input v-model="passwordForm.current" type="password" class="form-control" />
        </div>
        <div class="form-group">
          <label>{{ hasPassword ? 'رمز جدید' : 'رمز عبور' }}</label>
          <input v-model="passwordForm.newPassword" type="password" class="form-control" />
        </div>
        <div class="form-group">
          <label>تکرار رمز</label>
          <input v-model="passwordForm.confirm" type="password" class="form-control" />
        </div>
        <button class="btn btn-secondary btn-sm" @click="savePassword">ذخیره رمز عبور</button>
      </b-tab>
      <b-tab title="آدرس‌ها">
        <div class="laviz-address-list">
          <div v-if="!addresses.length && !showAddressForm" class="text-muted small text-center py-4">
            هنوز آدرسی ثبت نکرده‌اید.
          </div>
          <div v-for="addr in addresses" :key="addr.id" class="laviz-address-card">
            <div class="laviz-address-card__body">
              <div class="laviz-address-card__head">
                <strong>{{ addr.title }}</strong>
                <span v-if="addr.isDefault" class="badge badge-primary">پیش‌فرض</span>
              </div>
              <div class="laviz-address-card__text">{{ addr.address }}</div>
            </div>
            <div class="laviz-address-card__actions">
              <button class="btn btn-outline-primary btn-sm" @click="selectAddressForEdit(addr)">ویرایش</button>
              <button class="btn btn-outline-danger btn-sm" @click="removeAddress(addr.id)">حذف</button>
            </div>
          </div>
        </div>

        <button
          v-if="!showAddressForm"
          class="btn btn-success btn-block mt-3"
          @click="startAddAddress"
        >
          <span class="ml-1">+</span> افزودن آدرس جدید
        </button>

        <div v-if="showAddressForm" class="laviz-address-form mt-3">
          <h6 class="laviz-address-form__title">
            {{ editingAddressId ? 'ویرایش آدرس' : 'افزودن آدرس جدید' }}
          </h6>
          <div class="form-group">
            <label class="small font-weight-bold">عنوان آدرس</label>
            <input v-model="newAddress.title" class="form-control" placeholder="عنوان (خانه، محل کار)" />
          </div>
          <div class="form-group">
            <label class="small font-weight-bold">آدرس کامل</label>
            <textarea v-model="newAddress.address" class="form-control" rows="2" placeholder="آدرس کامل را وارد کنید"></textarea>
          </div>
          <div class="form-group">
            <label class="small font-weight-bold">موقعیت روی نقشه</label>
            <client-only>
              <map-picker
                ref="addressMap"
                :lat.sync="newAddress.lat"
                :lng.sync="newAddress.lng"
                :center-lat="mapCenter.lat"
                :center-lng="mapCenter.lng"
                @address="(addr) => { newAddress.address = addr }"
              />
            </client-only>
          </div>
          <div class="form-check mb-3">
            <input v-model="newAddress.isDefault" type="checkbox" class="form-check-input" id="addr-default" />
            <label class="form-check-label" for="addr-default">آدرس پیش‌فرض</label>
          </div>
          <div class="d-flex">
            <button class="btn btn-success btn-sm flex-grow-1" @click="addAddress">
              {{ editingAddressId ? 'ذخیره تغییرات' : 'ذخیره آدرس' }}
            </button>
            <button class="btn btn-secondary btn-sm mr-2" @click="cancelEditAddress">انصراف</button>
          </div>
        </div>
      </b-tab>
      <b-tab title="سفارش‌ها">
        <div v-if="!orders.length" class="text-muted small py-3">سفارشی ثبت نشده است.</div>
        <div v-for="o in orders" :key="o.id" class="laviz-order-history-card border rounded p-3 mb-3 small">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div><strong>شماره:</strong> {{ o.orderNumber || o.id.slice(0, 8) }}</div>
              <div><strong>وضعیت:</strong> {{ statusLabel(o.status) }}</div>
              <div>{{ formatDate(o.createDate) }}</div>
              <div v-if="o.deliveryDate"><strong>تحویل:</strong> {{ formatJalaliDate(o.deliveryDate) }} {{ o.deliveryTime || '' }}</div>
            </div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm laviz-receipt-btn"
              :disabled="downloadingReceiptId === o.id"
              @click="downloadReceipt(o)"
            >
              {{ downloadingReceiptId === o.id ? '...' : 'چاپ / ذخیره PDF' }}
            </button>
          </div>

          <div class="laviz-order-history-items">
            <div class="font-weight-bold mb-1">اقلام سفارش</div>
            <div v-if="!(o.items && o.items.length)" class="text-muted">جزئیات اقلام موجود نیست.</div>
            <div
              v-for="(item, idx) in o.items || []"
              :key="idx"
              class="d-flex justify-content-between py-1 border-bottom"
            >
              <span>{{ item.title }} — {{ item.count }} {{ item.unit }}</span>
              <span class="text-left">
                <span class="text-muted">{{ formatNum(item.unitPrice) }} × {{ item.count }}</span>
                <strong class="mr-2">{{ formatNum(item.lineTotal) }}</strong> تومان
              </span>
            </div>
          </div>

          <div class="laviz-order-history-totals mt-2 pt-2 border-top">
            <div class="d-flex justify-content-between" v-if="o.itemsSubtotalTomans != null">
              <span>جمع اقلام</span>
              <span>{{ formatNum(o.itemsSubtotalTomans) }} تومان</span>
            </div>
            <div class="d-flex justify-content-between" v-if="o.shippingCostTomans">
              <span>هزینه ارسال (پیک)</span>
              <span>{{ formatNum(o.shippingCostTomans) }} تومان</span>
            </div>
            <div class="d-flex justify-content-between" v-if="o.taxAmountTomans">
              <span>مالیات</span>
              <span>{{ formatNum(o.taxAmountTomans) }} تومان</span>
            </div>
            <div class="d-flex justify-content-between text-danger" v-if="o.discountAmountTomans">
              <span>تخفیف</span>
              <span>− {{ formatNum(o.discountAmountTomans) }} تومان</span>
            </div>
            <div class="d-flex justify-content-between font-weight-bold mt-1">
              <span>مبلغ پرداختی</span>
              <span>{{ formatNum(o.payedAmountTomans) }} تومان</span>
            </div>
            <div v-if="o.comment" class="text-muted mt-2">توضیحات: {{ o.comment }}</div>
          </div>
        </div>
      </b-tab>
      <b-tab title="کدهای تخفیف">
        <div class="laviz-discount-codes-tab">
          <div class="laviz-discount-codes-section">
            <div class="laviz-discount-codes-section__label">قابل استفاده</div>
            <div class="laviz-discount-codes-list">
              <span
                v-for="c in discountCodes.available"
                :key="c.id"
                class="laviz-discount-badge laviz-discount-badge--available"
              >{{ c.code }}</span>
              <span v-if="!discountCodes.available.length" class="text-muted small">کدی موجود نیست.</span>
            </div>
          </div>
          <div class="laviz-discount-codes-section">
            <div class="laviz-discount-codes-section__label">استفاده شده</div>
            <div class="laviz-discount-codes-list">
              <span
                v-for="c in discountCodes.used"
                :key="c.id"
                class="laviz-discount-badge laviz-discount-badge--used"
              >{{ c.code }}</span>
              <span v-if="!discountCodes.used.length" class="text-muted small">هنوز استفاده نشده.</span>
            </div>
          </div>
        </div>
      </b-tab>
    </b-tabs>
    <a :href="'tel:' + supportPhone" class="btn btn-outline-primary btn-block mt-3">تماس با پشتیبانی</a>
  </b-modal>
</template>

<script>
import MapPicker from '~/components/MapPicker.vue';
import { DEFAULT_MAP_CENTER } from '~/utils/mapir';
import { openOrderReceiptForPrint } from '~/utils/orderReceipt';
import { formatJalaliDate } from '~/utils/persianDate';

export default {
  name: 'ProfileModal',
  components: { MapPicker },
  props: {
    supportPhone: { type: [String, Number], default: '' },
    mapCenter: { type: Object, default: () => ({ lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng }) },
  },
  data() {
    return {
      tab: 0,
      profile: { name: '', family: '', mobile: '' },
      hasPassword: false,
      passwordForm: { current: '', newPassword: '', confirm: '' },
      addresses: [],
      orders: [],
      discountCodes: { used: [], available: [] },
      downloadingReceiptId: null,
      newAddress: { title: 'خانه', address: '', lat: null, lng: null, isDefault: false },
      editingAddressId: null,
      showAddressForm: false,
    };
  },
  watch: {
    tab(v) {
      if (v === 1) {
        this.$nextTick(() => this.$refs.addressMap?.refreshMap());
      }
    },
  },
  methods: {
    async open() {
      try {
        await this.load();
      } catch (e) {
        this.$bvToast.toast('خطا در بارگذاری پروفایل', { variant: 'danger' });
      }
      this.$bvModal.show('modal-profile');
    },
    onModalShown() {
      if (this.tab === 1) {
        this.$nextTick(() => this.$refs.addressMap?.refreshMap());
      }
    },
    async load() {
      const profile = await this.$axios.get('/api/enduser/profile');
      this.profile = profile.data;
      this.hasPassword = !!profile.data.hasPassword;
      this.addresses = profile.data.addresses || [];
      const orders = await this.$axios.get('/api/enduser/profile/orders');
      this.orders = orders.data;
      const codes = await this.$axios.get('/api/enduser/profile/discount-codes');
      this.discountCodes = codes.data;
    },
    async saveProfile() {
      await this.$axios.put('/api/enduser/profile', { name: this.profile.name, family: this.profile.family });
      this.$bvToast.toast('ذخیره شد', { variant: 'success' });
    },
    async savePassword() {
      if (this.passwordForm.newPassword !== this.passwordForm.confirm) {
        this.$bvToast.toast('رمز و تکرار یکسان نیست', { variant: 'danger' });
        return;
      }
      try {
        await this.$axios.put('/api/enduser/profile/password', {
          currentPassword: this.hasPassword ? this.passwordForm.current : undefined,
          newPassword: this.passwordForm.newPassword,
        });
        this.hasPassword = true;
        this.passwordForm = { current: '', newPassword: '', confirm: '' };
        this.$bvToast.toast('رمز عبور ذخیره شد', { variant: 'success' });
      } catch (e) {
        const msg = e.response?.data?.message || 'خطا در ذخیره رمز';
        this.$bvToast.toast(msg, { variant: 'danger' });
      }
    },
    startAddAddress() {
      this.editingAddressId = null;
      this.newAddress = { title: 'خانه', address: '', lat: null, lng: null, isDefault: false };
      this.showAddressForm = true;
      this.$nextTick(() => this.$refs.addressMap?.refreshMap());
    },
    selectAddressForEdit(addr) {
      this.editingAddressId = addr.id;
      this.newAddress = {
        title: addr.title,
        address: addr.address,
        lat: addr.lat,
        lng: addr.lng,
        isDefault: !!addr.isDefault,
      };
      this.showAddressForm = true;
      this.$nextTick(() => this.$refs.addressMap?.refreshMap());
    },
    async addAddress() {
      if (!this.newAddress.address) {
        this.$bvToast.toast('آدرس را وارد کنید', { variant: 'warning' });
        return;
      }
      if (this.editingAddressId) {
        await this.$axios.put(`/api/enduser/profile/addresses/${this.editingAddressId}`, this.newAddress);
        this.editingAddressId = null;
        this.$bvToast.toast('آدرس ویرایش شد', { variant: 'success' });
      } else {
        await this.$axios.post('/api/enduser/profile/addresses', this.newAddress);
        this.$bvToast.toast('آدرس افزوده شد', { variant: 'success' });
      }
      this.newAddress = { title: 'خانه', address: '', lat: null, lng: null, isDefault: false };
      this.showAddressForm = false;
      await this.load();
      this.$emit('addresses-changed');
    },
    cancelEditAddress() {
      this.editingAddressId = null;
      this.showAddressForm = false;
      this.newAddress = { title: 'خانه', address: '', lat: null, lng: null, isDefault: false };
    },
    async removeAddress(id) {
      await this.$axios.delete(`/api/enduser/profile/addresses/${id}`);
      await this.load();
      this.$emit('addresses-changed');
    },
    statusLabel(s) {
      const map = { 1: 'پرداخت شده', 5: 'در انتظار پرداخت', 10: 'در انتظار تایید', 11: 'عدم تایید', 12: 'آماده‌سازی', 13: 'تحویل پیک', 4: 'تحویل شده' };
      return map[s] || s;
    },
    formatDate(d) {
      return new Date(d).toLocaleString('fa-IR');
    },
    formatJalaliDate,
    formatNum(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    },
    async downloadReceipt(order) {
      this.downloadingReceiptId = order.id;
      try {
        await openOrderReceiptForPrint(this.$axios, order);
        this.$bvToast.toast('از پنجرهٔ چاپ، گزینهٔ «ذخیره به‌صورت PDF» را انتخاب کنید.', { variant: 'info' });
      } catch (e) {
        const msg = e.code === 'POPUP_BLOCKED'
          ? 'برای نمایش رسید، بازشدن پنجرهٔ جدید را در مرورگر مجاز کنید.'
          : e.response?.data?.message || 'خطا در آماده‌سازی رسید';
        this.$bvToast.toast(typeof msg === 'string' ? msg : 'خطا در آماده‌سازی رسید', { variant: 'danger' });
      } finally {
        this.downloadingReceiptId = null;
      }
    },
  },
};
</script>
