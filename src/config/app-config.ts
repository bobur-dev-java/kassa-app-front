function getRuntimeConfig() {
  return window.__APP_CONFIG__ ?? {}
}

export const APP_CONFIG = {
  apiBaseUrl: (getRuntimeConfig().VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(
    /\/$/,
    '',
  ),
  appTitle: getRuntimeConfig().VITE_APP_TITLE ?? import.meta.env.VITE_APP_TITLE ?? 'Kassa App',
}
