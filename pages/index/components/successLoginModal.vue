<template>
  <b-modal id="success-login" centered hide-footer hide-header>
    <div
      class="w-100 d-flex justify-content-center align-items-center flex-column"
    >
      <img src="@/assets/media/success.png" width="50"/>
      <div
        style="font-weight: bold; text-align: center"
        class="mt-3"
        v-if="auth.is_login"
      >
        {{ auth.user.first_name + " " + auth.user.last_name }} عزیز با موفقیت
        وارد شد. با زدن کلید ادامه مبلغ فاکتور خود را پرداخت نمایید‌
      </div>
      <button class="btn btn-success mt-3" @click="$emit('order')">ادامه</button>
    </div>
  </b-modal>
</template>

<script>
export default {
  name: "successLoginModal",
  props: {
    auth: Object,
  },
  emits: ['order'],
}
</script>

<style scoped>

</style>
