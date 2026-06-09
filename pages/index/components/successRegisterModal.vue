<template>
  <b-modal id="success-register" centered hide-footer hide-header>
    <div
      class="w-100 d-flex justify-content-center align-items-center flex-column"
    >
      <img src="@/assets/media/success.png" width="50"/>
      <div style="font-weight: bold; text-align: center" class="mt-3">
        ثبت نام شما با موفقیت انجام شد، با زدن کلید ادامه مبلغ فاکتور خود را
        پرداخت نمایید‌
      </div>
      <button class="btn btn-success mt-3" @click="$emit('order')">ادامه</button>
    </div>
  </b-modal>
</template>

<script>
export default {
  name: "successRegisterModal",
  emits:['order'],
}
</script>

<style scoped>

</style>
