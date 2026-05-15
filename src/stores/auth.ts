import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  AUTH_CHANGED_EVENT,
  authApi,
  decodeJwtPayload,
  normalizeRole,
  tokenStorage,
} from '@/services/api'
import type { LoginRequest, LoginYattRes, TelegramLoginRequest, YaTTUserRole } from '@/types/api'

const TELEGRAM_INIT_FINGERPRINT_KEY = 'kassa_telegram_init_fingerprint'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(tokenStorage.getAccessToken())
  const refreshToken = ref(tokenStorage.getRefreshToken())
  const claims = decodeJwtPayload(accessToken.value)
  const role = ref<YaTTUserRole | null>(
    normalizeRole(claims?.role) ?? (tokenStorage.getRole() as YaTTUserRole | null),
  )
  const userId = ref(claims?.userId ?? tokenStorage.getUserId())
  const yattId = ref(claims?.yattId ?? tokenStorage.getYattId())
  const yattRes = ref<LoginYattRes[]>(tokenStorage.getLoginYatts())
  const telegramInitFingerprint = ref(sessionStorage.getItem(TELEGRAM_INIT_FINGERPRINT_KEY) ?? '')
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  window.addEventListener(AUTH_CHANGED_EVENT, syncFromStorage)

  async function login(payload: LoginRequest) {
    const response = await authApi.login(payload)

    clearTelegramInitFingerprint()
    tokenStorage.setAuth(response)
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  async function telegramLogin(payload: TelegramLoginRequest) {
    const response = await authApi.telegramLogin(payload)

    tokenStorage.setAuth(response)
    rememberTelegramInitData(payload.initData)
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  async function selectYatt(selectedYattId: number) {
    const response = await authApi.selectYatt(selectedYattId)

    tokenStorage.setAuth(response, { preserveLoginYatts: true })
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      logout()
      return null
    }

    const response = await authApi.getAccessToken({ refreshToken: refreshToken.value })

    tokenStorage.setAuth(response, { preserveLoginYatts: true })
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  function applyAuth(newAccessToken: string, newRefreshToken: string) {
    const newClaims = decodeJwtPayload(newAccessToken)

    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken
    role.value = normalizeRole(newClaims?.role) ?? (tokenStorage.getRole() as YaTTUserRole | null)
    userId.value = newClaims?.userId ?? tokenStorage.getUserId()
    yattId.value = newClaims?.yattId ?? tokenStorage.getYattId()
    yattRes.value = tokenStorage.getLoginYatts()
  }

  function syncFromStorage() {
    const storedAccessToken = tokenStorage.getAccessToken()
    const storedRefreshToken = tokenStorage.getRefreshToken()

    if (!storedAccessToken || !storedRefreshToken) {
      accessToken.value = null
      refreshToken.value = null
      role.value = null
      userId.value = null
      yattId.value = null
      yattRes.value = []
      return
    }

    applyAuth(storedAccessToken, storedRefreshToken)
  }

  function logout() {
    tokenStorage.clear()
    clearTelegramInitFingerprint()
    accessToken.value = null
    refreshToken.value = null
    role.value = null
    userId.value = null
    yattId.value = null
    yattRes.value = []
  }

  function rememberTelegramInitData(initData: string) {
    const fingerprint = getTelegramInitFingerprint(initData)

    telegramInitFingerprint.value = fingerprint

    if (fingerprint) {
      sessionStorage.setItem(TELEGRAM_INIT_FINGERPRINT_KEY, fingerprint)
    } else {
      sessionStorage.removeItem(TELEGRAM_INIT_FINGERPRINT_KEY)
    }
  }

  function clearTelegramInitFingerprint() {
    telegramInitFingerprint.value = ''
    sessionStorage.removeItem(TELEGRAM_INIT_FINGERPRINT_KEY)
  }

  function isTelegramInitDataApplied(initData: string) {
    const fingerprint = getTelegramInitFingerprint(initData)

    return Boolean(fingerprint && telegramInitFingerprint.value === fingerprint)
  }

  function getTelegramInitFingerprint(initData: string) {
    if (!initData) {
      return ''
    }

    const params = new URLSearchParams(initData)
    const userPayload = params.get('user')

    if (userPayload) {
      try {
        const telegramUser = JSON.parse(userPayload) as { id?: number }

        if (telegramUser.id) {
          return `user:${telegramUser.id}`
        }
      } catch {
        // Fall back to hash below when Telegram user payload is not parseable.
      }
    }

    return params.get('hash') ? `hash:${params.get('hash')}` : `raw:${initData}`
  }

  return {
    accessToken,
    refreshToken,
    role,
    userId,
    yattId,
    yattRes,
    isAuthenticated,
    login,
    telegramLogin,
    selectYatt,
    refreshAccessToken,
    isTelegramInitDataApplied,
    logout,
  }
})
