/* https://vue-select.org/guide */
import Vue from 'vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

vSelect.props.components.default = () => ({
  Deselect: {
    render: (createElement) => createElement('span', '✕'),
  },
  OpenIndicator: {
    render: (createElement) => createElement('span', '▾'),
  },
})

Vue.component('v-select', vSelect)
