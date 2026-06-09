import Vue from 'vue'
import Toasted from 'vue-toasted';

export default () => {
    Vue.use(Toasted,{
        theme: "toasted-primary",
        position: "bottom-center",
        duration : 4000
    })
    Vue.prototype.$toasted = Vue.toasted
}
