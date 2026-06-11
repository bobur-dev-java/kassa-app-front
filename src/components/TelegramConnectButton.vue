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
      <svg class="tg-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <path d="M22 2 11 13"></path>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
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
  min-width: 0;
}

.tg-btn-icon {
  color: #24A1DE;
}

.telegram-link {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #24A1DE, #1c88bd);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  padding: 0 16px;
  text-decoration: none;
  box-shadow: 0 4px 10px rgba(36, 161, 222, 0.2);
  transition: var(--transition);
}

.telegram-link:hover {
  background: linear-gradient(135deg, #2cb3f2, #24A1DE);
  box-shadow: 0 6px 14px rgba(36, 161, 222, 0.3);
  transform: translateY(-1px);
}

.telegram-link:active {
  transform: translateY(0) scale(0.98);
}

@media (max-width: 760px) {
  .telegram-connect {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .telegram-connect .ghost-button,
  .telegram-link {
    width: 100%;
  }
}
</style>
