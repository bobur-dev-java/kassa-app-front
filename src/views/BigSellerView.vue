<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TelegramConnectButton from '@/components/TelegramConnectButton.vue'
import YattSwitcher from '@/components/YattSwitcher.vue'
import { ApiError, bigSellerApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type {
  DebitResponse,
  MoneyTransactionResponse,
  MoneyType,
  ProductRequest,
  ProductTransactionResponse,
  UserProfileResponse,
  UserResponse,
} from '@/types/api'

type TabKey = 'profile' | 'products' | 'money' | 'debits'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profil' },
  { key: 'products', label: 'Product' },
  { key: 'money', label: 'Money' },
  { key: 'debits', label: 'Debit' },
]
const moneyTypes: MoneyType[] = ['CASH', 'TERMINAL', 'CARD']

const router = useRouter()
const auth = useAuthStore()
const activeTab = ref<TabKey>('profile')
const productMode = ref<'list' | 'create' | 'detail' | 'edit'>('list')
const moneyMode = ref<'list' | 'detail' | 'edit'>('list')
const isLoading = ref(false)
const actionMessage = ref('')
const actionError = ref('')

const profile = ref<UserProfileResponse | null>(null)
const users = ref<UserResponse[]>([])
const productTransactions = ref<ProductTransactionResponse[]>([])
const moneyTransactions = ref<MoneyTransactionResponse[]>([])
const debits = ref<DebitResponse[]>([])
const selectedProductTransaction = ref<ProductTransactionResponse | null>(null)
const selectedMoneyTransaction = ref<MoneyTransactionResponse | null>(null)

const profileForm = reactive({ fullName: '', username: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '' })
const productForm = reactive({
  toUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const productEditForm = reactive({
  toUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const moneyEditForm = reactive({
  fromUserId: null as number | null,
  transactionDate: today(),
  amount: 0,
  moneyType: 'CASH' as MoneyType,
})
const commonFilter = reactive({
  fromUserId: null as number | null,
  toUserId: null as number | null,
  from: '',
  to: '',
  isCompleted: null as boolean | null,
  moneyType: '' as MoneyType | '',
})

const currentUserId = computed(() => auth.userId ?? profile.value?.id ?? 0)

onMounted(loadDashboard)

async function loadDashboard() {
  await runAction(async () => {
    const [profileResponse, usersResponse] = await Promise.all([
      bigSellerApi.getProfile(),
      bigSellerApi.getUsers(),
    ])

    profile.value = profileResponse
    profileForm.fullName = profileResponse.fullName
    profileForm.username = profileResponse.username
    users.value = usersResponse
    productForm.toUserId = productForm.toUserId ?? usersResponse[0]?.id ?? null
    await Promise.all([loadProducts(), loadMoney(), loadDebits()])
  }, false)
}

async function handleYattSwitched() {
  productTransactions.value = []
  moneyTransactions.value = []
  debits.value = []
  selectedProductTransaction.value = null
  selectedMoneyTransaction.value = null
  productMode.value = 'list'
  moneyMode.value = 'list'
  productForm.toUserId = null
  commonFilter.fromUserId = null
  commonFilter.toUserId = null

  await runAction(async () => {
    const [profileResponse, usersResponse] = await Promise.all([
      bigSellerApi.getProfile(),
      bigSellerApi.getUsers(),
    ])

    profile.value = profileResponse
    profileForm.fullName = profileResponse.fullName
    profileForm.username = profileResponse.username
    users.value = usersResponse
    productForm.toUserId = usersResponse[0]?.id ?? null

    await refreshActiveList()
  }, false)
}

async function loadProducts() {
  const response = await bigSellerApi.getProductTransactions(
    {
      toUserId: commonFilter.toUserId,
      from: commonFilter.from,
      to: commonFilter.to,
      isCompleted: commonFilter.isCompleted,
    },
    0,
    10,
  )
  productTransactions.value = response.content
}

async function loadMoney() {
  const response = await bigSellerApi.getMoneyTransactions(
    {
      fromUserId: commonFilter.fromUserId,
      moneyType: commonFilter.moneyType,
      from: commonFilter.from,
      to: commonFilter.to,
      isCompleted: commonFilter.isCompleted,
    },
    0,
    10,
  )
  moneyTransactions.value = response.content
}

async function loadDebits() {
  const response = await bigSellerApi.getDebits(0, 10)
  debits.value = response.content
}

async function saveProfile() {
  await runAction(async () => {
    await bigSellerApi.updateProfile(profileForm)
    actionMessage.value = 'Profil yangilandi'
    profile.value = await bigSellerApi.getProfile()
  })
}

async function savePassword() {
  await runAction(async () => {
    await bigSellerApi.updatePassword(passwordForm)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    actionMessage.value = 'Parol yangilandi'
  })
}

function selectTab(tab: TabKey) {
  activeTab.value = tab
  if (tab === 'products') productMode.value = 'list'
  if (tab === 'money') moneyMode.value = 'list'
}

async function createProductTransaction() {
  if (!productForm.toUserId) return

  await runAction(async () => {
    const id = await bigSellerApi.createProductTransaction({
      fromUserId: currentUserId.value,
      toUserId: productForm.toUserId as number,
      transactionDate: productForm.transactionDate,
      products: productForm.products.filter((product) => product.name.trim()),
    })
    actionMessage.value = `Product transaction yaratildi: #${id}`
    productForm.products = [{ name: '', price: 0, quantity: 1 }]
    await loadProducts()
    productMode.value = 'list'
  })
}

function addProductRow() {
  productForm.products.push({ name: '', price: 0, quantity: 1 })
}

function removeProductRow(index: number) {
  if (productForm.products.length > 1) productForm.products.splice(index, 1)
}

function addProductEditRow() {
  productEditForm.products.push({ name: '', price: 0, quantity: 1 })
}

function removeProductEditRow(index: number) {
  if (productEditForm.products.length > 1) productEditForm.products.splice(index, 1)
}

async function openProductTransactionDetail(id: number) {
  await runAction(async () => {
    selectedProductTransaction.value = await bigSellerApi.getProductTransactionById(id)
    productMode.value = 'detail'
  }, false)
}

async function openMoneyTransactionDetail(id: number) {
  await runAction(async () => {
    selectedMoneyTransaction.value = await bigSellerApi.getMoneyTransactionById(id)
    moneyMode.value = 'detail'
  }, false)
}

function editProductTransaction() {
  if (!selectedProductTransaction.value) return
  productEditForm.toUserId = selectedProductTransaction.value.toUserId
  productEditForm.transactionDate = selectedProductTransaction.value.transactionDate
  productEditForm.products = selectedProductTransaction.value.products.map((product) => ({
    name: product.name,
    price: product.price,
    quantity: product.quantity,
  }))
  productMode.value = 'edit'
}

async function updateProductTransaction() {
  if (!selectedProductTransaction.value || !productEditForm.toUserId) return

  await runAction(async () => {
    await bigSellerApi.updateProductTransaction(selectedProductTransaction.value!.id, {
      fromUserId: currentUserId.value,
      toUserId: productEditForm.toUserId as number,
      transactionDate: productEditForm.transactionDate,
      products: productEditForm.products.filter((product) => product.name.trim()),
    })
    actionMessage.value = 'Product transaction yangilandi'
    selectedProductTransaction.value = await bigSellerApi.getProductTransactionById(
      selectedProductTransaction.value!.id,
    )
    await loadProducts()
    productMode.value = 'detail'
  })
}

async function deleteProductTransaction() {
  if (
    !selectedProductTransaction.value ||
    !window.confirm('Product transaction ochirishni tasdiqlaysizmi?')
  ) {
    return
  }

  await runAction(async () => {
    await bigSellerApi.deleteProductTransaction(selectedProductTransaction.value!.id)
    actionMessage.value = 'Product transaction ochirildi'
    selectedProductTransaction.value = null
    await loadProducts()
    productMode.value = 'list'
  })
}

async function deleteProduct(productId: number) {
  if (!selectedProductTransaction.value || !window.confirm('Product ochirishni tasdiqlaysizmi?')) {
    return
  }

  await runAction(async () => {
    await bigSellerApi.deleteProduct(selectedProductTransaction.value!.id, productId)
    actionMessage.value = 'Product ochirildi'
    selectedProductTransaction.value = await bigSellerApi.getProductTransactionById(
      selectedProductTransaction.value!.id,
    )
    await loadProducts()
  })
}

function editMoneyTransaction() {
  if (!selectedMoneyTransaction.value) return
  moneyEditForm.fromUserId = selectedMoneyTransaction.value.fromUserId
  moneyEditForm.transactionDate = selectedMoneyTransaction.value.transactionDate
  moneyEditForm.amount = selectedMoneyTransaction.value.amount
  moneyEditForm.moneyType = selectedMoneyTransaction.value.moneyType as MoneyType
  moneyMode.value = 'edit'
}

async function updateMoneyTransaction() {
  if (!selectedMoneyTransaction.value || !moneyEditForm.fromUserId) return

  await runAction(async () => {
    await bigSellerApi.updateMoneyTransaction(selectedMoneyTransaction.value!.id, {
      fromUserId: moneyEditForm.fromUserId as number,
      toUserId: currentUserId.value,
      transactionDate: moneyEditForm.transactionDate,
      amount: moneyEditForm.amount,
      moneyType: moneyEditForm.moneyType,
    })
    actionMessage.value = 'Money transaction yangilandi'
    selectedMoneyTransaction.value = await bigSellerApi.getMoneyTransactionById(
      selectedMoneyTransaction.value!.id,
    )
    await loadMoney()
    moneyMode.value = 'detail'
  })
}

async function refreshActiveList() {
  await runAction(async () => {
    if (activeTab.value === 'products') await loadProducts()
    if (activeTab.value === 'money') await loadMoney()
    if (activeTab.value === 'debits') await loadDebits()
  }, false)
}

async function downloadActiveExcel() {
  await runAction(async () => {
    if (activeTab.value === 'products') {
      await bigSellerApi.downloadProductTransactionsExcel({
        toUserId: commonFilter.toUserId,
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
    }
    if (activeTab.value === 'money') {
      await bigSellerApi.downloadMoneyTransactionsExcel({
        fromUserId: commonFilter.fromUserId,
        moneyType: commonFilter.moneyType,
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
    }
    if (activeTab.value === 'debits') {
      await bigSellerApi.downloadDebitsExcel()
    }
  }, false)
}

async function logout() {
  auth.logout()
  await router.push({ name: 'login' })
}

async function runAction(action: () => Promise<void>, clearMessage = true) {
  isLoading.value = true
  actionError.value = ''
  if (clearMessage) actionMessage.value = ''

  try {
    await action()
  } catch (error) {
    actionError.value = getErrorMessage(error, 'Amal bajarilmadi')
  } finally {
    isLoading.value = false
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function money(value: number) {
  return new Intl.NumberFormat('uz-UZ').format(value ?? 0)
}
</script>

<template>
  <main class="admin-screen yatt-screen">
    <header class="topbar">
      <div>
        <p>Big seller</p>
        <h1>{{ profile?.fullName ?? 'Savdo' }}</h1>
      </div>
      <div class="topbar-actions">
        <YattSwitcher @switched="handleYattSwitched" />
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

    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-button"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="selectTab(tab.key)"
      >
        <svg v-if="tab.key === 'profile'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <svg v-if="tab.key === 'products'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <svg v-if="tab.key === 'money'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <svg v-if="tab.key === 'debits'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        {{ tab.label }}
      </button>
    </nav>

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

    <section v-if="activeTab === 'profile'" class="panel">
      <div class="section-title">
        <h2>Profil ma‘lumotlari</h2>
        <span>{{ profile?.username }}</span>
      </div>
      <form class="form compact" @submit.prevent="saveProfile">
        <label class="field">
          <span>To‘liq ism</span>
          <input v-model="profileForm.fullName" :disabled="isLoading" />
        </label>
        <label class="field">
          <span>Username</span>
          <input v-model="profileForm.username" :disabled="isLoading" />
        </label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
      <form class="form compact" @submit.prevent="savePassword">
        <label class="field">
          <span>Eski parol</span>
          <input v-model="passwordForm.oldPassword" type="password" :disabled="isLoading" />
        </label>
        <label class="field">
          <span>Yangi parol</span>
          <input v-model="passwordForm.newPassword" type="password" :disabled="isLoading" />
        </label>
        <button class="ghost-button" type="submit" :disabled="isLoading">Parolni yangilash</button>
      </form>
    </section>

    <section v-if="activeTab === 'products' && productMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Mahsulot tranzaksiyasi (Product transaction)</h2>
        <span>{{ productForm.products.length }} ta mahsulot</span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="productMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="createProductTransaction">
        <label class="field">
          <span>Qabul qiluvchi (To)</span>
          <select v-model.number="productForm.toUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label class="field"><span>Sana</span><input v-model="productForm.transactionDate" type="date" /></label>
        
        <div v-for="(product, index) in productForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" placeholder="Masalan: Anor" /></label>
          <label class="field"><span>Narx (UZS)</span><input v-model.number="product.price" type="number" /></label>
          <label class="field"><span>Soni</span><input v-model.number="product.quantity" type="number" /></label>
          <button class="ghost-button" type="button" @click="removeProductRow(index)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <button class="ghost-button" type="button" @click="addProductRow" style="margin-top: 10px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Product qo‘shish
        </button>
        <button class="primary-button" type="submit" :disabled="isLoading">
          Transaction yaratish
        </button>
      </form>
    </section>

    <section
      v-if="activeTab === 'products' && productMode === 'detail' && selectedProductTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Tranzaksiya tafsilotlari #{{ selectedProductTransaction.id }}</h2>
        <span class="badge" :class="selectedProductTransaction.isCompleted ? 'badge-completed' : 'badge-open'">
          {{ selectedProductTransaction.isCompleted ? 'Completed' : 'Open' }}
        </span>
      </div>
      <div class="section-actions" style="margin-bottom: 20px;">
        <button class="ghost-button" type="button" @click="productMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
        <button class="ghost-button" type="button" @click="editProductTransaction">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Edit
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="deleteProductTransaction"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          O'chirish (Delete)
        </button>
      </div>
      <article class="list-card" style="box-shadow: none; border-color: var(--line);">
        <strong>{{ selectedProductTransaction.fromUserFullName }} → {{ selectedProductTransaction.toUserFullName }}</strong>
        <span>Sana: {{ selectedProductTransaction.transactionDate }}</span>
        <span>Jami summa: {{ money(selectedProductTransaction.totalPrice) }} UZS</span>
      </article>

      <div style="margin-top: 15px;">
        <h3 style="margin-bottom: 10px; font-size: 16px;">Mahsulotlar ro'yxati</h3>
        <article
          v-for="product in selectedProductTransaction.products"
          :key="product.id"
          class="list-card"
          style="background: #fafcfb; display: flex; flex-direction: row; align-items: center; justify-content: space-between;"
        >
          <div>
            <strong>{{ product.name }}</strong>
            <span style="margin-top: 4px;">Narx: {{ money(product.price) }} UZS · Soni: {{ product.quantity }} ta</span>
          </div>
          <button
            class="danger-button"
            type="button"
            style="min-height: 36px; padding: 0 12px; font-size: 12px;"
            :disabled="isLoading"
            @click="deleteProduct(product.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </article>
      </div>
    </section>

    <section
      v-if="activeTab === 'products' && productMode === 'edit' && selectedProductTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Mahsulot tranzaksiyasini tahrirlash</h2>
        <span>{{ productEditForm.products.length }} ta mahsulot</span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="productMode = 'detail'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="updateProductTransaction">
        <label class="field">
          <span>Qabul qiluvchi (To)</span>
          <select v-model.number="productEditForm.toUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label class="field"><span>Sana</span><input v-model="productEditForm.transactionDate" type="date" /></label>
        
        <div v-for="(product, index) in productEditForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" /></label>
          <label class="field"><span>Narx</span><input v-model.number="product.price" type="number" /></label>
          <label class="field"><span>Soni</span><input v-model.number="product.quantity" type="number" /></label>
          <button class="ghost-button" type="button" @click="removeProductEditRow(index)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <button class="ghost-button" type="button" @click="addProductEditRow" style="margin-top: 10px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Mahsulot qo‘shish
        </button>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section
      v-if="activeTab === 'money' && moneyMode === 'detail' && selectedMoneyTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Pul o'tkazmasi tafsilotlari #{{ selectedMoneyTransaction.id }}</h2>
        <span class="badge" :class="selectedMoneyTransaction.isCompleted ? 'badge-completed' : 'badge-open'">
          {{ selectedMoneyTransaction.isCompleted ? 'Completed' : 'Open' }}
        </span>
      </div>
      <div class="section-actions" style="margin-bottom: 20px;">
        <button class="ghost-button" type="button" @click="moneyMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
        <button class="ghost-button" type="button" @click="editMoneyTransaction">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Tahrirlash
        </button>
      </div>
      <article class="list-card" style="box-shadow: none; border-color: var(--line);">
        <strong>{{ selectedMoneyTransaction.fromUserFullName }} → {{ selectedMoneyTransaction.toUserFullName }}</strong>
        <span>Sana: {{ selectedMoneyTransaction.transactionDate }}</span>
        <span>
          Turi: 
          <span class="badge" :class="'badge-' + selectedMoneyTransaction.moneyType.toLowerCase()">{{ selectedMoneyTransaction.moneyType }}</span>
        </span>
        <span>Summa: {{ money(selectedMoneyTransaction.amount) }} UZS</span>
      </article>
    </section>

    <section
      v-if="activeTab === 'money' && moneyMode === 'edit' && selectedMoneyTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Pul o'tkazmasini tahrirlash</h2>
        <span>
          <span class="badge" :class="'badge-' + moneyEditForm.moneyType.toLowerCase()">{{ moneyEditForm.moneyType }}</span>
        </span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="moneyMode = 'detail'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="updateMoneyTransaction">
        <label class="field">
          <span>Yuboruvchi (From)</span>
          <select v-model.number="moneyEditForm.fromUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label class="field"><span>Sana</span><input v-model="moneyEditForm.transactionDate" type="date" /></label>
        <label class="field"><span>Summa (UZS)</span><input v-model.number="moneyEditForm.amount" type="number" /></label>
        <label class="field">
          <span>Turi</span>
          <select v-model="moneyEditForm.moneyType">
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section
      v-if="
        (activeTab === 'products' && productMode === 'list') ||
        (activeTab === 'money' && moneyMode === 'list') ||
        activeTab === 'debits'
      "
      class="panel"
    >
      <div class="section-title">
        <h2>
          {{ activeTab === 'debits' ? 'Qarzlar ro‘yxati (Debits)' : (activeTab === 'products' ? 'Mahsulotlar tranzaksiyalari' : 'Pul tranzaksiyalari') }}
        </h2>
        <div class="section-actions">
          <button
            v-if="activeTab === 'products'"
            class="primary-small-button"
            type="button"
            @click="productMode = 'create'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Mahsulot qo‘shish
          </button>
          <button class="ghost-button" type="button" @click="downloadActiveExcel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="color: #107c41;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Excel
          </button>
        </div>
      </div>

      <div v-if="activeTab !== 'debits'" class="mini-grid">
        <label v-if="activeTab === 'products'" class="field">
          <span>Qabul qiluvchi user bo'yicha</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Yuboruvchi user bo'yicha</span>
          <select v-model.number="commonFilter.fromUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>To'lov turi bo'yicha</span>
          <select v-model="commonFilter.moneyType">
            <option value="">Hammasi</option>
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="field">
          <span>Holati (Status)</span>
          <select v-model="commonFilter.isCompleted">
            <option :value="null">Hammasi</option>
            <option :value="true">Completed</option>
            <option :value="false">Open</option>
          </select>
        </label>
        <label class="field"><span>Dan (From)</span><input v-model="commonFilter.from" type="date" /></label>
        <label class="field"><span>Gacha (To)</span><input v-model="commonFilter.to" type="date" /></label>
      </div>

      <button v-if="activeTab !== 'debits'" class="ghost-button" type="button" @click="refreshActiveList" style="width: 100%; margin-bottom: 20px; font-weight: 700; border-color: var(--primary); color: var(--primary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="vertical-align: middle; margin-right: 4px;">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtrlarni qo‘llash
      </button>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <button
          v-for="item in productTransactions"
          v-if="activeTab === 'products'"
          :key="item.id"
          class="list-card"
          type="button"
          @click="openProductTransactionDetail(item.id)"
        >
          <strong>{{ item.fromUserFullName }} → {{ item.toUserFullName }}</strong>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ item.transactionDate }} · 
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="color: var(--primary);">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            {{ money(item.totalPrice) }} UZS
          </span>
        </button>

        <button
          v-for="item in moneyTransactions"
          v-if="activeTab === 'money'"
          :key="item.id"
          class="list-card"
          type="button"
          @click="openMoneyTransactionDetail(item.id)"
        >
          <strong>{{ item.fromUserFullName }} → {{ item.toUserFullName }}</strong>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ item.transactionDate }} · 
            <span class="badge" :class="'badge-' + item.moneyType.toLowerCase()">{{ item.moneyType }}</span> · 
            {{ money(item.amount) }} UZS
          </span>
        </button>

        <article
          v-for="item in debits"
          v-if="activeTab === 'debits'"
          :key="item.fromUserId"
          class="list-card"
        >
          <strong>{{ item.fromUserFullName || `Foydalanuvchi (User) #${item.fromUserId}` }}</strong>
          <span style="color: var(--primary); font-weight: 700;">
            Faol qarz (Active): {{ money(item.activeAmount) }} UZS
          </span>
          <span style="color: var(--hint);">
            Faol bo'lmagan (Non-active): {{ money(item.nonActive) }} UZS
          </span>
        </article>
      </div>
    </section>
  </main>
</template>
