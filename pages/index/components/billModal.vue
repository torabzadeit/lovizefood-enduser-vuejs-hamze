<template>
  <b-modal id="modal-bill" centered hide-footer hide-header dialog-class="laviz-bill-modal" body-class="p-0">
    <div class="laviz-bill-modal__head" v-if="auth.is_login">
      {{ auth.user.first_name + " " + auth.user.last_name }} عزیز، فاکتور شما
    </div>
    <div class="laviz-bill-modal__body" v-if="selectedProducts.length > 0">
  <div class="laviz-bill-card">
    
    <!-- هدر -->
    <div class="d-flex justify-content-between align-items-center mb-2">
      <strong>🛒 محصولات انتخاب شده:</strong>
      <b-badge variant="primary">{{ selectedProducts.length }} مورد</b-badge>
    </div>

    <!-- لیست محصولات -->
    <div
      v-for="item in selectedProducts"
      :key="item.name"
      class="d-flex justify-content-between align-items-center py-2 border-bottom"
    >
      <div class="text-right">
        <div class="font-weight-bold">{{ item.name }}</div>
        <small class="text-muted">
          {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
        </small>
      </div>
      <div class="text-left font-weight-bold text-success">
        {{ formatNum(item.total) }} تومان
      </div>
    </div>

    <!-- جمع جزئی -->
    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
      <small class="text-muted">جمع جزئی:</small>
      <strong>{{ formatNum(selectedItemsTotal) }} تومان</strong>
    </div>

    <!-- تخفیف -->
    <div
      class="d-flex justify-content-between align-items-center py-2 border-top"
      v-if="billData.discount_amount > 0"
    >
      <span class="text-muted">مبلغ تخفیف :</span>
      <span class="font-weight-bold text-danger">- {{ formatNum(billData.discount_amount) }} تومان</span>
    </div>

    <div class="d-flex justify-content-between align-items-center py-2 border-top" v-if="delivery_type == 'sendToMe'">
      <span class="text-muted">هزینه ارسال :</span>
      <span class="font-weight-bold">+ {{ formatNum(billData.shipping_cost || shippingCost) }} تومان</span>
    </div>
    <div class="d-flex justify-content-between align-items-center py-2 border-top" v-if="billData.tax_amount > 0">
      <span class="text-muted">مالیات :</span>
      <span class="font-weight-bold">+ {{ formatNum(billData.tax_amount) }} تومان</span>
    </div>
    <div class="form-group mt-2">
      <label>توضیحات سفارش (اختیاری)</label>
      <textarea v-model="orderCommentLocal" class="form-control" rows="2" placeholder="مثلاً بدون نان..." />
    </div>
    <div class="laviz-bill-card__total">
      <span>مبلغ قابل پرداخت</span>
      <span>{{ formatNum(billData.payment_amount) }} تومان</span>
    </div>

  </div>

    <div class="laviz-bill-delivery">
      <div class="laviz-bill-delivery__row">
        <div class="laviz-bill-delivery__label">نوع ارسال</div>
        <div class="laviz-bill-delivery__value">
          <template v-if="delivery_type === 'sendToMe'">
            {{ jalaliDate(delivery_date, 'jD jMMMM jYYYY') }} برام ارسال کنید.
          </template>
          <template v-else>
            {{ jalaliDate(delivery_date, 'jD jMMMM jYYYY') }} حضوری میام.
          </template>
          <div v-if="delivery_time" class="laviz-bill-delivery__sub">ساعت {{ delivery_time }}</div>
        </div>
      </div>

      <div v-if="delivery_type === 'sendToMe'" class="laviz-bill-delivery__row">
        <div class="laviz-bill-delivery__label">به آدرس</div>
        <div class="laviz-bill-delivery__value">{{ delivery_address }}</div>
      </div>
    </div>
</div>
    <div class="laviz-bill-modal__actions">
      <button type="button" class="laviz-btn-pay w-100" @click="payment()">تأیید و پرداخت</button>
    </div>
  </b-modal>
</template>

<script>
import moment from "moment-jalaali";

export default {
  name: "billModal",
  props: {
    auth: Object,
    display_product: Boolean,
    products: Array,
    productData: Object,
    billData: Object,
    discountCode: Object,
    delivery_type: String,
    delivery_date: String,
    delivery_time: String,
    check_one: Boolean,
    delivery_address: String,
    shippingCost: Number,
    orderComment: String,
    deliveryLat: Number,
    deliveryLng: Number,
    addressId: String,
  },
  data() {
    return { orderCommentLocal: '' };
  },
  watch: {
    orderComment: {
      immediate: true,
      handler(v) { this.orderCommentLocal = v || ''; }
    }
  },
  methods: {
    async payment() {
      try {
        let data = {
          products: [],
          delivery_date: this.delivery_date,
          delivery_type: this.delivery_type,
          delivery_time: this.delivery_time,
          check_one: this.check_one,
          delivery_address: this.delivery_address,
          discount_code: this.discountCode.code,
          comment: this.orderCommentLocal,
          delivery_lat: this.deliveryLat,
          delivery_lng: this.deliveryLng,
          address_id: this.addressId,
        };
        for (let product of this.products) {
          if (this.productData[product.key].count)
            data.products.push({
              product_id: product.key,
              count: this.productData[product.key].count,
            });
        }
        let resp = await this.$axios.post("/api/enduser/order/create", data);
        console.log(resp)
        this.loading_payment = false;
        window.location.href = resp.data.payment_link;
      } catch (error) {
        this.loading_payment = false;
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    jalaliDate(date, format = "jYYYY/jM/jD") {
      return moment(date, "YYYY/M/D").format(format);
    }
  },
  computed: {
  hasValidProducts() {
    if (this.products.length < 2) return false;
    
    const uniqueCategoryIds = new Set(this.products.map(p => p.categoryId));
    
    return uniqueCategoryIds.size >= 2;
  },
  selectedProducts() {
    return this.products
      .filter(p => this.productData[p.key]?.count > 0)
      .map(p => ({
        key: p.key,
        name: this.productData[p.key].name,
        count: this.productData[p.key].count,
        price: this.productData[p.key].price,
        unit_name: this.productData[p.key].unit_name,
        discount_percent: this.productData[p.key].discount_percent,
        total: this.productData[p.key].count * this.productData[p.key].price,
        totalWithDiscount: this.productData[p.key].count * this.productData[p.key].price * (1 - this.productData[p.key].discount_percent / 100)
      }));
  },
  
  // ✅ جمع کل محصولات انتخاب شده
  selectedItemsTotal() {
    return this.selectedProducts.reduce((sum, item) => sum + item.total, 0);
  }
}
}
</script>

<style scoped lang="scss">
.laviz-bill-modal__head {
  font-weight: 800;
  text-align: center;
  padding: 1rem 1.25rem 0;
  font-size: 1.05rem;
}

.laviz-bill-modal__body {
  padding: 0 1.25rem 0.5rem;
}

.laviz-bill-delivery {
  margin-top: 1rem;
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.laviz-bill-delivery__row {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.08);
  text-align: right;
  direction: rtl;

  &:last-child {
    border-bottom: none;
  }
}

.laviz-bill-delivery__label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.35rem;
}

.laviz-bill-delivery__value {
  font-weight: 700;
  line-height: 1.65;
  word-break: break-word;
}

.laviz-bill-delivery__sub {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  margin-top: 0.25rem;
}

.laviz-bill-card {
  background: #f7f3eb;
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 14px;
  padding: 1rem;
  margin-top: 0.75rem;
}

.laviz-bill-card__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #9a6318, #c17f24);
  color: #fff;
  font-weight: 800;
}

.laviz-bill-modal__actions {
  padding: 1rem 1.25rem 1.25rem;
}
</style>
