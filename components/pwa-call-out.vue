<template>
  <div class="pwa-call-out" v-if="installPopupPwaStatus && windowWidth < 600">

    <div class="container">
      <div class="row">
        <div class="col-12 d-flex justify-content-center mt-3">
          <img src="/logo.png" class="pwa-call-out__logo">
        </div>
        <div class="col-12 text-center mt-3">
          <h2 class="h5 pr-4 pl-4" style="line-height: 35px">{{ text }}</h2>
        </div>
        <div class="col-12 text-center mt-2">
          <p class="title-4">و براحتی در روزهای آینده ثبت سفارش نمایید.</p>
        </div>
      </div>
      <div class="row mt-2" v-if="device=='ios'">
        <div class="col-12">
          <ul class="pwa-call-out__list">
            <li>
              1- در نوار پایین دکمه
              <img src="@/assets/media/pwa-callout/icon-share.png" style="width: 20px;margin: 0 5px">
              را انتخاب کنید.
            </li>
            <li>
              2- منوی بازشده را به چپ بکشید و گزینه "Add to home screen" را انتخاب کنید.
            </li>
            <li>
              <img src="@/assets/media/pwa-callout/add-to-home-screen.png" style="width: 100%;">
            </li>
            <li>
              3- در مرحله بعد در قسمت بالا روی "Add" یا "save" کلیک کنید.
            </li>
          </ul>
        </div>
      </div>
      <div class="row mt-2" v-else-if="device=='android'">
        <div class="col-12">
          <ul class="pwa-call-out__list">
            <li>
              1- در نوار بالا دکمه
              <img src="@/assets/media/pwa-callout/andriod-chrome-more.png" style="width: 20px;margin: 0 5px">
              را انتخاب کنید.
            </li>
            <li>
              2- از منوی باز شده گزینه Add to home screen را انتخاب کنید.
            </li>
            <li>
              3- در مرحله بعد در قسمت بالا روی "Add" یا "save" کلیک کنید.
            </li>
          </ul>
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-12">
          <button class="pwa-call-out__btn" @click="ok()">متوجه شدم</button>

          <br><br><br><br>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "pwa-call-out",
  props: {
    /** Wording is set in the panel. */
    text: { type: String, default: 'اپ لاویز را به صفحه اصلی گوشی خود اضافه نمایید.' },
  },
  data() {
    return {
      installPopupPwaStatus: false,
      windowWidth: window.innerWidth,
      device: null
    }
  },
  mounted() {

    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent))
      this.device = "android";

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)
      this.device = "ios";

    //this.showPwaInstaller()
    this.run()
  },
  methods: {
    showPwaInstaller() {
      var deferredPrompt;

      window.addEventListener('beforeinstallprompt', (e) => {

        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;

        this.installPopupPwaStatus = true
      });
    },
    run() {
      if (!window.matchMedia('(display-mode: standalone)').matches)
        if (!localStorage.getItem('pwaCallOut'))
          this.installPopupPwaStatus = true
    },
    ok() {
      localStorage.setItem('pwaCallOut', true);
      this.installPopupPwaStatus = false
    }
  }
}
</script>

<style scoped>

</style>
