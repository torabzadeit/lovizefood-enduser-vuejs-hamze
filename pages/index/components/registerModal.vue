<template>
  <b-modal id="modal-login" centered hide-footer hide-header>
    <!---->
    <form
      @submit.prevent="checkMobile"
      v-show="loginForm.step == 'checkMobile'"
    >
      <div class="form-group">
        <label>شماره تلفن همراه</label>
        <input
          type="tel"
          dir="ltr"
          inputmode="numeric"
          v-model="loginForm.data.mobile"
          class="form-control"
          placeholder="09123456789"
          v-validate="{ required: true, mobile_iran: true }"
          name="mobile"
          data-vv-as="شماره تلفن همراه"
          autocomplete="tel"
          data-vv-scope="checkMobile"
          :class="{ 'is-invalid': errors.has('checkMobile.mobile') }"
          @input="onMobileInput"
          @blur="onMobileBlur"
        />
        <div class="invalid-feedback">
          {{ errors.first("checkMobile.mobile") }}
        </div>
      </div>
      <button type="submit" class="btn btn-primary">ادامه</button>
    </form>
    <!---->
    <form @submit.prevent="register" v-show="loginForm.step == 'register'">
      <!---->
      <p>کد تایید به شماره تلفن {{ loginForm.data.mobile }} ارسال شد</p>
      <!---->
      <a href="#" @click="editPhoneNumber()">اصلاح شماره موبایل</a>
      <!---->
      <div class="form-group">
        <label>نام</label>
        <input
          type="text"
          v-model="loginForm.data.first_name"
          class="form-control"
          placeholder="نام خود را وارد کنید"
          v-validate="{ required: true }"
          name="first_name"
          data-vv-as="نام"
          autocomplete="off"
          data-vv-scope="register"
          :class="{ 'is-invalid': errors.has('register.first_name') }"
        />
        <div class="invalid-feedback">
          {{ errors.first("register.first_name") }}
        </div>
      </div>
      <!---->
      <div class="form-group">
        <label>نام خانوادگی</label>
        <input
          type="text"
          v-model="loginForm.data.last_name"
          class="form-control"
          placeholder="نام خانوادگی خود را وارد کنید"
          v-validate="{ required: true }"
          name="last_name"
          data-vv-as="نام خانوادگی"
          autocomplete="off"
          data-vv-scope="register"
          :class="{ 'is-invalid': errors.has('register.last_name') }"
        />
        <div class="invalid-feedback">
          {{ errors.first("register.last_name") }}
        </div>
      </div>
      <!---->
      <div class="form-group">
        <label>کد تایید پیامک شده را وارد کنید</label>
        <input
          type="number"
          v-model="loginForm.data.verify_code"
          class="form-control text-center"
          placeholder=" -  -  -  -  -  - "
          v-validate="{ required: true }"
          name="verify_code"
          data-vv-as="کد تایید"
          autocomplete="off"
          data-vv-scope="register"
          :class="{ 'is-invalid': errors.has('register.verify_code') }"
        />
        <div class="invalid-feedback">
          {{ errors.first("register.verify_code") }}
        </div>
      </div>
      <!---->
      <button type="submit" class="btn btn-primary">ثبت نام</button>
    </form>
    <!---->
    <form @submit.prevent="login" v-show="loginForm.step == 'login'">
      <!---->
      <p v-if="auth.is_login">
        کد تایید به شماره تلفن همراه {{ loginForm.data.mobile }} ارسال شد
      </p>
      <!---->
      <a href="#" @click="editPhoneNumber()">اصلاح شماره موبایل</a>
      <!---->
      <div class="form-group">
        <label>کد تایید پیامک شده را وارد کنید</label>
        <input
          type="number"
          v-model="loginForm.data.verify_code"
          class="form-control text-center"
          placeholder=" -  -  -  -  -  - "
          v-validate="{ required: true }"
          name="verify_code"
          data-vv-as="کد تایید"
          autocomplete="off"
          data-vv-scope="login"
          :class="{ 'is-invalid': errors.has('login.verify_code') }"
        />
        <div class="invalid-feedback">
          {{ errors.first("login.verify_code") }}
        </div>
      </div>
      <!---->
      <button type="submit" class="btn btn-primary">ورود</button>
    </form>
  </b-modal>
</template>

<script>
import { normalizeMobileIran } from '~/utils/mobile';

export default {
  name: "registerModal",
  methods: {
    onMobileInput() {
      const normalized = normalizeMobileIran(this.loginForm.data.mobile);
      if (normalized !== this.loginForm.data.mobile) {
        this.loginForm.data.mobile = normalized;
      }
    },
    onMobileBlur() {
      this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
    },
    async checkMobile() {
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("checkMobile");
        if (!res) throw "فرم زیر را تکمیل کنید";
        let resp = await this.$axios.post("/api/auth/check-mobile", {
          mobile: this.loginForm.data.mobile,
        });

        if (resp.data.is_new_user) {
          this.loginForm.data.first_name = null;
          this.loginForm.data.last_name = null;
          this.loginForm.step = "register";
        } else {
          this.loginForm.step = "login";
          this.loginForm.new_user = false;
          this.loginForm.data.first_name = resp.data.user.first_name;
          this.loginForm.data.last_name = resp.data.user.last_name;
        }
      } catch (error) {
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    async register() {
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("register");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.post("/api/auth/register", {
          mobile: this.loginForm.data.mobile,
          first_name: this.loginForm.data.first_name,
          last_name: this.loginForm.data.last_name,
          verify_code: this.loginForm.data.verify_code,
        });

        this.auth.is_login = true;
        this.auth.user = resp.data.user;
        this.auth.token = resp.data.token;
        this.$axios.setHeader(
          "Authorization",
          "Bearer " + resp.data.token
        );
        localStorage.setItem("token", resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        this.$emit('onRegister')
      } catch (error) {
        console.log(error);
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    async login() {
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("login");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.post("/api/auth/login", {
          mobile: this.loginForm.data.mobile,
          verify_code: this.loginForm.data.verify_code,
        });
        this.auth.is_login = true;
        this.loginForm.data = resp.data.user;
        this.auth.token = resp.data.token;
        this.auth.user = {
          first_name: resp.data.user.first_name,
          last_name: resp.data.user.last_name
        }
        this.$axios.setHeader(
          "Authorization",
          "Bearer " + resp.data.token
        );

        localStorage.setItem("token", resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        this.$emit('onLogin')


      } catch (error) {
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    editPhoneNumber() {
      this.loginForm.step = "checkMobile";
      this.loginForm.new_user = true;
      this.loginForm.data.mobile = null;
      this.loginForm.data.first_name = null;
      this.loginForm.data.last_name = null;
      this.loginForm.data.verify_code = null;
    },
  },
  props: {
    auth: Object,
  },
  emits: ['onRegister', 'onLogin'],
  data() {
    return {
      loginForm: {
        step: "checkMobile", // checkMobile | register | login
        new_user: true,
        data: {
          mobile: null,
          first_name: null,
          last_name: null,
          verify_code: null,
        },
      },
    }
  }
}
</script>

<style scoped>

</style>
