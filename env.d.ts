/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
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
  Telegram?: {
    WebApp?: {
      initData?: string
      openTelegramLink?: (link: string) => void
      ready?: () => void
      expand?: () => void
    }
  }
}
