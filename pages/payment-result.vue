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
        <p style="font-weight: bold;font-size: 20px;margin-bottom: 10px">پرداخت موفق بود</p>
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
          جزئیات سفارش از طریق پیامک برای شما ارسال شد.
        </span>
        <nuxt-link
          to="/" class="mt-2 btn btn-primary">صفحه اصلی
        </nuxt-link>
      </div>
    </div>
    <!--support-->
    <div class="row">
      <div class="col-12 mt-2">
        <p>
          آدرس: بلوار بسیج، بعد از سالن آزادی، میدان شهدا، خیابان بصیرت
          مدیریت : تراب زاده مقدم
        </p>
        <p>تلفن : <a href="tel:+985632499000">05632499000</a></p>
        <p>پشتیبانی : <a href="tel:+989155611540">09155611540</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'payment-result',
  data() {
    return {
      paymentStatus: false,
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
    if (this.$route.query.status == 1)
      this.paymentStatus = true

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
  methods: {}
}
</script>
