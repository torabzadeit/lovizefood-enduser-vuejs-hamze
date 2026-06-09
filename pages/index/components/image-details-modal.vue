<template>
  <b-modal
    size="lg"
    id="image-details-modal" centered hide-footer hide-header>
    <div class="d-flex justify-content-center">
      <img class="image-details" :src="src" alt="">
    </div>
  </b-modal>
</template>
<script>
export default {
  name: 'image-details-modal',
  props: {
    src: String
  }
}
</script>
<style scoped>
.image-details {
  aspect-ratio: 1/1;
  max-width: 500px;
  max-height: 500px;
}

::v-deep .modal-content {
  background-color: transparent !important;
  border: none !important;
}
</style>
