import Vue from 'vue'
import validatorMessageFa from 'vee-validate/dist/locale/fa';
import VeeValidate, { Validator } from 'vee-validate';
import { isValidMobileIran } from '~/utils/mobile';

Validator.extend('mobile_iran', {
  getMessage: (field) => `${field} معتبر نیست. مثال: 09123456789`,
  validate: (value) => isValidMobileIran(value),
});

export default () => {
  Vue.use(VeeValidate);
  Validator.localize('fa', validatorMessageFa);
}
