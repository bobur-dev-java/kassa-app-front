<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeRouteName } from '@/router'
import { ApiError, authApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { YattResponse } from '@/types/api'

const router = useRouter()
const auth = useAuthStore()

const yattList = ref<YattResponse[]>([])
const yattId = ref<number | null>(null)
const username = ref('')
const password = ref('')
const isLoadingYatt = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => yattId.value && username.value.trim() && password.value.trim())

onMounted(async () => {
  isLoadingYatt.value = true
  errorMessage.value = ''

  try {
    yattList.value = await authApi.getAllYatt()
    yattId.value = yattList.value[0]?.id ?? null
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'YATT royxatini olib bolmadi')
  } finally {
    isLoadingYatt.value = false
  }
})

async function submitLogin() {
  if (!canSubmit.value || !yattId.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await auth.login({
      yattId: yattId.value,
      username: username.value.trim(),
      password: password.value,
    })
    await router.push({ name: getHomeRouteName(auth.role) })
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Login yoki parol notogri')
  } finally {
    isSubmitting.value = false
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

      <form class="form" @submit.prevent="submitLogin">
        <label class="field">
          <span>YATT</span>
          <select v-model.number="yattId" :disabled="isLoadingYatt || isSubmitting">
            <option v-if="isLoadingYatt" :value="null">Yuklanmoqda...</option>
            <option v-for="yatt in yattList" :key="yatt.id" :value="yatt.id">
              {{ yatt.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Username</span>
          <input
            v-model="username"
            autocomplete="username"
            inputmode="text"
            placeholder="admin"
            :disabled="isSubmitting"
          />
        </label>

        <label class="field">
          <span>Parol</span>
          <input
            v-model="password"
            autocomplete="current-password"
            placeholder="••••••••"
            type="password"
            :disabled="isSubmitting"
          />
        </label>

        <p v-if="errorMessage" class="alert">{{ errorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="!canSubmit || isSubmitting">
          {{ isSubmitting ? 'Kirilmoqda...' : 'Kirish' }}
        </button>
      </form>
    </section>
  </main>
</template>
