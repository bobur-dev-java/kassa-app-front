import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { APP_CONFIG } from './config/app-config'
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

document.title = APP_CONFIG.appTitle

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
