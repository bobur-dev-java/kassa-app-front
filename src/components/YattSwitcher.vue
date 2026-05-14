<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHomeRouteName } from '@/router'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { LoginYattRes } from '@/types/api'

const emit = defineEmits<{
  switched: []
}>()

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isSwitching = ref(false)
const errorMessage = ref('')

const yattOptions = computed(() => auth.yattRes)
const selectedYattId = computed(() => auth.yattId ?? null)
const canSwitch = computed(() => yattOptions.value.length > 1)

function getYattId(yatt: LoginYattRes) {
  return yatt.yattId ?? yatt.id ?? null
}

function getYattKey(yatt: LoginYattRes) {
  return getYattId(yatt) ?? `${yatt.name}-${yatt.role}`
}

async function switchYatt(event: Event) {
  const nextYattId = Number((event.target as HTMLSelectElement).value)

  if (!nextYattId || nextYattId === auth.yattId) {
    return
  }

  isSwitching.value = true
  errorMessage.value = ''

  try {
    await auth.selectYatt(nextYattId)

    const nextRouteName = getHomeRouteName(auth.role)

    if (route.name !== nextRouteName) {
      await router.push({ name: nextRouteName })
      return
    }

    emit('switched')
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'YATT almashtirib bolmadi'
  } finally {
    isSwitching.value = false
  }
}
</script>

<template>
  <div v-if="canSwitch" class="yatt-switcher">
    <select :value="selectedYattId" :disabled="isSwitching" @change="switchYatt">
      <option v-for="yatt in yattOptions" :key="getYattKey(yatt)" :value="getYattId(yatt)">
        {{ yatt.name }} - {{ yatt.role }}
      </option>
    </select>
    <span v-if="errorMessage" class="yatt-switcher-error">{{ errorMessage }}</span>
  </div>
</template>
