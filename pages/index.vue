<template>
  <b-overlay
    :show="loading"
    :z-index="999">

    <div class="main-fixed-header laviz-app-header">
      <div class="container">
        <div class="row">

          <div class="col-md-12 laviz-app-header__brand">
            <img src="@/assets/media/logo.png" class="laviz-app-header__logo" alt="لاویز"/>
            <h1 class="laviz-app-header__title">رستوران لاویز</h1>
            <span v-if="mode === 0" class="laviz-mode-ribbon">🌙 ماه مبارک رمضان</span>
            <p
              v-if="mode === 0"
              class="laviz-app-header__subtitle">سفارش آنلاین شله و حلیم ویژه ماه مبارک رمضان
            </p>
          </div>

          <div class="col-md-12">
            <div class="laviz-user-bar" v-if="auth.is_login">
              <span>{{ auth.user.first_name + " " + auth.user.last_name }} عزیز، خوش آمدید</span>
              <span class="laviz-user-bar__actions">
                <a href="#" @click.prevent="$refs.profileModal.open()">پروفایل</a>
                <a href="#" @click.prevent="logout()">خروج</a>
              </span>
            </div>
            <div v-if="currentOrder" class="laviz-status-card laviz-status-card--expandable">
              <div class="d-flex justify-content-between align-items-center flex-wrap">
                <span>سفارش فعال: <strong>{{ currentOrderStatusLabel }}</strong></span>
                <div>
                  <button type="button" class="btn btn-link btn-sm p-0 ml-2" @click="showCurrentOrderDetails = !showCurrentOrderDetails">
                    {{ showCurrentOrderDetails ? 'بستن جزئیات' : 'مشاهده جزئیات' }}
                  </button>
                  <a :href="'tel:' + supportPhone" class="ml-2">تماس پشتیبانی</a>
                </div>
              </div>
              <div v-if="showCurrentOrderDetails" class="laviz-status-card__details mt-2 pt-2 border-top small">
                <div>شماره: {{ currentOrder.orderNumber || currentOrder.id.slice(0, 8) }}</div>
                <div>تحویل: {{ currentOrder.deliveryDate }} {{ currentOrder.deliveryTime || '' }}</div>
                <div v-if="currentOrder.deliveryAddress">آدرس: {{ currentOrder.deliveryAddress }}</div>
                <div v-if="currentOrder.comment">توضیحات: {{ currentOrder.comment }}</div>
                <div v-for="(item, idx) in currentOrderItems" :key="idx" class="d-flex justify-content-between">
                  <span>{{ item.title }} × {{ item.count }}</span>
                  <span>{{ formatNum(item.lineTotal) }} تومان</span>
                </div>
                <div class="mt-1">
                  <span v-if="currentOrder.shippingCost">ارسال: {{ formatNum(currentOrder.shippingCost) }} تومان</span>
                  <span v-if="currentOrder.taxAmount" class="mr-2">مالیات: {{ formatNum(currentOrder.taxAmount) }} تومان</span>
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm laviz-receipt-btn mt-2"
                  :disabled="downloadingReceiptId === currentOrder.id"
                  @click="downloadReceipt(currentOrder)"
                >
                  {{ downloadingReceiptId === currentOrder.id ? '...' : 'دانلود PDF رسید' }}
                </button>
              </div>
            </div>
          </div>

          <div class="col-12 laviz-tabs">
            <b-tabs 
              content-class="mt-2" v-model="tabIndex"
              v-if="showCategoryTabs"
            >
              <b-tab
                v-for="productCategoryItem in productCategories"
                v-if="products.filter(x=> x['categoryId'] === productCategoryItem.id).length > 0"
                :title="productCategoryItem.text"
                :key="productCategoryItem.id">

              </b-tab>
            </b-tabs>
          </div>
        </div>
      </div>
    </div>
    <div class="container">

      <div class="header-spacer"
          :class="{ 'header-spacer--expanded': showCategoryTabs }"
      ></div>

      <section v-if="weeklyPlan.length" class="laviz-section laviz-weekly-plan mb-3">
        <div class="laviz-weekly-plan__header">
          <h2 class="laviz-weekly-plan__title">برنامه غذایی هفته</h2>
          <p class="laviz-weekly-plan__hint">منوی هر روز — غذاهای ثابت به‌اضافهٔ ویژهٔ همان روز</p>
        </div>
        <div class="laviz-weekly-plan__table">
          <div class="laviz-weekly-plan__table-head">
            <span>روز</span>
            <span>منوی سرویس</span>
          </div>
          <div
            v-for="(day, dayIndex) in weeklyPlan"
            :key="day.name"
            class="laviz-weekly-plan__table-row"
            :class="{ 'laviz-weekly-plan__table-row--today': dayIndex === todayWeekIndex }"
          >
            <div class="laviz-weekly-plan__table-day">
              <span>{{ day.name }}</span>
              <span v-if="dayIndex === todayWeekIndex" class="laviz-weekly-plan__today-badge">امروز</span>
            </div>
            <div class="laviz-weekly-plan__table-menu">
              <template v-if="day.products.length">
                <span
                  v-for="productName in day.products"
                  :key="`${day.name}-${productName}`"
                  class="laviz-weekly-plan__product"
                >{{ productName }}</span>
              </template>
              <span v-else class="laviz-weekly-plan__empty">بدون سرویس</span>
            </div>
          </div>
        </div>
      </section>

      <div class="row">

        <div class="col-12">
          <div v-if="!loading && products.length === 0" class="alert alert-warning text-center my-3">
            در حال حاضر محصولی برای این حالت ({{ mode === 0 ? 'رمضان' : 'عادی' }}) تعریف نشده است.
            لطفاً از پنل مدیریت، منوی {{ mode === 0 ? 'رمضان' : 'عادی' }} را تکمیل کنید.
          </div>
          <div class="product-content-wrapper">

            <template v-for="productCategoryItem in visibleCategories">
              <div
                v-if="!showCategoryTabs || productCategoryItem.id === currentActiveTabId"
                :key="'content-' + productCategoryItem.id"
                class="tab-content-container"
              >
                <div
                  class="order-item"
                  v-for="product of products.filter(x=> x['categoryId'] === productCategoryItem.id)"
                  :key="product.name"
                >
                  <template v-if="productData[product.key]">
                    <product-item
                      :discount_percent="productData[product.key].discount_percent"
                      :name="productData[product.key].name"
                      :price="productData[product.key].price"
                      :count="productData[product.key].count"
                      :isOutOfStock="productData[product.key].isOutOfStock"
                      :unit_name="productData[product.key].unit_name"
                      :image="productData[product.key].image"
                      :description="productData[product.key].description"
                      :isSpecial="productData[product.key].isSpecial"
                      :specialDaysText="productData[product.key].specialDaysText"
                      @decrease="subProductCount(product.key,productData[product.key].add_unit)"
                      @increase="addProductCount(product.key,productData[product.key].add_unit)"
                      @imageClick="showImageModal"
                    />
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>


        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۱</span>
              زمان و نحوه تحویل
            </h2>
            <div class="d-flex flex-column position-relative">
              <template
                v-if="deliveryItems && deliveryItems.length > 0"
                v-for="(deliveryItem, deliveryIndex) in deliveryItems">
                <div
                  @click="dateSelection(deliveryIndex)"
                  class="laviz-date-option"
                  :class="{
                    'laviz-date-option--active': delivery_date === deliveryIndex,
                    'laviz-date-option--disabled': !deliveryItem.status
                  }"
                >
                  <div
                    v-if="deliveryIndex == 0 && mode === 0"
                    class="text-muted mb-2 small">
                    {{ 'سفارش امروز فقط تا قبل از ساعت ' + '15:30' }}
                  </div>
                  <label :for="'delivery-' + deliveryIndex">
                <span
                  :class="{ 'text-muted': !deliveryItem.status}">{{ getDeliveryItemText(deliveryIndex)+': ' }}</span>
                    <span :class="{ 'text-muted': !deliveryItem.status }">{{
                        jalaliDate(deliveryItem.date, "ddd jD jMMMM jYYYY")
                      }}</span>
                    <input
                      type="radio"
                      class="mr-1"
                      :id="'delivery-' + deliveryIndex"
                      v-model="delivery_date"
                      :value="deliveryIndex"
                      :disabled="!deliveryItem.status"
                    />

                    <span
                      v-if="deliveryItem.discount_special_day"
                      class="text-danger mr-1"
                      style="font-size: 13px"
                    >
                  تخفیف ویژه %
                  {{
                        Number(deliveryItem.discount_special_day) +
                        Number(deliveryItem.discount_percent)
                      }}
                </span>
                    <span v-else>
                  <span
                    class="text-success mr-1"
                    style="font-size: 13px"
                    v-if="deliveryItem.discount_percent"
                  >
                    {{ deliveryItem.discount_percent }}٪ تخفیف
                  </span>
                </span>
                    <div
                      class="text-muted mr-1"
                      style="font-size: 13px"
                      v-if="!deliveryItem.status"
                    >
                      سفارش برای امروز به پایان رسیده
                    </div>
                  </label>
                </div>

              </template>

              <div v-if="delivery_date !== -1 && deliveryTimes.length > 1" class="mt-3">
                <label class="laviz-field-label">ساعت تحویل</label>
                <div class="laviz-time-slots" role="listbox" aria-label="ساعت تحویل">
                  <button
                    v-for="opt in deliveryTimes"
                    :key="opt.value"
                    type="button"
                    class="laviz-time-slot"
                    :class="{ 'laviz-time-slot--active': delivery_time === opt.value }"
                    role="option"
                    :aria-selected="delivery_time === opt.value"
                    @click="delivery_time = opt.value"
                  >
                    {{ opt.text }}
                  </button>
                </div>
              </div>
              <div v-else-if="delivery_date !== -1 && deliveryTimes.length === 1" class="mt-3">
                <label class="laviz-field-label">ساعت تحویل</label>
                <div class="laviz-time-slot laviz-time-slot--active laviz-time-slot--readonly">
                  {{ deliveryTimes[0].text }}
                </div>
              </div>

              <div class="mt-3">
                <label class="laviz-field-label">نحوه دریافت سفارش</label>
                <div class="laviz-choice-list" role="radiogroup" aria-label="نحوه دریافت سفارش">
                  <label
                    v-for="opt in deliveryTypeOptions"
                    :key="opt.value"
                    class="laviz-choice"
                    :class="{ 'laviz-choice--active': delivery_type === opt.value }"
                  >
                    <input
                      type="radio"
                      class="laviz-choice__input"
                      name="delivery_type"
                      v-model="delivery_type"
                      :value="opt.value"
                    />
                    <span class="laviz-choice__text">{{ opt.text }}</span>
                  </label>
                </div>
              </div>


              <div class="mt-3" v-if="delivery_type == 'iWillCome'">
                <label class="form-label font-weight-bold">موقعیت رستوران (تحویل حضوری)</label>
                <p class="text-muted small mb-2">{{ mapCenter.address || in_person_description }}</p>
                <client-only>
                  <map-picker
                    ref="restaurantMap"
                    readonly
                    :center-lat="mapCenter.lat"
                    :center-lng="mapCenter.lng"
                    :restaurant-name="mapCenter.name || 'رستوران لاویز'"
                    :restaurant-address="mapCenter.address || in_person_description"
                  />
                </client-only>
              </div>


              <div
                class="mt-3 position-relative"
                v-if="delivery_type == 'sendToMe'"
              >
                <label class="form-label font-weight-bold">آدرس تحویل</label>
                <p class="text-muted small mb-2">
                  هزینه ارسال {{ formatNum(this.shippingCost) }} تومان به فاکتور اضافه می‌شود. ارسال فقط در محدوده شهر.
                </p>
                <div v-if="savedAddresses.length" class="form-group laviz-saved-addresses">
                  <label class="small d-block mb-2">آدرس‌های ذخیره‌شده</label>
                  <div class="laviz-saved-address-list">
                    <button
                      v-for="a in savedAddresses"
                      :key="a.id"
                      type="button"
                      class="laviz-saved-address"
                      :class="{ 'laviz-saved-address--active': selectedAddressId === a.id }"
                      @click="pickSavedAddress(a)"
                    >
                      <span class="laviz-saved-address__title">{{ a.title || 'آدرس ذخیره‌شده' }}</span>
                      <span class="laviz-saved-address__text">{{ a.address }}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="delivery_address"
                ></textarea>
                <label class="small font-weight-bold mt-2 d-block">انتخاب موقعیت روی نقشه</label>
                <client-only>
                  <map-picker
                    ref="deliveryMap"
                    :lat.sync="delivery_lat"
                    :lng.sync="delivery_lng"
                    :center-lat="mapCenter.lat"
                    :center-lng="mapCenter.lng"
                    :restaurant-name="mapCenter.name || 'رستوران لاویز'"
                    :restaurant-address="mapCenter.address"
                    @change="recalcShippingPreview"
                    @address="onMapAddress"
                  />
                </client-only>
                <div class="mt-2 text-muted" style="font-size: 13px">
                  {{ delivery_description }}
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۲</span>
              کد تخفیف
            </h2>
            <p class="laviz-discount-hint mb-2">
              کد تخفیف ۱۰٪ Loviz برای اولین سفارش
            </p>
            <div class="laviz-discount-row">
              <input
                type="text"
                class="form-control"
                v-model="discountCode.code"
                placeholder="کد تخفیف"
                :disabled="discountCode.code_valid_status"
                v-validate="{ required: true }"
                name="code"
                data-vv-as="کد تخفیف"
                autocomplete="off"
                data-vv-scope="discountCode"
                :class="{ 'is-invalid': errors.has('discountCode.code') }"
              />
              <button
                type="button"
                class="btn btn-outline-secondary"
                v-if="discountCode.code_valid_status"
                @click="cancelDiscountCode()"
              >
                لغو
              </button>
              <button
                type="button"
                class="btn btn-primary laviz-btn-apply"
                v-else
                @click="approveDiscountCode()">
                اعمال
              </button>
            </div>
            <div
              class="text-success mt-2 small"
              v-if="discountCode.code_valid_status"
            >
              {{ discountCode.discount_percent }}٪ تخفیف اعمال شد
            </div>
          </section>
        </div>
        <!-- ✅ نمایش محصولات انتخاب شده -->
  <!-- <div class="col-md-12 mt-2" v-if="selectedProducts.length > 0">
    <div class="content-box p-3 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>محصولات انتخاب شده:</strong>
        <b-badge variant="primary">{{ selectedProducts.length }} مورد</b-badge>
      </div>
      
      <div 
        v-for="item in selectedProducts" 
        :key="item.name"
        class="d-flex justify-content-between align-items-center py-1 border-bottom"
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
      
      <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
        <small class="text-muted">جمع جزئی:</small>
        <strong>{{ formatNum(selectedItemsTotal) }} تومان</strong>
      </div>
    </div>
  </div>  -->
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۳</span>
              خلاصه فاکتور
            </h2>
            <div class="laviz-checkout-summary">
              <div v-if="!selectedProducts.length" class="laviz-checkout-summary__empty text-muted text-center py-3">
                هنوز غذایی انتخاب نشده است.
              </div>

              <template v-else>
                <div class="laviz-checkout-summary__items">
                  <div
                    v-for="item in selectedProducts"
                    :key="item.key"
                    class="laviz-checkout-summary__item"
                  >
                    <div class="laviz-checkout-summary__item-name">
                      {{ item.name }}
                      <small class="text-muted d-block">
                        {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
                      </small>
                    </div>
                    <div class="laviz-checkout-summary__item-price">
                      {{ formatNum(item.total) }} تومان
                    </div>
                  </div>
                </div>

                <div class="laviz-checkout-summary__row">
                  <span>جمع اقلام</span>
                  <span>{{ formatNum(bill.total_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount > 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span>+ {{ formatNum(bill.shipping_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount === 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span class="text-muted">رایگان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.tax_amount > 0"
                >
                  <span>مالیات{{ taxPercent ? ` (${taxPercent}٪)` : '' }}</span>
                  <span>+ {{ formatNum(bill.tax_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.discount_amount > 0"
                >
                  <span>تخفیف{{ discountCode.code ? ` (${discountCode.code})` : '' }}</span>
                  <span class="text-danger">− {{ formatNum(bill.discount_amount) }} تومان</span>
                </div>

                <div class="laviz-checkout-summary__row laviz-checkout-summary__total">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{{ formatNum(bill.payment_amount) }} تومان</span>
                </div>
              </template>
            </div>
          </section>
        </div>
        
      </div>

      <div class="laviz-sticky-cta">
        <div class="laviz-sticky-cta__inner">
          <div class="laviz-sticky-cta__price">
            <small>مبلغ قابل پرداخت</small>
            <strong>{{ formatNum(bill.payment_amount) }} تومان</strong>
          </div>
          <button type="button" class="laviz-btn-pay" @click="order()">
            پرداخت و ثبت سفارش
          </button>
        </div>
      </div>

      <footer class="laviz-footer container">
        <p>بلوار بسیج، بعد از سالن آزادی، میدان شهدا، خیابان بصیرت</p>
        <p class="small">مدیریت: تراب‌زاده مقدم</p>
        <p>تلفن: <a href="tel:+985632499000">۰۵۶۳۲۴۹۹۰۰۰</a></p>
        <p>پشتیبانی: <a :href="'tel:' + supportPhone">{{ supportPhone }}</a></p>
        <a
          class="d-inline-block mt-2"
          referrerpolicy="origin"
          target="_blank"
          href="https://trustseal.enamad.ir/?id=318434&amp;Code=iRsYltasTth63EoObN3V"
        >
          <img
            referrerpolicy="origin"
            src="https://Trustseal.eNamad.ir/logo.aspx?id=318434&amp;Code=iRsYltasTth63EoObN3V"
            alt="نماد اعتماد الکترونیک"
            style="cursor: pointer; max-height: 72px;"
            id="iRsYltasTth63EoObN3V"
          />
        </a>
      </footer>
      <success-login-modal
        @order="order"
        :auth="auth"/>
      <register-modal
        @onRegister="registerSuccess"
        @onLogin="loginSuccess"
        @order="order"
        :auth="auth"/>
      <bill-modal
        :display_product="display_product"
        :product-data="productData"
        :products="products"
        :bill-data="billData"
        :delivery_date="deliveryItems[delivery_date]? deliveryItems[delivery_date].date: null"
        :delivery_time="delivery_time"
        :check_one="check_one"
        :delivery_address="delivery_address"
        :shipping-cost="shippingCost"
        :discount-code="discountCode"
        :delivery_type="delivery_type"
        :delivery-lat="delivery_lat"
        :delivery-lng="delivery_lng"
        :address-id="selectedAddressId"
        :order-comment="orderComment"
        :auth="auth"/>
      <profile-modal
        ref="profileModal"
        :support-phone="supportPhone"
        :map-center="mapCenter"
        @addresses-changed="refreshSavedAddresses"
      />
      <image-details-modal :src="modal.image"/>
      <pwa-call-out/>
    </div>

  </b-overlay>
</template>

<script>
import moment from "moment-jalaali";
// import moment from 'moment/min/moment-with-locales'
// moment.locale('fa')
import 'moment/locale/fa'  // برای فارسی
moment.locale('fa')
import fa from "moment/src/locale/fa";
import PwaCallOut from "../components/pwa-call-out.vue";
import SuccessLoginModal from "./index/components/successLoginModal.vue";
import RegisterModal from "./index/components/registerModal.vue";
import BillModal from "./index/components/billModal.vue";
import Vue from "vue";
import ProductItem from "~/pages/index/components/productItem.vue";
import ImageDetailsModal from "@/pages/index/components/image-details-modal.vue";
import ProfileModal from "./index/components/profileModal.vue";
import MapPicker from "~/components/MapPicker.vue";
import { applyAppModeTheme } from "~/utils/appModeTheme";
import { DEFAULT_MAP_CENTER } from "~/utils/mapir";

moment.locale("fa", fa);
moment.loadPersian(true, {dialect: "persian-modern"});

export default {
  name: "index",
  components: {ImageDetailsModal, ProductItem, BillModal, RegisterModal, SuccessLoginModal, PwaCallOut, ProfileModal, MapPicker},
  data() {
    return {
      modal: {
        image: null,
      },
      loading: false,
      shippingCost: 0,
      tax_amount: 0,
      taxEnabled: false,
      taxPercent: 0,
      delivery_lat: null,
      delivery_lng: null,
      selectedAddressId: null,
      orderComment: '',
      currentOrder: null,
      currentOrderItems: [],
      downloadingReceiptId: null,
      showCurrentOrderDetails: false,
      supportPhone: '09155611540',
      mapCenter: {
        lat: DEFAULT_MAP_CENTER.lat,
        lng: DEFAULT_MAP_CENTER.lng,
        address: DEFAULT_MAP_CENTER.address,
        name: 'رستوران لاویز',
      },
      savedAddresses: [],
      mode: null,
      auth: {
        is_login: false,
        token: null,
        user: {},
        discountCodeRequest: false,
      },
      display_product: false,
      products: [],
      productCategories: [],
      productData: {},
      deliveryItems: [],
      deliveryTimes: [],
      deliveryTypeOptions: [
        { text: "حضوری میام", value: "iWillCome" },
        { text: "برام ارسال کنید", value: "sendToMe" },
      ],
      discountCode: {
        code: null,
        code_valid_status: false,
        discount_percent: 0,
      },
      bill: {
        discount_amount: 0,
        total_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        decreased_amount: 0,
        payment_amount: 0,
      },
      delivery_type: null,
      delivery_date: -1,
      delivery_time: null,
      check_one: false,
      delivery_address: null,
      delivery_description: null,
      in_person_description: null,
      loading_payment: false,
      billData: {
        total_amount: null,
        discount_amount: null,
        payment_amount: null,
        is_first_order: null,
      },
      menuTypeOrder: null,
      sumInCurrentMenu: 0,
      tabIndex: 0,
      currentActiveTabId: null,
    };
  },
  created() {
    Vue.prototype.formatNum = (n) => {
      var n = ("" + n).split(".");
      var num = n[0];
      var dec = n[1];
      var r, s, t;

      if (num.length > 3) {
        s = num.length % 3;

        if (s) {
          t = num.substring(0, s);
          num = t + num.substring(s).replace(/(\d{3})/g, ",$1");
        } else {
          num = num
            .substring(s)
            .replace(/(\d{3})/g, ",$1")
            .substring(1);
        }
      }

      if (dec && dec.length > 3) {
        dec = dec.replace(/(\d{3})/g, "$1 ");
      }

      return num + (dec ? "." + dec : "");
    };
  },
  mounted() {


    this.initialize();
    let token = localStorage.getItem("token");
    let user = localStorage.getItem("user");
    if (token && user) {
      this.auth.token = token;
      this.auth.user = JSON.parse(user);
      this.auth.is_login = true;
      this.$axios.setHeader("Authorization", "Bearer " + token);
      this.loadCurrentOrder();
    }
  },
  methods: {
    pickSavedAddress(addr) {
      this.selectedAddressId = addr.id;
      this.delivery_address = addr.address;
      this.delivery_lat = addr.lat;
      this.delivery_lng = addr.lng;
      this.recalcShippingPreview();
    },
    onMapAddress(addr) {
      if (addr) this.delivery_address = addr;
    },
    async refreshSavedAddresses() {
      if (!this.auth.is_login) return;
      try {
        const res = await this.$axios.get('/api/enduser/profile/addresses');
        this.savedAddresses = res.data;
      } catch (e) {
      }
    },
    async recalcShippingPreview() {
      if (this.delivery_type !== 'sendToMe' || !this.delivery_lat) return;
      try {
        const products = [];
        for (const product of this.products) {
          if (this.productData[product.key]?.count) {
            products.push({ product_id: product.key, count: this.productData[product.key].count });
          }
        }
        if (!products.length) return;
        const res = await this.$axios.post('/api/enduser/order/preview', {
          products,
          delivery_type: 'sendToMe',
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        });
        this.shippingCost = res.data.shipping_cost ?? this.shippingCost;
        this.calcBill();
      } catch (e) {
      }
    },
    async loadCurrentOrder() {
      try {
        const res = await this.$axios.get('/api/enduser/profile/orders/current');
        if (res.data?.order) {
          this.currentOrder = res.data.order;
          this.currentOrderItems = (res.data.items || []).map((i) => ({
            title: i.productTitle || 'محصول',
            count: i.count,
            lineTotal: Number(i.amount) * Number(i.count),
          }));
        } else {
          this.currentOrder = null;
          this.currentOrderItems = [];
        }
      } catch (e) {
        this.currentOrder = null;
        this.currentOrderItems = [];
      }
    },
    async downloadReceipt(order) {
      if (!order?.id) return;
      this.downloadingReceiptId = order.id;
      try {
        const res = await this.$axios.get(`/api/enduser/profile/orders/${order.id}/receipt.pdf`, {
          responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${order.orderNumber || order.id.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        this.$bvToast.toast('خطا در دانلود رسید', { variant: 'danger' });
      } finally {
        this.downloadingReceiptId = null;
      }
    },
    dateSelection(index) {
      if (!this.deliveryItems[index].status)
        return;
      this.delivery_date = index;
    },
    handleTabChange(newTabIndex) {
      const activeCategories = this.visibleCategories;
      if (activeCategories[newTabIndex]) {
        this.currentActiveTabId = activeCategories[newTabIndex].id;
      } else if (activeCategories[0]) {
        this.currentActiveTabId = activeCategories[0].id;
      }
    },
    async initialize() {
      this.loading = true;
      try {
        const resp = await this.$axios.get('/api/enduser/core/initialize');
        this.productCategories = resp.data.categories;
        this.products = resp.data.products;
        this.deliveryItems = resp.data.schedule.activeDays;
        this.shippingCost = resp.data.shippingCost;
        this.delivery_address = resp.data.address;
        if (resp.data.mapCenter) this.mapCenter = resp.data.mapCenter;
        if (resp.data.supportPhone) this.supportPhone = resp.data.supportPhone;
        this.savedAddresses = resp.data.savedAddresses || [];
        this.delivery_description = resp.data.delivery_description;
        this.in_person_description = resp.data.in_person_description;
        this.mode = resp.data.mode;
        this.taxEnabled = !!resp.data.taxEnabled;
        this.taxPercent = Number(resp.data.taxPercent) || 0;
        applyAppModeTheme(this.mode);
        this.setProduct();

        if (this.productCategories.length > 0) {
          this.$nextTick(() => {
            this.handleTabChange(this.tabIndex);
            if (!this.currentActiveTabId) {
              const first = this.visibleCategories[0];
              if (first) this.currentActiveTabId = first.id;
            }
          });
        }
      } catch (e) {
        this.$bvToast.toast('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.', { variant: 'danger', noAutoHide: true });
      } finally {
        this.loading = false;
      }
    },
    setProduct() {
  for (let product of this.products) {
    this.$set(this.productData, product.key, {
      name: product.name,
      price: product.price,
      image: product.thumbnail
        ? this.$axios.defaults.baseURL + product.thumbnail
        : product.image
          ? this.$axios.defaults.baseURL + product.image
          : require('@/assets/media/no-image.jpg'),
      imageFull: product.image ? this.$axios.defaults.baseURL + product.image : null,
      discount_percent: product.discount_percent,
      description: product.description,
      add_unit: product.add_unit,
      unit_name: product.unit_name,
      isOutOfStock: product.isOutOfStock,
      count: 0,
      total_amount: 0,
      menu_type: product.menu_type,
      isSpecial: product.isSpecial,
      specialDaysText: product.specialDaysText
    });
  }
  this.display_product = true;
},
    // setProduct() {
    //   for (let product of this.products) {
    //     this.productData[product.key] = {
    //       name: product.name,
    //       price: product.price,
    //       thumbnail: product.thumb ? this.$axios.defaults.baseURL + product.thumb : require('@/assets/media/no-image.jpg'),
    //       image: product.image ? this.$axios.defaults.baseURL + product.image : null,
    //       discount_percent: product.discount_percent,
    //       description: product.description,
    //       add_unit: product.add_unit,
    //       unit_name: product.unit_name,
    //       isOutOfStock: product.isOutOfStock,
    //       count: 0,
    //       total_amount: 0,
    //       menu_type: product.menu_type,
    //       isSpecial: product.isSpecial,
    //       specialDaysText: product.specialDaysText
    //     };
    //   }
    //   this.display_product = true;
    // },
    addProductCount(pKey, unit) {
      const selectedProduct = this.productData[pKey];
      const selectedMenuType = selectedProduct.menu_type;

      if (selectedMenuType === 'specialDay') {
        if (this.delivery_date === -1) {
          this.$bvToast.toast("لطفاً ابتدا تاریخ تحویل را انتخاب کنید تا امکان سنجی سرو غذا مشخص شود.", {
            variant: "warning",
          });
          return;
        }

        const selectedDeliveryDate = this.deliveryItems[this.delivery_date].date;
        const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").day();
        // const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").startOf('day').day();
        const adjustedDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

        if (selectedProduct.isSpecial) {
          const productInList = this.products.find(p => p.key === pKey);
          const allowedDays = JSON.parse(productInList.specialDay);

          if (!allowedDays.includes(adjustedDay)) {
            this.$bvToast.toast(`این غذا در روز ${this.getDeliveryItemText(this.delivery_date)} (${this.jalaliDate(selectedDeliveryDate, "dddd")}) سرو نمی‌شود.`, {
              variant: "danger",
            });
            return;
          }
        }
      }

      this.display_product = false;
      // this.productData[pKey].count += unit;
      this.$set(this.productData[pKey], 'count', this.productData[pKey].count + unit);
      this.display_product = true;
      this.calcBill();
    },

    subProductCount(pKey, unit) {
      if (this.productData[pKey].count <= 0) {
        return;
      }

      this.display_product = false;

      // this.productData[pKey].count -= unit;
      this.$set(this.productData[pKey], 'count', this.productData[pKey].count - unit);
      this.display_product = true;
      this.calcBill();
    },
    calcBill() {
      this.bill.total_amount = 0;
      this.bill.discount_amount = 0;
      this.bill.tax_amount = 0;
      this.bill.shipping_amount = 0;
      this.bill.payment_amount = 0;

      for (const product of this.products) {
        this.bill.total_amount +=
          Number(this.productData[product.key].price) *
          Number(this.productData[product.key].count);
      }

      if (this.delivery_type === 'sendToMe') {
        this.bill.shipping_amount = Number(this.shippingCost || 0);
      }

      const beforeTax = this.bill.total_amount + this.bill.shipping_amount;
      if (this.taxEnabled && this.taxPercent > 0) {
        this.bill.tax_amount = Math.round((beforeTax * this.taxPercent) / 100);
      }

      let subtotal = beforeTax + this.bill.tax_amount;

      if (this.discountCode.code_valid_status) {
        this.bill.discount_amount =
          (subtotal / 100) * this.discountCode.discount_percent;
      }

      this.bill.payment_amount = Math.max(0, subtotal - this.bill.discount_amount);
    },
    async order() {
      let selected_product = false;
      for (let product of this.products) {
        if (this.productData[product.key].count > 0) {
          selected_product = true;

          if (this.productData[product.key].menu_type === 'specialDay') {
            if (this.delivery_date === -1) {
              this.$bvToast.toast("لطفاً تاریخ تحویل را انتخاب کنید", {
                variant: "danger",
              });
              return false;
            }

            const selectedDeliveryDate = this.deliveryItems[this.delivery_date].date;
            const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").day();
            const adjustedDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

            const productInList = this.products.find(p => p.key === product.key);
            if (productInList && productInList.specialDay) {
              const allowedDays = JSON.parse(productInList.specialDay);
              if (!allowedDays.includes(adjustedDay)) {
                this.$bvToast.toast(`غذا "${this.productData[product.key].name}" برای روز انتخاب شده مجاز نیست.`, {
                  variant: "danger",
                });
                return false;
              }
            }
          }
        }
      }

      if (!selected_product) {
        this.$bvToast.toast("حداقل یک محصول را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      let sumKG = 0;
      for (let product of this.products) {
        sumKG = Number(sumKG) + Number(this.productData[product.key].count);
      }

      if (sumKG <= 0.5) {
        this.$bvToast.toast("حداقل سفارش یک کیلوگرم می باشد", {
          variant: "danger",
        });
        return false;
      }

      if (!this.delivery_type) {
        this.$bvToast.toast("لطفا نحوه دریافت خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_date === -1) {
        this.$bvToast.toast("تاریخ تحویل خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_type == "sendToMe" && !this.delivery_address) {
        this.$bvToast.toast("لطفا آدرس محل تحویل خود را وارد کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_type == "iWillCome" && !this.delivery_time) {
        if (this.deliveryTimes.length > 1) {
          this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
          return false;
        }
      }

      if (this.delivery_type == "sendToMe" && this.deliveryTimes.length > 1 && !this.delivery_time) {
        this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
        return false;
      }

      if (!this.auth.is_login) {
        this.$bvModal.show("modal-login");
        return;
      }

      this.loading_payment = true;

      try {
        let data = {
          products: [],
          delivery_date: this.delivery_date !== -1 ? this.deliveryItems[this.delivery_date].date : null,
          delivery_type: this.delivery_type,
          delivery_time: this.delivery_time,
          check_one: this.check_one,
          delivery_address: this.delivery_address,
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        };

        for (let product of this.products) {
          if (this.productData[product.key].count) {
            data.products.push({
              product_id: product.key,
              count: this.productData[product.key].count,
            });
          }
        }

        let resp = await this.$axios.post("/api/enduser/order/preview", data);

        this.billData.total_amount = resp.data.total_amount;
        this.billData.discount_amount = resp.data.discount_amount;
        this.billData.payment_amount = resp.data.payment_amount;
        this.billData.shipping_cost = resp.data.shipping_cost;
        this.billData.tax_amount = resp.data.tax_amount || 0;
        this.shippingCost = resp.data.shipping_cost || this.shippingCost;
        this.billData.is_first_order = resp.data.is_first_order;
        this.$bvModal.show("modal-bill");
      } catch (error) {
        if (error.response && error.response.status == 401) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
          this.$bvModal.show("modal-login");
          return;
        }
        this.loading_payment = false;
        if (error.response) {
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
        }
      }
    },
    async approveDiscountCode() {

      if (!this.auth.is_login) {
        this.auth.discountCodeRequest = true;
        this.$bvModal.show("modal-login");
        return;
      }

      try {
        let res = await this.$validator.validateAll("discountCode");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.get("/api/enduser/core/check-discount-code/" + this.discountCode.code + `?basketAmount=${this.bill.payment_amount}`);
        this.discountCode.code_valid_status = true;
        const discountValue = Number(resp.data.value)

        this.discountCode.discount_percent = discountValue;

        this.bill.decreased_amount = this.bill.total_amount * (discountValue / 100);
        this.bill.discount_amount = this.bill.total_amount - this.bill.decreased_amount;


      } catch (error) {
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    async cancelDiscountCode() {
      this.discountCode.code = null;
      this.discountCode.code_valid_status = false;
      this.discountCode.discount_percent = 0;
    },
    registerSuccess() {
      this.$bvModal.hide("modal-login");
      this.$bvModal.show("success-login");

      this.loginForm = {
        step: "checkMobile",
        new_user: true,
        data: {
          mobile: null,
          first_name: null,
          last_name: null,
          verify_code: null,
        },
      };
    },
    loginSuccess() {
      this.$bvModal.hide("modal-login");
      if (this.auth.discountCodeRequest == true) {
        this.approveDiscountCode();
        this.auth.discountCodeRequest = false;
      } else {
        this.$bvModal.show("success-login");
      }


    },
    async logout() {
      try {
        if (!this.auth.is_login) return false;

        const result = await this.$bvModal.msgBoxConfirm(
          "آیا برای خروج اطمینان دارید؟",
          {
            title: "خروج",
            size: "sm",
            buttonSize: "sm",
            okVariant: "success",
            headerClass: "p-2 border-bottom-0",
            footerClass: "p-2 border-top-0",
            centered: true,
            okTitle: "بله",
            cancelTitle: "خیر",
            cancelVariant: "danger",
          }
        );

        if (result === true) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
        }
      } catch {
      }
    },
    jalaliDate(date, format = "jYYYY/jM/jD") {
      const result = moment(date, "YYYY/M/D").format(format);
      return result.replaceAll('آدینه', 'جمعه');
    },
    getDeliveryItemText(index) {
      switch (index) {
        case 0:
          return 'امروز';
        case 1:
          return 'فردا';
        case 2:
          return 'پس فردا'
      }
    },
    setDeliveryTimeItems(index) {
      this.delivery_time = null;
      const times = this.deliveryItems[index]?.deliveryTimes || [];
      this.deliveryTimes = times.map((f) => ({ value: f, text: f }));
      if (this.deliveryTimes.length === 1) {
        this.delivery_time = this.deliveryTimes[0].value;
      }
    },
    showImageModal(imageSrc) {
      this.modal.image = imageSrc
        ? String(imageSrc).replace('/food/thumbnail/', '/food/')
        : imageSrc;
      if (!imageSrc)
        return
      this.$bvModal.show("image-details-modal");
    },
    removeProduct(pKey) {
      this.display_product = false;
      this.productData[pKey].count = 0;
      this.display_product = true;
      this.calcBill();
    },
  },
  watch: {
    mode(value) {
      applyAppModeTheme(value);
    },
    delivery_date(value) {
      this.calcBill();
      if (value !== -1) {
        this.setDeliveryTimeItems(value);
      }
    },
    delivery_type(value) {
      this.calcBill();
      if (value === 'sendToMe') {
        this.$nextTick(() => this.$refs.deliveryMap?.refreshMap());
      } else if (value === 'iWillCome') {
        this.$nextTick(() => this.$refs.restaurantMap?.refreshMap());
      }
    },
    "discountCode.code_valid_status"() {
      this.calcBill();
    },
    tabIndex(newIndex) {
      this.handleTabChange(newIndex);
    }
  },
  computed: {
    showCategoryTabs() {
      const cats = this.visibleCategories;
      return cats.length > 1;
    },
    visibleCategories() {
      return this.productCategories.filter(cat =>
        this.products.some(p => p.categoryId === cat.id)
      );
    },
    weeklyPlan() {
      const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      const dailyProducts = this.products
        .filter((p) => p.menu_type !== 'specialDay')
        .map((p) => p.name);
      return dayNames.map((name, dayIndex) => {
        const specialProducts = this.products.filter((p) => {
          if (p.menu_type !== 'specialDay' || !p.specialDay) return false;
          try {
            const allowed = JSON.parse(p.specialDay);
            return Array.isArray(allowed) && allowed.includes(dayIndex);
          } catch {
            return false;
          }
        }).map((p) => p.name);
        const products = [...dailyProducts, ...specialProducts];
        return { name, products: [...new Set(products)] };
      });
    },
    todayWeekIndex() {
      const map = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
      return map[new Date().getDay()] ?? 0;
    },
    currentOrderStatusLabel() {
      if (!this.currentOrder) return '';
      const map = { 10: 'در انتظار تایید رستوران', 12: 'در حال آماده‌سازی', 13: 'تحویل پیک', 1: 'پرداخت شده' };
      return map[this.currentOrder.status] || 'در حال پیگیری';
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
    selectedItemsTotal() {
      return this.selectedProducts.reduce((sum, item) => sum + item.total, 0);
    },
  }
};
</script>

<style>
/* صفحه اصلی — جزئیات در assets/scss/main.scss */
</style>
