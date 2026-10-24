<template>
  <b-modal
    id="address-form-modal"
    centered
    size="lg"
    :static="true"
    hide-header-close
    @hidden="$emit('close')"
  >
    <template #modal-header="{ close }">
      <div class="address-form-modal-header" dir="ltr">
        <button
          type="button"
          class="address-form-modal-header__close"
          aria-label="بستن"
          @click="close()"
        >
          ×
        </button>
        <h5 class="address-form-modal-header__title" dir="rtl">مدیریت آدرس</h5>
      </div>
    </template>

    <form @submit.prevent="submit">
      <div class="form-group">
        <label class="form-label">عنوان آدرس *</label>
        <input
          v-model="form.title"
          type="text"
          class="form-control"
          placeholder="مثال: منزل، دفتر"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label">نشانی متنی *</label>
        <textarea
          v-model="form.address"
          class="form-control"
          rows="3"
          placeholder="خیابان، بن‌بست و توضیحات دیگر"
          required
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">پلاک</label>
          <input
            v-model="form.plateNumber"
            type="text"
            class="form-control"
            placeholder="مثال: ۲۳۴"
          />
        </div>
        <div class="form-group">
          <label class="form-label">واحد/زنگ</label>
          <input
            v-model="form.unitNumber"
            type="text"
            class="form-control"
            placeholder="مثال: ۵"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">موقعیت روی نقشه *</label>
        <p class="form-hint">
          روی نقشه کلیک کنید تا موقعیت ارسال را انتخاب کنید.
        </p>
        <client-only>
          <map-picker
            ref="mapPicker"
            :lat.sync="form.lat"
            :lng.sync="form.lng"
            :center-lat="mapCenter.lat"
            :center-lng="mapCenter.lng"
          />
        </client-only>
      </div>

      <div class="form-group form-group--checkbox">
        <label class="form-checkbox">
          <input
            v-model="form.isDefault"
            type="checkbox"
          />
          <span>پیش‌فرض برای سفارشات جدید</span>
        </label>
      </div>
    </form>

    <template #modal-footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="$emit('close')"
      >
        لغو
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="loading"
        @click="submit"
      >
        {{ loading ? 'درحال ذخیره...' : 'ذخیره آدرس' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import MapPicker from '~/components/MapPicker.vue';
import { DEFAULT_MAP_CENTER } from '~/utils/mapir';

export default {
  name: 'AddressForm',
  components: { MapPicker },
  props: {
    address: { type: Object, default: null },
    loading: { type: Boolean, default: false },
  },
  data() {
    const emptyForm = {
      id: null,
      title: '',
      address: '',
      plateNumber: '',
      unitNumber: '',
      lat: null,
      lng: null,
      isDefault: false,
    };
    const address = this.address || {};
    const lat = address.lat == null ? null : Number(address.lat);
    const lng = address.lng == null ? null : Number(address.lng);

    return {
      mapCenter: DEFAULT_MAP_CENTER,
      form: {
        ...emptyForm,
        ...address,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        isDefault: !!address.isDefault,
      },
    };
  },
  mounted() {
    this.$bvModal.show('address-form-modal');
  },
  methods: {
    submit() {
      if (!this.form.title?.trim()) {
        this.$bvToast.toast('عنوان الزامی است', { variant: 'danger' });
        return;
      }
      if (!this.form.address?.trim()) {
        this.$bvToast.toast('نشانی الزامی است', { variant: 'danger' });
        return;
      }
      if (this.form.lat === null || this.form.lng === null) {
        this.$bvToast.toast('انتخاب موقعیت الزامی است', { variant: 'danger' });
        return;
      }
      this.$emit('save', this.form);
    },
  },
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.address-form-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.address-form-modal-header__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #f5f5f5;
  color: #625c55;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.address-form-modal-header__title {
  margin: 0;
  color: #2a2318;
  font-size: 1.1rem;
  font-weight: 700;
}

.form-group--checkbox {
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #2a2318;
  margin-bottom: 0.4rem;
}

.form-control {
  width: 100%;
  border: 1px solid rgba(42, 35, 24, 0.2);
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  font-size: 0.85rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #c44536;
  box-shadow: 0 0 0 2px rgba(196, 69, 54, 0.1);
}

.form-control[type='checkbox'] {
  width: auto;
  margin-right: 0.5rem;
}

.form-hint {
  font-size: 0.75rem;
  color: #8a7f6d;
  margin: 0 0 0.6rem;
}

.form-checkbox {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #2a2318;
  cursor: pointer;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary {
  background: #c44536;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #8a7f6d;
  border: 1px solid #8a7f6d;
}
</style>
