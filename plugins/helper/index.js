import Vue from 'vue'

// helper plugins

import currency from './currency'
import dateTime from './dateTime'
import other from './other'
import country from './country'

Vue.use(currency);
Vue.use(country);
Vue.use(dateTime);
Vue.use(other);


