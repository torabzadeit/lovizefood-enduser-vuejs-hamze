import country from 'country-list-js';

export default {
    install(Vue) {
        Vue.prototype.$country = country;
    }
}