function getRuntimeConfig() {
  return window.__APP_CONFIG__ ?? {}
}

function trimTrailingSlash(value?: string) {
  return (value ?? '').replace(/\/$/, '')
}

function getApiBaseUrl() {
  const runtimeValue = getRuntimeConfig().VITE_API_BASE_URL

  if (runtimeValue !== undefined) {
    return trimTrailingSlash(runtimeValue)
  }

  // In production we prefer same-origin `/api` over stale build-time env values.
  if (!import.meta.env.DEV) {
    return ''
  }

  return trimTrailingSlash(import.meta.env.VITE_API_BASE_URL)
}

export const APP_CONFIG = {
  apiBaseUrl: getApiBaseUrl(),
  appTitle: getRuntimeConfig().VITE_APP_TITLE ?? import.meta.env.VITE_APP_TITLE ?? 'Kassa App',
}
