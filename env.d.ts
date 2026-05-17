/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_API_PROXY_TARGET?: string
  readonly VITE_API_PROXY_INSECURE_TLS?: string
  readonly VITE_DEV_HOST?: string
  readonly VITE_DEV_ALLOWED_HOSTS?: string
  readonly VITE_ENABLE_DEVTOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __APP_CONFIG__?: {
    VITE_API_BASE_URL?: string
    VITE_APP_TITLE?: string
  }
  Telegram?: {
    WebApp?: {
      initData?: string
      openTelegramLink?: (link: string) => void
      ready?: () => void
      expand?: () => void
      setBackgroundColor?: (color: string) => void
      setHeaderColor?: (color: string) => void
      setBottomBarColor?: (color: string) => void
    }
  }
}
