<template>
  <div class="container">
    <!--header-->
    <div class="row">
      <!--header-->
      <div class="col-md-12 d-flex flex-column justify-content-center align-items-center pt-3 pb-3">
        <img src="@/assets/media/logo.png" class="header-logo"/>
      </div>
    </div>
    <!--body-->
    <div class="row mt-5" v-if="!paymentStatus">
      <div class="col-md-12 d-flex flex-column justify-content-center align-items-center pt-3 pb-3">
        <!--        <img src="@/assets/media/fail.png">-->
        <img src="@/assets/media/fail.png" width="100">
        <p>پرداخت ناموفق بود!</p>
        <nuxt-link to="/" class="btn btn-primary">صفحه اصلی</nuxt-link>
      </div>
    </div>
    <!---->
    <div class="row mt-1" v-else-if="paymentStatus">
      <div class="col-md-12 d-flex flex-column justify-content-center align-items-center pt-3 pb-3">
        <img src="@/assets/media/success.png" width="100">
        <p style="font-weight: bold;font-size: 20px;margin-bottom: 10px">پرداخت با موفقیت انجام شد</p>
        <!--        <p style="font-weight: bold;font-size: 17px;margin-bottom: 10px">کد پیگیری : {{ paymentDetail.ref_code }}</p>-->
        <!--        <p style="text-align: center;font-size: 17px">-->
        <!--          جزییات پرداخت : <br>-->
        <!--          خریدار عزیز {{ paymentDetail.customerName }}<br>-->
        <!--          {{ paymentDetail.basketProductsDetail }}<br>-->

        <!--          مبلغ پرداختی : {{ paymentDetail.sumBasket }}<br>-->

        <!--          زمان دریافت : {{ paymentDetail.dayName }} {{ paymentDetail.date }}-->
        <!--          <span v-if="paymentDetail.clock">-->
        <!--            ساعت {{ paymentDetail.clock }}-->
        <!--          </span>-->
        <!--          <br>-->
        <!--          <span v-if="paymentDetail.delivery_type=='iWillCome'">-->
        <!--                      توجه : در زمان انتخابی برای دریافت سفارش به آدرس زیر مراجعه فرمایید.-->
        <!--          </span>-->
        <!--          <span v-if="paymentDetail.delivery_type=='sendToMe'">-->
        <!--            ارسال به ادرس : {{ paymentDetail.delivery_address }}-->
        <!--          </span>-->
        <span>
          در انتظار تأیید رستوران
        </span>
        <span>تا ۵ ثانیهٔ دیگر به صفحهٔ اصلی بازمی‌گردید.</span>
        <nuxt-link
          to="/" class="mt-2 btn btn-primary">صفحه اصلی
        </nuxt-link>
      </div>
    </div>
    <!--support-->
    <div class="row">
      <div class="col-12 mt-2">
        <p>
          آدرس: {{ shopInfo.address }}
          <span v-if="shopInfo.managerName">— مدیریت: {{ shopInfo.managerName }}</span>
        </p>
        <p v-if="shopInfo.phone">تلفن : <a :href="'tel:' + shopInfo.phone">{{ shopInfo.phone }}</a></p>
        <p>پشتیبانی : <a :href="'tel:' + shopInfo.supportPhone">{{ shopInfo.supportPhone }}</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'payment-result',
  data() {
    return {
      leavingResult: false,
      // The gateway loads this page directly, so there is no menu request to
      // read the shop details from; the menu caches them for us.
      shopInfo: {
        address: 'بلوار بسیج، بعد از سالن آزادی، میدان شهدا، خیابان بصیرت',
        phone: '05632499000',
        managerName: 'تراب‌زاده مقدم',
        supportPhone: '09155611540',
      },
      paymentDetail: {
        customerName: null,
        basketProductsDetail: null,
        sumBasket: null,
        date: null,
        dayName: null,
        ref_code: null,
        delivery_type: null,
        delivery_address: null,
        delivery_amount: null,
        is_first_order: null,
        clock: null,

      }
    };
  },
  async mounted() {
    // return;
    // let resp = await this.$axios.get("/api/enduser/payment");
    try {
      const cached = localStorage.getItem('shopInfo');
      if (cached) this.shopInfo = { ...this.shopInfo, ...JSON.parse(cached) };
    } catch (e) { /* fall back to the defaults above */ }

    this.scheduleReturn();

    //   if (this.$route.query.customerName) this.paymentDetail.customerName = this.$route.query.customerName
    // if (this.$route.query.basketProductsDetail) this.paymentDetail.basketProductsDetail = this.$route.query.basketProductsDetail
    // if (this.$route.query.sumBasket) this.paymentDetail.sumBasket = this.$route.query.sumBasket
    // if (this.$route.query.date) this.paymentDetail.date = this.$route.query.date
    // if (this.$route.query.refCode) this.paymentDetail.ref_code = this.$route.query.refCode
    // if (this.$route.query.delivery_type) this.paymentDetail.delivery_type = this.$route.query.delivery_type
    //
    // if (this.$route.query.dayName) this.paymentDetail.dayName = this.$route.query.dayName
    // if (this.$route.query.clock) this.paymentDetail.clock = this.$route.query.clock
    //
    // if (this.$route.query.delivery_address) this.paymentDetail.delivery_address = this.$route.query.delivery_address
    // if (this.$route.query.delivery_amount) this.paymentDetail.delivery_amount = this.$route.query.delivery_amount
    // if (this.$route.query.is_first_order) this.paymentDetail.is_first_order = this.$route.query.is_first_order
  },
  computed: {
    paymentStatus() {
      // BACKEND: the callback status is display-only; the server must verify the
      // gateway result before redirecting here. Existing accepted values retained.
      return [1, 2, 4, 10, 12, 13].includes(Number(this.$route.query.status));
    },
  },
  watch: {
    '$route.query.status'() { this.scheduleReturn(); },
  },
  beforeRouteLeave(to, from, next) {
    this.leavingResult = true;
    this.clearReturn();
    next();
  },
  beforeDestroy() { this.clearReturn(); },
  methods: {
    clearReturn() {
      if (this.returnTimer) clearTimeout(this.returnTimer);
      this.returnTimer = null;
    },
    scheduleReturn() {
      this.clearReturn();
      if (!this.paymentStatus) return;
      this.$nextTick(() => {
        if (this.leavingResult || this._isBeingDestroyed || this._isDestroyed || !this.paymentStatus) return;
        this.clearReturn();
        this.returnTimer = setTimeout(() => {
          this.returnTimer = null;
          this.$router.replace('/');
        }, 5000);
      });
    },
  },
}
</script>
