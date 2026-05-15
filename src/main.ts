import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const APP_BACKGROUND_COLOR = '#f4f7f6'
const APP_HEADER_COLOR = '#e8f2ef'

function configureTelegramWebApp() {
  const webApp = window.Telegram?.WebApp

  webApp?.ready?.()
  webApp?.expand?.()
  webApp?.setBackgroundColor?.(APP_BACKGROUND_COLOR)
  webApp?.setHeaderColor?.(APP_HEADER_COLOR)
  webApp?.setBottomBarColor?.(APP_BACKGROUND_COLOR)
}

configureTelegramWebApp()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
