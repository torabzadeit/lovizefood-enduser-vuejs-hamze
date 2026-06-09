import Vue from "vue";

var mixin = {
  methods: {
    checkDisable(pageName) {
      return new Promise((resolve, reject) => {
        if (this.$store.state.disableSetting[pageName].isDisable) {
          this.$swal({
            icon: "warning",
            title: this.$store.state.disableSetting[pageName].useGlobalMessage
              ? this.$store.state.disableSetting.message.messageTitle
              : this.$store.state.disableSetting[pageName].messageTitle,
            text: this.$store.state.disableSetting[pageName].useGlobalMessage
              ? this.$store.state.disableSetting.message.messageText
              : this.$store.state.disableSetting[pageName].messageText,
            confirmButtonText: "ok"
          });
          return resolve(true)
        }
        return resolve(false)
      });
    }
  }
};

Vue.mixin(mixin);
