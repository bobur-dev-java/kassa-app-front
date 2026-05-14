<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, authApi } from '@/services/api'

const emit = defineEmits<{
  success: [message: string]
  error: [message: string]
}>()

const isConnecting = ref(false)
const botLink = ref('')

async function connectTelegram() {
  isConnecting.value = true

  try {
    const response = await authApi.createTelegramConnectToken()
    botLink.value = normalizeTelegramLink(response.botLink)

    if (botLink.value) {
      emit('success', 'Telegram ulash havolasi tayyor')
      return
    }

    emit('error', 'Telegram bot havolasi topilmadi')
  } catch (error) {
    emit('error', error instanceof ApiError ? error.message : 'Telegram ulashda xatolik yuz berdi')
  } finally {
    isConnecting.value = false
  }
}

function openTelegramLink(link: string) {
  const safeLink = normalizeTelegramLink(link)

  if (!safeLink) {
    emit('error', 'Telegram bot havolasi noto‘g‘ri')
    return
  }

  if (safeLink.startsWith('https://t.me/') && window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(safeLink)
    return
  }

  if (safeLink.startsWith('tg://') && window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(safeLink)
    return
  }

  const openedWindow = window.open(safeLink, '_blank', 'noopener,noreferrer')

  if (!openedWindow) {
    window.location.href = safeLink
  }
}

function normalizeTelegramLink(link: string) {
  try {
    const url = new URL(link)

    if (url.protocol === 'https:' && url.hostname === 't.me') {
      return url.toString()
    }

    if (url.protocol === 'tg:') {
      return url.toString()
    }
  } catch {
    return ''
  }

  return ''
}
</script>

<template>
  <div class="telegram-connect">
    <button class="ghost-button" type="button" :disabled="isConnecting" @click="connectTelegram">
      {{ isConnecting ? 'Ulanmoqda...' : 'Telegram ulash' }}
    </button>

    <a
      v-if="botLink"
      class="telegram-link"
      :href="botLink"
      :title="botLink"
      target="_blank"
      rel="noopener noreferrer"
      @click.prevent="openTelegramLink(botLink)"
    >
      Botga o‘tish
    </a>
  </div>
</template>

<style scoped>
.telegram-connect {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.telegram-link {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: var(--tg-theme-button-color, #127c64);
  color: var(--tg-theme-button-text-color, #ffffff);
  font-size: 14px;
  font-weight: 800;
  padding: 0 14px;
  text-decoration: none;
}
</style>
