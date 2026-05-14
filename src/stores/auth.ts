import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  AUTH_CHANGED_EVENT,
  authApi,
  decodeJwtPayload,
  normalizeRole,
  tokenStorage,
} from '@/services/api'
import type { LoginRequest, LoginYattRes, YaTTUserRole } from '@/types/api'

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
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  window.addEventListener(AUTH_CHANGED_EVENT, syncFromStorage)

  async function login(payload: LoginRequest) {
    const response = await authApi.login(payload)

    tokenStorage.setAuth(response)
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  async function selectYatt(selectedYattId: number) {
    const response = await authApi.selectYatt(selectedYattId)

    tokenStorage.setAuth(response)
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      logout()
      return null
    }

    const response = await authApi.getAccessToken({ refreshToken: refreshToken.value })

    tokenStorage.setAuth(response)
    applyAuth(response.accessToken, response.refreshToken)

    return response
  }

  function applyAuth(newAccessToken: string, newRefreshToken: string) {
    const newClaims = decodeJwtPayload(newAccessToken)

    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken
    role.value = normalizeRole(newClaims?.role)
    userId.value = newClaims?.userId ?? null
    yattId.value = newClaims?.yattId ?? null
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
    accessToken.value = null
    refreshToken.value = null
    role.value = null
    userId.value = null
    yattId.value = null
    yattRes.value = []
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
    selectYatt,
    refreshAccessToken,
    logout,
  }
})
