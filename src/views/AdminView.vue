<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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
    selectedYattId.value &&
    userForm.username.trim() &&
    userForm.password.trim() &&
    userForm.role,
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
          {{ auth.role ?? 'ROLE' }} · User #{{ auth.userId ?? '-' }} · YATT #{{ auth.yattId ?? '-' }}
        </span>
      </div>
      <div class="topbar-actions">
        <YattSwitcher @switched="loadDashboard" />
        <button class="ghost-button" type="button" @click="logout">Chiqish</button>
      </div>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Foydalanuvchilar</span>
        <strong>{{ systemInfo?.userCount ?? '...' }}</strong>
      </article>
      <article class="stat-card">
        <span>YATTlar</span>
        <strong>{{ systemInfo?.yattCount ?? '...' }}</strong>
      </article>
    </section>

    <p v-if="actionMessage" class="success">{{ actionMessage }}</p>
    <p v-if="actionError" class="alert">{{ actionError }}</p>

    <section class="panel">
      <div class="section-title">
        <h2>YATT yaratish</h2>
        <span>Yangi biznes</span>
      </div>

      <form class="form compact" @submit.prevent="createYatt">
        <label class="field">
          <span>Nomi</span>
          <input v-model="yattForm.name" placeholder="Masalan: Bobur Market" :disabled="isLoading" />
        </label>
        <button class="primary-button" type="submit" :disabled="!canCreateYatt || isLoading">
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
          User qo‘shish
        </button>
      </form>
    </section>
  </main>
</template>
