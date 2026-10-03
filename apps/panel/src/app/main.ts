import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/outfit'
import '@sp/ui/tokens.css'
import '@/styles/base.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
