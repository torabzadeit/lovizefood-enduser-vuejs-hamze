/* sample */
// this.$vCurrency(55000000, {
//     symbol: '$',
//     thousandsSeparator: '.',
//     symbolPosition: 'before',
//     symbolSpacing: true
// })
const currency = {
  install(Vue) {

    function separator(number, status, thousandsSeparator) {
      if (status) {
        if (!number)
          return number
        let parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        return parts.join(".");
      } else return number.replace('/' + thousandsSeparator + '/g', '');
    }

    function currency(val, config = {}) {
      let value = val;
      if (val == null) return null;

      /*let defaultConfig = {
          symbol: config.symbol ? config.symbol : 'تومان',
          thousandsSeparator: config.thousandsSeparator ? config.thousandsSeparator : '.',
          symbolPosition: config.symbolPosition ? config.symbolPosition : 'after', // after
          symbolSpacing: config.symbolSpacing ? ' ' : ' '
      };*/

      let defaultConfig = {
        symbol: (config.symbol || (config.symbol==false)) ? config.symbol : '$',
        thousandsSeparator: ',',
        symbolPosition: config.symbolPosition ? config.symbolPosition : 'before', // after
        symbolSpacing: config.symbolSpacing ? ' ' : ' '
      };

      if (typeof config == 'string')
        defaultConfig.symbol = config;

      //fractionSeparator
      value = separator(value, true, defaultConfig.thousandsSeparator);
      //symbolPosition
      if (defaultConfig.symbol)
        value = (defaultConfig.symbolPosition == 'before' ? defaultConfig.symbol + defaultConfig.symbolSpacing : '') + value + (defaultConfig.symbolPosition == 'after' ? defaultConfig.symbolSpacing + defaultConfig.symbol : '');

      return value;
    };

    Vue.directive('currency', {
      inserted: function (el, binding = {}, vnode) {
        let value = binding.value.value;
        let config = binding.value.config;
        el.innerText = currency(value, config)
      }
    });

    Vue.prototype.$vCurrency = currency;
  }
};
export default currency;
