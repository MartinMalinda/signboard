// Global legacy styles stay the single source of truth during the parallel
// period (vue-styleguide.md §5).
import '../../static/styles.css'
import '@vendor/fdatepicker-3.0.24.min.css'
import 'floating-vue/dist/style.css'

import FloatingVue from 'floating-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { loadVendorGlobals } from './lib/vendor'

document.body.dataset.vueRenderer = ''

if (!window.board || !window.chooser || !window.electronAPI) {
  console.error('Signboard preload bridge is missing in the Vue renderer.')
}

loadVendorGlobals()
  .then(() => {
    const app = createApp(App)
    app.use(createPinia())
    app.use(FloatingVue)
    app.mount('#app')
  })
  .catch((error) => {
    console.error('Failed to load vendored libraries.', error)
  })
