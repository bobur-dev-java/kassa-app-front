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
          <h1>Admin kirish</h1>
        </div>
      </div>

      <form v-if="!isYattStep" class="form" @submit.prevent="submitLogin">
        <label class="field">
          <span>Username</span>
          <input
            v-model="username"
            autocomplete="username"
            inputmode="text"
            placeholder="admin"
            :disabled="isSubmitting || isTelegramLogin"
          />
        </label>

        <label class="field">
          <span>Parol</span>
          <input
            v-model="password"
            autocomplete="current-password"
            placeholder="••••••••"
            type="password"
            :disabled="isSubmitting || isTelegramLogin"
          />
        </label>

        <p v-if="errorMessage" class="alert">{{ errorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="!canSubmit || isSubmitting || isTelegramLogin">
          {{ isSubmitting || isTelegramLogin ? 'Kirilmoqda...' : 'Kirish' }}
        </button>
      </form>

      <form v-else class="form" @submit.prevent="submitYatt">
        <label class="field">
          <span>YATT</span>
          <select v-model.number="selectedYattId" :disabled="isSelectingYatt">
            <option v-for="yatt in yattList" :key="getLoginYattKey(yatt)" :value="getLoginYattId(yatt)">
              {{ yatt.name }} - {{ yatt.role }}
            </option>
          </select>
        </label>

        <p v-if="errorMessage" class="alert">{{ errorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="!canSelectYatt || isSelectingYatt">
          {{ isSelectingYatt ? 'Tanlanmoqda...' : 'Davom etish' }}
        </button>
      </form>
    </section>
  </main>
</template>
