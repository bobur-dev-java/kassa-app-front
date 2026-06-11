<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TelegramConnectButton from '@/components/TelegramConnectButton.vue'
import YattSwitcher from '@/components/YattSwitcher.vue'
import { adminApi, ApiError, authApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { SystemInfoResponse, YaTTUserRole, YattResponse } from '@/types/api'

const roles: YaTTUserRole[] = ['YATT_ADMIN', 'SMALL_SELLER', 'BIG_SELLER', 'ADMIN']

const router = useRouter()
const auth = useAuthStore()

const systemInfo = ref<SystemInfoResponse | null>(null)
const yattList = ref<YattResponse[]>([])
const selectedYattId = ref<number | null>(null)
const isLoading = ref(false)
const actionMessage = ref('')
const actionError = ref('')

const yattForm = reactive({
  name: '',
})

const userForm = reactive({
  fullName: '',
  username: '',
  password: '',
  role: 'SMALL_SELLER' as YaTTUserRole,
})

const canCreateYatt = computed(() => yattForm.name.trim().length > 1)
const canCreateUser = computed(
  () =>
    selectedYattId.value && userForm.username.trim() && userForm.password.trim() && userForm.role,
)

onMounted(loadDashboard)

async function loadDashboard() {
  isLoading.value = true
  actionError.value = ''

  try {
    const [stats, yatts] = await Promise.all([adminApi.getSystemInfo(), authApi.getAllYatt()])
    systemInfo.value = stats
    yattList.value = yatts
    selectedYattId.value = selectedYattId.value ?? yatts[0]?.id ?? null
  } catch (error) {
    actionError.value = getErrorMessage(error, 'Malumotlarni olib bolmadi')
  } finally {
    isLoading.value = false
  }
}

async function createYatt() {
  if (!canCreateYatt.value) {
    return
  }

  await runAction(async () => {
    const id = await adminApi.createYatt({ name: yattForm.name.trim() })
    actionMessage.value = `YATT yaratildi: #${id}`
    yattForm.name = ''
    await loadDashboard()
  })
}

async function createUser() {
  if (!canCreateUser.value || !selectedYattId.value) {
    return
  }

  await runAction(async () => {
    const id = await adminApi.addUser(selectedYattId.value as number, {
      fullName: userForm.fullName.trim(),
      username: userForm.username.trim(),
      password: userForm.password,
      role: userForm.role,
    })

    actionMessage.value = `Foydalanuvchi qoshildi: #${id}`
    userForm.fullName = ''
    userForm.username = ''
    userForm.password = ''
    userForm.role = 'SMALL_SELLER'
    await loadDashboard()
  })
}

async function runAction(action: () => Promise<void>) {
  isLoading.value = true
  actionError.value = ''
  actionMessage.value = ''

  try {
    await action()
  } catch (error) {
    actionError.value = getErrorMessage(error, 'Amal bajarilmadi')
  } finally {
    isLoading.value = false
  }
}

async function logout() {
  auth.logout()
  await router.push({ name: 'login' })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallback
}
</script>

<template>
  <main class="admin-screen">
    <header class="topbar">
      <div>
        <p>Admin panel</p>
        <h1>Kassa boshqaruv</h1>
        <span class="session-meta">
          {{ auth.role ?? 'ROLE' }} · User #{{ auth.userId ?? '-' }} · YATT #{{
            auth.yattId ?? '-'
          }}
        </span>
      </div>
      <div class="topbar-actions">
        <YattSwitcher @switched="loadDashboard" />
        <TelegramConnectButton
          @success="
            (message) => {
              actionMessage = message
              actionError = ''
            }
          "
          @error="
            (message) => {
              actionError = message
              actionMessage = ''
            }
          "
        />
        <button class="ghost-button" type="button" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Chiqish
        </button>
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>Foydalanuvchilar</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" style="color: var(--primary); opacity: 0.85;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <strong>{{ systemInfo?.userCount ?? '...' }}</strong>
      </article>
      <article class="stat-card">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>YATTlar</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" style="color: var(--primary); opacity: 0.85;">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <strong>{{ systemInfo?.yattCount ?? '...' }}</strong>
      </article>
    </section>

    <p v-if="actionMessage" class="success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      {{ actionMessage }}
    </p>
    <p v-if="actionError" class="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ actionError }}
    </p>

    <section class="panel">
      <div class="section-title">
        <h2>YATT yaratish</h2>
        <span>Yangi biznes</span>
      </div>

      <form class="form compact" @submit.prevent="createYatt">
        <label class="field">
          <span>Nomi</span>
          <input
            v-model="yattForm.name"
            placeholder="Masalan: Bobur Market"
            :disabled="isLoading"
          />
        </label>
        <button class="primary-button" type="submit" :disabled="!canCreateYatt || isLoading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Yaratish
        </button>
      </form>
    </section>

    <section class="panel">
      <div class="section-title">
        <h2>User qo‘shish</h2>
        <span>Role bo‘yicha</span>
      </div>

      <form class="form compact" @submit.prevent="createUser">
        <label class="field">
          <span>YATT</span>
          <select v-model.number="selectedYattId" :disabled="isLoading">
            <option v-for="yatt in yattList" :key="yatt.id" :value="yatt.id">
              {{ yatt.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>To‘liq ism</span>
          <input v-model="userForm.fullName" placeholder="Ali Valiyev" :disabled="isLoading" />
        </label>

        <label class="field">
          <span>Username</span>
          <input v-model="userForm.username" placeholder="seller01" :disabled="isLoading" />
        </label>

        <label class="field">
          <span>Parol</span>
          <input
            v-model="userForm.password"
            placeholder="Kamida 6 belgi"
            type="password"
            :disabled="isLoading"
          />
        </label>

        <label class="field">
          <span>Role</span>
          <select v-model="userForm.role" :disabled="isLoading">
            <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
          </select>
        </label>

        <button class="primary-button" type="submit" :disabled="!canCreateUser || isLoading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          User qo‘shish
        </button>
      </form>
    </section>
  </main>
</template>
