<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeRouteName } from '@/router'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { LoginYattRes } from '@/types/api'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const yattList = ref<LoginYattRes[]>([])
const selectedYattId = ref<number | null>(null)
const isSubmitting = ref(false)
const isTelegramLogin = ref(false)
const isSelectingYatt = ref(false)
const errorMessage = ref('')
let isUnmounted = false
let hasStartedTelegramAutoLogin = false

const isYattStep = computed(() => yattList.value.length > 1)
const canSubmit = computed(() => username.value.trim() && password.value.trim())
const canSelectYatt = computed(() => Boolean(selectedYattId.value))

function getLoginYattId(yatt: LoginYattRes) {
  return yatt.yattId ?? yatt.id ?? null
}

function getLoginYattKey(yatt: LoginYattRes) {
  return getLoginYattId(yatt) ?? `${yatt.name}-${yatt.role}`
}

function setYatts(yatts: LoginYattRes[] = []) {
  yattList.value = yatts
  selectedYattId.value = yatts[0] ? getLoginYattId(yatts[0]) : null
}

onMounted(() => {
  void startTelegramAutoLogin()
})

onBeforeUnmount(() => {
  isUnmounted = true
})

async function startTelegramAutoLogin() {
  if (hasStartedTelegramAutoLogin) {
    return
  }

  for (let attempt = 0; attempt < 20 && !isUnmounted; attempt += 1) {
    const webApp = window.Telegram?.WebApp
    const initData = getTelegramInitData()

    webApp?.ready?.()
    webApp?.expand?.()

    if (initData) {
      hasStartedTelegramAutoLogin = true
      await submitTelegramLogin(initData)
      return
    }

    await wait(100)
  }
}

function getTelegramInitData() {
  const webAppInitData = window.Telegram?.WebApp?.initData

  if (webAppInitData) {
    return webAppInitData
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  return hashParams.get('tgWebAppData') ?? searchParams.get('tgWebAppData') ?? ''
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function finishLogin(responseYatts: LoginYattRes[] = []) {
  setYatts(responseYatts)

  if (responseYatts.length > 1) {
    return
  }

  const onlyYattId = responseYatts[0] ? getLoginYattId(responseYatts[0]) : null

  if (!auth.role && onlyYattId) {
    await auth.selectYatt(onlyYattId)
  }

  await router.push({ name: getHomeRouteName(auth.role) })
}

async function submitLogin() {
  if (!canSubmit.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await auth.login({
      username: username.value.trim(),
      password: password.value,
    })

    await finishLogin(response.yattRes)
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Login yoki parol notogri')
  } finally {
    isSubmitting.value = false
  }
}

async function submitTelegramLogin(initData: string) {
  isTelegramLogin.value = true
  errorMessage.value = ''
  auth.logout()

  try {
    const response = await auth.telegramLogin({ initData })

    await finishLogin(response.yattRes)
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Telegram orqali kirib bolmadi')
  } finally {
    isTelegramLogin.value = false
  }
}

async function submitYatt() {
  if (!selectedYattId.value) {
    return
  }

  isSelectingYatt.value = true
  errorMessage.value = ''

  try {
    await auth.selectYatt(selectedYattId.value)
    await router.push({ name: getHomeRouteName(auth.role) })
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'YATT tanlashda xatolik yuz berdi')
  } finally {
    isSelectingYatt.value = false
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallback
}
</script>

<template>
  <main class="auth-screen">
    <section class="auth-panel">
      <div class="brand">
        <span class="brand-mark">K</span>
        <div>
          <p>Kassa App</p>
          <h1>Tizimga kirish</h1>
        </div>
      </div>

      <div v-if="isTelegramLogin" class="telegram-loading-overlay">
        <div class="spinner"></div>
        <p class="loading-text">Telegram orqali kirilmoqda...</p>
        <span class="loading-sub">Iltimos, kutib turing</span>
      </div>

      <form v-else-if="!isYattStep" class="form" @submit.prevent="submitLogin">
        <div class="field">
          <span>Username</span>
          <div class="input-wrapper">
            <input
              v-model="username"
              autocomplete="username"
              inputmode="text"
              placeholder="admin"
              :disabled="isSubmitting"
            />
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        <div class="field">
          <span>Parol</span>
          <div class="input-wrapper">
            <input
              v-model="password"
              autocomplete="current-password"
              placeholder="••••••••"
              type="password"
              :disabled="isSubmitting"
            />
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        <p v-if="errorMessage" class="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ errorMessage }}
        </p>

        <button
          class="primary-button"
          type="submit"
          :disabled="!canSubmit || isSubmitting"
        >
          <template v-if="isSubmitting">
            <svg class="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff"></path>
            </svg>
            Kirilmoqda...
          </template>
          <template v-else>
            Kirish
          </template>
        </button>
      </form>

      <form v-else class="form" @submit.prevent="submitYatt">
        <div class="field">
          <span>YATT tanlash</span>
          <div class="input-wrapper">
            <select v-model.number="selectedYattId" :disabled="isSelectingYatt">
              <option
                v-for="yatt in yattList"
                :key="getLoginYattKey(yatt)"
                :value="getLoginYattId(yatt)"
              >
                {{ yatt.name }} - {{ yatt.role }}
              </option>
            </select>
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        </div>

        <p v-if="errorMessage" class="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ errorMessage }}
        </p>

        <button class="primary-button" type="submit" :disabled="!canSelectYatt || isSelectingYatt">
          <template v-if="isSelectingYatt">
            <svg class="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff"></path>
            </svg>
            Tanlanmoqda...
          </template>
          <template v-else>
            Davom etish
          </template>
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper input,
.input-wrapper select {
  padding-left: 48px !important;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--hint);
  pointer-events: none;
  transition: var(--transition);
}

.input-wrapper input:focus + .input-icon,
.input-wrapper select:focus + .input-icon {
  color: var(--primary);
}

.telegram-loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 10px;
  text-align: center;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.loading-sub {
  font-size: 13px;
  color: var(--hint);
  font-weight: 500;
}
</style>
