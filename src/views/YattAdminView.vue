<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TelegramConnectButton from '@/components/TelegramConnectButton.vue'
import YattSwitcher from '@/components/YattSwitcher.vue'
import { ApiError, yattAdminApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type {
  DebitResponse,
  KassaResponse,
  MoneyTransactionResponse,
  MoneyType,
  ProductRequest,
  ProductTransactionResponse,
  UserProfileResponse,
  UserResponse,
  YaTTUserRole,
  TransactionAuditLogResponse,
  TransactionStatus,
} from '@/types/api'

type TabKey = 'profile' | 'staff' | 'bigSellers' | 'kassa' | 'products' | 'money' | 'debits'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profil' },
  { key: 'staff', label: 'Staff' },
  { key: 'bigSellers', label: 'Big Sellers' },
  { key: 'kassa', label: 'Kassa' },
  { key: 'products', label: 'Product' },
  { key: 'money', label: 'Money' },
  { key: 'debits', label: 'Debit' },
]
const staffRoles: YaTTUserRole[] = ['SMALL_SELLER', 'BIG_SELLER']
const moneyTypes: MoneyType[] = ['CASH', 'TERMINAL', 'CARD']

const router = useRouter()
const auth = useAuthStore()
const activeTab = ref<TabKey>('profile')
const kassaMode = ref<'list' | 'create' | 'detail' | 'edit'>('list')
const staffMode = ref<'list' | 'create'>('list')
const productMode = ref<'list' | 'create' | 'detail' | 'edit'>('list')
const moneyMode = ref<'list' | 'create' | 'detail' | 'edit'>('list')
const isLoading = ref(false)
const actionMessage = ref('')
const actionError = ref('')

const profile = ref<UserProfileResponse | null>(null)
const users = ref<UserResponse[]>([])
const staffList = ref<UserResponse[]>([])
const bigSellersList = ref<UserResponse[]>([])
const staffSearch = ref('')
const bigSellersSearch = ref('')
const transactionAuditLogs = ref<TransactionAuditLogResponse[]>([])
const kassaList = ref<KassaResponse[]>([])
const productTransactions = ref<ProductTransactionResponse[]>([])
const moneyTransactions = ref<MoneyTransactionResponse[]>([])
const debits = ref<DebitResponse[]>([])
const selectedKassa = ref<KassaResponse | null>(null)
const selectedProductTransaction = ref<ProductTransactionResponse | null>(null)
const selectedMoneyTransaction = ref<MoneyTransactionResponse | null>(null)

const profileForm = reactive({ fullName: '', username: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '' })
const staffForm = reactive({
  fullName: '',
  username: '',
  password: '',
  role: 'SMALL_SELLER' as YaTTUserRole,
})
const kassaForm = reactive({
  ownerId: null as number | null,
  terminal: 0,
  card: 0,
  cash: 0,
  comment: '',
  kassaDate: today(),
})
const kassaEditForm = reactive({
  ownerId: null as number | null,
  terminal: 0,
  card: 0,
  cash: 0,
  comment: '',
  kassaDate: today(),
})
const productForm = reactive({
  fromUserId: null as number | null,
  toUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const productEditForm = reactive({
  fromUserId: null as number | null,
  toUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const moneyForm = reactive({
  fromUserId: null as number | null,
  toUserId: null as number | null,
  transactionDate: today(),
  amount: 0,
  moneyType: 'CASH' as MoneyType,
})
const moneyEditForm = reactive({
  fromUserId: null as number | null,
  toUserId: null as number | null,
  transactionDate: today(),
  amount: 0,
  moneyType: 'CASH' as MoneyType,
})
const commonFilter = reactive({
  ownerId: null as number | null,
  fromUserId: null as number | null,
  toUserId: null as number | null,
  from: '',
  to: '',
  isCompleted: null as boolean | null,
  status: null as TransactionStatus | null,
  moneyType: '' as MoneyType | '',
})

const kassaTotal = computed(() => kassaForm.terminal + kassaForm.card + kassaForm.cash)
const kassaEditTotal = computed(
  () => kassaEditForm.terminal + kassaEditForm.card + kassaEditForm.cash,
)

onMounted(loadDashboard)

async function loadDashboard() {
  await runAction(async () => {
    const [profileResponse, usersResponse] = await Promise.all([
      yattAdminApi.getProfile(),
      yattAdminApi.getUsers(),
    ])

    profile.value = profileResponse
    profileForm.fullName = profileResponse.fullName
    profileForm.username = profileResponse.username
    users.value = usersResponse
    kassaForm.ownerId = kassaForm.ownerId ?? usersResponse[0]?.id ?? null
    productForm.fromUserId = productForm.fromUserId ?? usersResponse[0]?.id ?? null
    productForm.toUserId =
      productForm.toUserId ?? usersResponse[1]?.id ?? usersResponse[0]?.id ?? null
    moneyForm.fromUserId = moneyForm.fromUserId ?? usersResponse[0]?.id ?? null
    moneyForm.toUserId = moneyForm.toUserId ?? usersResponse[1]?.id ?? usersResponse[0]?.id ?? null
    await Promise.all([loadKassa(), loadProducts(), loadMoney(), loadDebits(), loadStaff(), loadBigSellers()])
  }, false)
}

async function loadKassa() {
  const response = await yattAdminApi.getKassa(
    {
      ownerId: commonFilter.ownerId,
      from: commonFilter.from,
      to: commonFilter.to,
      isCompleted: commonFilter.isCompleted,
    },
    0,
    10,
  )
  kassaList.value = response.content
}

async function loadProducts() {
  const response = await yattAdminApi.getProductTransactions(
    {
      fromUserId: commonFilter.fromUserId,
      toUserId: commonFilter.toUserId,
      from: commonFilter.from,
      to: commonFilter.to,
      status: commonFilter.status,
    },
    0,
    10,
  )
  productTransactions.value = response.content
}

async function loadMoney() {
  const response = await yattAdminApi.getMoneyTransactions(
    {
      fromUserId: commonFilter.fromUserId,
      toUserId: commonFilter.toUserId,
      moneyType: commonFilter.moneyType,
      from: commonFilter.from,
      to: commonFilter.to,
      status: commonFilter.status,
    },
    0,
    10,
  )
  moneyTransactions.value = response.content
}

async function loadDebits() {
  const response = await yattAdminApi.getDebits({ fromUserId: commonFilter.fromUserId }, 0, 10)
  debits.value = response.content
}

async function loadStaff() {
  const response = await yattAdminApi.getStaff(0, 100, staffSearch.value)
  staffList.value = response.content
}

async function loadBigSellers() {
  const response = await yattAdminApi.getBigSellers(0, 100, bigSellersSearch.value)
  bigSellersList.value = response.content
}

async function saveProfile() {
  await runAction(async () => {
    await yattAdminApi.updateProfile(profileForm)
    actionMessage.value = 'Profil yangilandi'
    profile.value = await yattAdminApi.getProfile()
  })
}

async function savePassword() {
  await runAction(async () => {
    await yattAdminApi.updatePassword(passwordForm)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    actionMessage.value = 'Parol yangilandi'
  })
}

async function addStaff() {
  await runAction(async () => {
    const id = await yattAdminApi.addStaff(staffForm)
    actionMessage.value = `Staff qo'shildi: #${id}`
    staffForm.fullName = ''
    staffForm.username = ''
    staffForm.password = ''
    users.value = await yattAdminApi.getUsers()
    await Promise.all([loadStaff(), loadBigSellers()])
    staffMode.value = 'list'
  })
}

async function createKassa() {
  if (!kassaForm.ownerId) return

  await runAction(async () => {
    const id = await yattAdminApi.createKassa({
      ownerId: kassaForm.ownerId as number,
      terminal: kassaForm.terminal,
      card: kassaForm.card,
      cash: kassaForm.cash,
      comment: kassaForm.comment,
      kassaDate: kassaForm.kassaDate,
    })
    actionMessage.value = `Kassa yaratildi: #${id}`
    kassaForm.terminal = 0
    kassaForm.card = 0
    kassaForm.cash = 0
    kassaForm.comment = ''
    await loadKassa()
    kassaMode.value = 'list'
  })
}

function selectTab(tab: TabKey) {
  activeTab.value = tab

  if (tab === 'kassa') {
    kassaMode.value = 'list'
  }

  if (tab === 'staff') {
    staffMode.value = 'list'
    loadStaff()
  }

  if (tab === 'bigSellers') {
    staffMode.value = 'list'
    loadBigSellers()
  }

  if (tab === 'products') {
    productMode.value = 'list'
  }

  if (tab === 'money') {
    moneyMode.value = 'list'
  }
}

async function createProductTransaction() {
  if (!productForm.fromUserId || !productForm.toUserId) return

  await runAction(async () => {
    const id = await yattAdminApi.createProductTransaction({
      fromUserId: productForm.fromUserId as number,
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

async function createMoneyTransaction() {
  if (!moneyForm.fromUserId || !moneyForm.toUserId) return

  await runAction(async () => {
    const id = await yattAdminApi.createMoneyTransaction({
      fromUserId: moneyForm.fromUserId as number,
      toUserId: moneyForm.toUserId as number,
      transactionDate: moneyForm.transactionDate,
      amount: moneyForm.amount,
      moneyType: moneyForm.moneyType,
    })
    actionMessage.value = `Money transaction yaratildi: #${id}`
    moneyForm.amount = 0
    await loadMoney()
    moneyMode.value = 'list'
  })
}

function addProductRow() {
  productForm.products.push({ name: '', price: 0, quantity: 1 })
}

function removeProductRow(index: number) {
  if (productForm.products.length > 1) {
    productForm.products.splice(index, 1)
  }
}

function addProductEditRow() {
  productEditForm.products.push({ name: '', price: 0, quantity: 1 })
}

function removeProductEditRow(index: number) {
  if (productEditForm.products.length > 1) {
    productEditForm.products.splice(index, 1)
  }
}

async function openKassaDetail(id: number) {
  await runAction(async () => {
    selectedKassa.value = await yattAdminApi.getKassaById(id)
    kassaMode.value = 'detail'
  }, false)
}

async function openProductTransactionDetail(id: number) {
  await runAction(async () => {
    selectedProductTransaction.value = await yattAdminApi.getProductTransactionById(id)
    const logs = await yattAdminApi.getProductAuditLogs(id)
    transactionAuditLogs.value = logs
    productMode.value = 'detail'
  }, false)
}

async function openMoneyTransactionDetail(id: number) {
  await runAction(async () => {
    selectedMoneyTransaction.value = await yattAdminApi.getMoneyTransactionById(id)
    const logs = await yattAdminApi.getMoneyAuditLogs(id)
    transactionAuditLogs.value = logs
    moneyMode.value = 'detail'
  }, false)
}

async function confirmProductTransaction(id: number) {
  if (!window.confirm('Tranzaksiyani tasdiqlaysizmi?')) return
  await runAction(async () => {
    await yattAdminApi.confirmProductTransaction(id)
    actionMessage.value = 'Tranzaksiya tasdiqlandi'
    selectedProductTransaction.value = await yattAdminApi.getProductTransactionById(id)
    const logs = await yattAdminApi.getProductAuditLogs(id)
    transactionAuditLogs.value = logs
    await loadProducts()
  })
}

async function cancelProductTransaction(id: number) {
  if (!window.confirm('Tranzaksiyani bekor qilasizmi?')) return
  await runAction(async () => {
    await yattAdminApi.cancelProductTransaction(id)
    actionMessage.value = 'Tranzaksiya bekor qilindi'
    selectedProductTransaction.value = await yattAdminApi.getProductTransactionById(id)
    const logs = await yattAdminApi.getProductAuditLogs(id)
    transactionAuditLogs.value = logs
    await loadProducts()
  })
}

async function confirmMoneyTransaction(id: number) {
  if (!window.confirm('Tranzaksiyani tasdiqlaysizmi?')) return
  await runAction(async () => {
    await yattAdminApi.confirmMoneyTransaction(id)
    actionMessage.value = 'Tranzaksiya tasdiqlandi'
    selectedMoneyTransaction.value = await yattAdminApi.getMoneyTransactionById(id)
    const logs = await yattAdminApi.getMoneyAuditLogs(id)
    transactionAuditLogs.value = logs
    await loadMoney()
  })
}

async function cancelMoneyTransaction(id: number) {
  if (!window.confirm('Tranzaksiyani bekor qilasizmi?')) return
  await runAction(async () => {
    await yattAdminApi.cancelMoneyTransaction(id)
    actionMessage.value = 'Tranzaksiya bekor qilindi'
    selectedMoneyTransaction.value = await yattAdminApi.getMoneyTransactionById(id)
    const logs = await yattAdminApi.getMoneyAuditLogs(id)
    transactionAuditLogs.value = logs
    await loadMoney()
  })
}

function editKassa() {
  if (!selectedKassa.value) return

  kassaEditForm.ownerId = selectedKassa.value.ownerId
  kassaEditForm.terminal = selectedKassa.value.terminal
  kassaEditForm.card = selectedKassa.value.card
  kassaEditForm.cash = selectedKassa.value.cash
  kassaEditForm.comment = selectedKassa.value.comment ?? ''
  kassaEditForm.kassaDate = selectedKassa.value.kassaDate
  kassaMode.value = 'edit'
}

async function updateKassa() {
  if (!selectedKassa.value || !kassaEditForm.ownerId) return

  await runAction(async () => {
    await yattAdminApi.updateKassa(selectedKassa.value!.id, {
      ownerId: kassaEditForm.ownerId as number,
      terminal: kassaEditForm.terminal,
      card: kassaEditForm.card,
      cash: kassaEditForm.cash,
      comment: kassaEditForm.comment,
      kassaDate: kassaEditForm.kassaDate,
    })
    actionMessage.value = 'Kassa yangilandi'
    selectedKassa.value = await yattAdminApi.getKassaById(selectedKassa.value!.id)
    await loadKassa()
    kassaMode.value = 'detail'
  })
}

async function deleteKassa() {
  if (!selectedKassa.value || !window.confirm('Kassani ochirishni tasdiqlaysizmi?')) return

  await runAction(async () => {
    await yattAdminApi.deleteKassa(selectedKassa.value!.id)
    actionMessage.value = 'Kassa ochirildi'
    selectedKassa.value = null
    await loadKassa()
    kassaMode.value = 'list'
  })
}

function editProductTransaction() {
  if (!selectedProductTransaction.value) return

  productEditForm.fromUserId = selectedProductTransaction.value.fromUserId
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
  if (
    !selectedProductTransaction.value ||
    !productEditForm.fromUserId ||
    !productEditForm.toUserId
  ) {
    return
  }

  await runAction(async () => {
    await yattAdminApi.updateProductTransaction(selectedProductTransaction.value!.id, {
      fromUserId: productEditForm.fromUserId as number,
      toUserId: productEditForm.toUserId as number,
      transactionDate: productEditForm.transactionDate,
      products: productEditForm.products.filter((product) => product.name.trim()),
    })
    actionMessage.value = 'Product transaction yangilandi'
    selectedProductTransaction.value = await yattAdminApi.getProductTransactionById(
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
    await yattAdminApi.deleteProductTransaction(selectedProductTransaction.value!.id)
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
    await yattAdminApi.deleteProduct(selectedProductTransaction.value!.id, productId)
    actionMessage.value = 'Product ochirildi'
    selectedProductTransaction.value = await yattAdminApi.getProductTransactionById(
      selectedProductTransaction.value!.id,
    )
    await loadProducts()
  })
}

function editMoneyTransaction() {
  if (!selectedMoneyTransaction.value) return

  moneyEditForm.fromUserId = selectedMoneyTransaction.value.fromUserId
  moneyEditForm.toUserId = selectedMoneyTransaction.value.toUserId
  moneyEditForm.transactionDate = selectedMoneyTransaction.value.transactionDate
  moneyEditForm.amount = selectedMoneyTransaction.value.amount
  moneyEditForm.moneyType = selectedMoneyTransaction.value.moneyType as MoneyType
  moneyMode.value = 'edit'
}

async function updateMoneyTransaction() {
  if (!selectedMoneyTransaction.value || !moneyEditForm.fromUserId || !moneyEditForm.toUserId)
    return

  await runAction(async () => {
    await yattAdminApi.updateMoneyTransaction(selectedMoneyTransaction.value!.id, {
      fromUserId: moneyEditForm.fromUserId as number,
      toUserId: moneyEditForm.toUserId as number,
      transactionDate: moneyEditForm.transactionDate,
      amount: moneyEditForm.amount,
      moneyType: moneyEditForm.moneyType,
    })
    actionMessage.value = 'Money transaction yangilandi'
    selectedMoneyTransaction.value = await yattAdminApi.getMoneyTransactionById(
      selectedMoneyTransaction.value!.id,
    )
    await loadMoney()
    moneyMode.value = 'detail'
  })
}

async function deleteMoneyTransaction() {
  if (
    !selectedMoneyTransaction.value ||
    !window.confirm('Money transaction ochirishni tasdiqlaysizmi?')
  ) {
    return
  }

  await runAction(async () => {
    await yattAdminApi.deleteMoneyTransaction(selectedMoneyTransaction.value!.id)
    actionMessage.value = 'Money transaction ochirildi'
    selectedMoneyTransaction.value = null
    await loadMoney()
    moneyMode.value = 'list'
  })
}

async function refreshActiveList() {
  await runAction(async () => {
    if (activeTab.value === 'kassa') await loadKassa()
    if (activeTab.value === 'products') await loadProducts()
    if (activeTab.value === 'money') await loadMoney()
    if (activeTab.value === 'debits') await loadDebits()
  }, false)
}

async function downloadActiveExcel() {
  await runAction(async () => {
    if (activeTab.value === 'kassa') {
      await yattAdminApi.downloadKassaExcel({
        ownerId: commonFilter.ownerId,
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
    }
    if (activeTab.value === 'products') {
      await yattAdminApi.downloadProductTransactionsExcel(commonFilter)
    }
    if (activeTab.value === 'money') {
      await yattAdminApi.downloadMoneyTransactionsExcel(commonFilter)
    }
    if (activeTab.value === 'debits') {
      await yattAdminApi.downloadDebitsExcel({ fromUserId: commonFilter.fromUserId })
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
        <p>YATT admin</p>
        <h1>{{ profile?.fullName ?? 'Boshqaruv' }}</h1>
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
        <svg v-if="tab.key === 'staff' || tab.key === 'bigSellers'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <svg v-if="tab.key === 'kassa'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
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

    <section v-if="activeTab === 'staff' && staffMode === 'list'" class="panel">
      <div class="section-title">
        <h2>Xodimlar ro‘yxati (Staff)</h2>
        <button class="primary-small-button" type="button" @click="staffMode = 'create'; staffForm.role = 'SMALL_SELLER'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Xodim qo‘shish
        </button>
      </div>
      <div class="field" style="margin-bottom: 15px; display: flex; gap: 8px; flex-direction: row; align-items: center;">
        <input v-model="staffSearch" placeholder="Xodimlarni qidirish..." @keyup.enter="loadStaff" style="flex: 1; min-height: 42px;" />
        <button class="ghost-button" type="button" @click="loadStaff" style="min-height: 42px;">Qidirish</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <article v-for="user in staffList" :key="user.id" class="list-card">
          <strong>{{ user.fullName }}</strong>
          <span>ID: #{{ user.id }} · Username: @{{ user.username }}</span>
        </article>
      </div>
    </section>

    <section v-if="activeTab === 'bigSellers' && staffMode === 'list'" class="panel">
      <div class="section-title">
        <h2>Big Sellers ro‘yxati</h2>
        <button class="primary-small-button" type="button" @click="staffMode = 'create'; staffForm.role = 'BIG_SELLER'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Sotuvchi qo‘shish
        </button>
      </div>
      <div class="field" style="margin-bottom: 15px; display: flex; gap: 8px; flex-direction: row; align-items: center;">
        <input v-model="bigSellersSearch" placeholder="Sotuvchilarni qidirish..." @keyup.enter="loadBigSellers" style="flex: 1; min-height: 42px;" />
        <button class="ghost-button" type="button" @click="loadBigSellers" style="min-height: 42px;">Qidirish</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <article v-for="user in bigSellersList" :key="user.id" class="list-card">
          <strong>{{ user.fullName }}</strong>
          <span>ID: #{{ user.id }} · Username: @{{ user.username }}</span>
        </article>
      </div>
    </section>

    <section v-if="activeTab === 'staff' && staffMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Xodim qo‘shish</h2>
        <span>{{ users.length }} ta xodim</span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="staffMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="addStaff">
        <label class="field"><span>To‘liq ism</span><input v-model="staffForm.fullName" placeholder="Ali Valiyev" /></label>
        <label class="field"><span>Username</span><input v-model="staffForm.username" placeholder="ali01" /></label>
        <label class="field"><span>Parol</span><input v-model="staffForm.password" type="password" placeholder="••••••" /></label>
        <label class="field">
          <span>Roli (Role)</span>
          <select v-model="staffForm.role">
            <option v-for="role in staffRoles" :key="role" :value="role">{{ role }}</option>
          </select>
        </label>
        <button class="primary-button" type="submit" :disabled="isLoading">Qo‘shish</button>
      </form>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Kassa yaratish</h2>
        <span>Jami: {{ money(kassaTotal) }} UZS</span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="kassaMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="createKassa">
        <label class="field">
          <span>Egasi (Owner)</span>
          <select v-model.number="kassaForm.ownerId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <div class="mini-grid">
          <label class="field"><span>Terminal</span><input v-model.number="kassaForm.terminal" type="number" /></label>
          <label class="field"><span>Card</span><input v-model.number="kassaForm.card" type="number" /></label>
          <label class="field"><span>Cash</span><input v-model.number="kassaForm.cash" type="number" /></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="kassaForm.kassaDate" type="date" /></label>
        <label class="field"><span>Izoh</span><input v-model="kassaForm.comment" placeholder="Izoh yozing..." /></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Kassa yaratish</button>
      </form>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'detail' && selectedKassa" class="panel">
      <div class="section-title">
        <h2>Kassa tafsilotlari #{{ selectedKassa.id }}</h2>
        <span class="badge" :class="selectedKassa.isCompleted ? 'badge-completed' : 'badge-open'">
          {{ selectedKassa.isCompleted ? 'Completed' : 'Open' }}
        </span>
      </div>
      <div class="section-actions" style="margin-bottom: 20px;">
        <button class="ghost-button" type="button" @click="kassaMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
        <button class="ghost-button" type="button" @click="editKassa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Tahrirlash
        </button>
        <button class="danger-button" type="button" :disabled="isLoading" @click="deleteKassa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          O'chirish (Delete)
        </button>
      </div>
      <article class="list-card" style="box-shadow: none; border-color: var(--line);">
        <strong>{{ selectedKassa.ownerName }} · {{ money(selectedKassa.totaAmount) }} UZS</strong>
        <span>Sana: {{ selectedKassa.kassaDate }}</span>
        <span>Terminal: {{ money(selectedKassa.terminal) }} UZS</span>
        <span>Card: {{ money(selectedKassa.card) }} UZS</span>
        <span>Cash: {{ money(selectedKassa.cash) }} UZS</span>
        <span v-if="selectedKassa.comment">Izoh: {{ selectedKassa.comment }}</span>
      </article>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'edit' && selectedKassa" class="panel">
      <div class="section-title">
        <h2>Kassa tahrirlash</h2>
        <span>Jami: {{ money(kassaEditTotal) }} UZS</span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="kassaMode = 'detail'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="updateKassa">
        <label class="field">
          <span>Egasi (Owner)</span>
          <select v-model.number="kassaEditForm.ownerId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <div class="mini-grid">
          <label class="field"><span>Terminal</span><input v-model.number="kassaEditForm.terminal" type="number" /></label>
          <label class="field"><span>Card</span><input v-model.number="kassaEditForm.card" type="number" /></label>
          <label class="field"><span>Cash</span><input v-model.number="kassaEditForm.cash" type="number" /></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="kassaEditForm.kassaDate" type="date" /></label>
        <label class="field"><span>Izoh</span><input v-model="kassaEditForm.comment" /></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
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
        <div class="mini-grid">
          <label class="field">
            <span>Kimdan (From)</span>
            <select v-model.number="productForm.fromUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Kimga (To)</span>
            <select v-model.number="productForm.toUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
        </div>
        <label class="field"><span>Sana</span><input v-model="productForm.transactionDate" type="date" /></label>
        
        <div v-for="(product, index) in productForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" placeholder="Mahsulot nomi" /></label>
          <label class="field"><span>Narx</span><input v-model.number="product.price" type="number" /></label>
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
          Mahsulot qo‘shish
        </button>
        <button class="primary-button" type="submit" :disabled="isLoading">
          Tranzaksiya yaratish
        </button>
      </form>
    </section>

    <section
      v-if="activeTab === 'products' && productMode === 'detail' && selectedProductTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Tranzaksiya tafsilotlari #{{ selectedProductTransaction.id }}</h2>
        <span class="badge" :class="'badge-' + selectedProductTransaction.status.toLowerCase()">
          {{ selectedProductTransaction.status }}
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
        <button
          v-if="selectedProductTransaction.status === 'PENDING'"
          class="primary-small-button"
          type="button"
          :disabled="isLoading"
          @click="confirmProductTransaction(selectedProductTransaction.id)"
        >
          Tasdiqlash
        </button>
        <button
          v-if="selectedProductTransaction.status === 'PENDING'"
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="cancelProductTransaction(selectedProductTransaction.id)"
          style="min-height: 42px; font-size: 14px;"
        >
          Bekor qilish
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
        <h3 style="margin-bottom: 10px; font-size: 16px;">Mahsulotlar</h3>
        <article
          v-for="product in selectedProductTransaction.products"
          :key="product.id"
          class="list-card"
          style="background: #fafcfb; display: flex; flex-direction: row; align-items: center; justify-content: space-between;"
        >
          <div>
            <strong>{{ product.name }}</strong>
            <span style="margin-top: 4px; display: block;">Narx: {{ money(product.price) }} UZS · Soni: {{ product.quantity }} ta</span>
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

      <div style="margin-top: 25px; border-top: 1px solid var(--line); padding-top: 20px;">
        <h3 style="margin-bottom: 12px; font-size: 16px;">Tranzaksiya tarixi (Audit logs)</h3>
        <div v-if="transactionAuditLogs.length === 0" style="color: var(--hint); font-size: 14px;">Tarix mavjud emas</div>
        <article
          v-for="log in transactionAuditLogs"
          :key="log.id"
          class="list-card"
          style="background: #fafcfb; box-shadow: none; border: 1.5px solid var(--surface-border); gap: 6px; padding: 12px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="badge" :class="'badge-' + (log.actionType === 'CREATE' ? 'open' : log.actionType === 'COMPLETE' ? 'completed' : 'cancelled')">
              {{ log.actionType }}
            </span>
            <span style="font-size: 12px; color: var(--hint);">{{ log.performedAt.replace('T', ' ').substring(0, 19) }}</span>
          </div>
          <span style="font-size: 13px;">Bajaruvchi ID: #{{ log.performedByUserId }}</span>
          <div style="font-size: 12px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.04); margin-top: 6px;">
            <strong>Avvalgi holat:</strong>
            <pre style="margin: 4px 0 8px; font-family: monospace; white-space: pre-wrap; font-size: 11px;">{{ log.beforeState || 'null' }}</pre>
            <strong>Keyingi holat:</strong>
            <pre style="margin: 4px 0 0; font-family: monospace; white-space: pre-wrap; font-size: 11px;">{{ log.afterState || 'null' }}</pre>
          </div>
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
        <div class="mini-grid">
          <label class="field">
            <span>Kimdan (From)</span>
            <select v-model.number="productEditForm.fromUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Kimga (To)</span>
            <select v-model.number="productEditForm.toUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
        </div>
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

    <section v-if="activeTab === 'money' && moneyMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Pul o'tkazmasi (Money transaction)</h2>
        <span>
          <span class="badge" :class="'badge-' + moneyForm.moneyType.toLowerCase()">{{ moneyForm.moneyType }}</span>
        </span>
      </div>
      <div class="section-actions" style="margin-bottom: 15px;">
        <button class="ghost-button" type="button" @click="moneyMode = 'list'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Ortga
        </button>
      </div>
      <form class="form compact" @submit.prevent="createMoneyTransaction">
        <div class="mini-grid">
          <label class="field">
            <span>Kimdan (From)</span>
            <select v-model.number="moneyForm.fromUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Kimga (To)</span>
            <select v-model.number="moneyForm.toUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
        </div>
        <label class="field"><span>Sana</span><input v-model="moneyForm.transactionDate" type="date" /></label>
        <label class="field"><span>Summa (UZS)</span><input v-model.number="moneyForm.amount" type="number" /></label>
        <label class="field">
          <span>To'lov turi</span>
          <select v-model="moneyForm.moneyType">
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <button class="primary-button" type="submit" :disabled="isLoading">Tranzaksiya yaratish</button>
      </form>
    </section>

    <section
      v-if="activeTab === 'money' && moneyMode === 'detail' && selectedMoneyTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Pul o'tkazmasi tafsilotlari #{{ selectedMoneyTransaction.id }}</h2>
        <span class="badge" :class="'badge-' + selectedMoneyTransaction.status.toLowerCase()">
          {{ selectedMoneyTransaction.status }}
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
        <button
          v-if="selectedMoneyTransaction.status === 'PENDING'"
          class="primary-small-button"
          type="button"
          :disabled="isLoading"
          @click="confirmMoneyTransaction(selectedMoneyTransaction.id)"
        >
          Tasdiqlash
        </button>
        <button
          v-if="selectedMoneyTransaction.status === 'PENDING'"
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="cancelMoneyTransaction(selectedMoneyTransaction.id)"
          style="min-height: 42px; font-size: 14px;"
        >
          Bekor qilish
        </button>
        <button class="ghost-button" type="button" @click="editMoneyTransaction">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Tahrirlash
        </button>
        <button
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="deleteMoneyTransaction"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          O'chirish
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

      <div style="margin-top: 25px; border-top: 1px solid var(--line); padding-top: 20px;">
        <h3 style="margin-bottom: 12px; font-size: 16px;">Tranzaksiya tarixi (Audit logs)</h3>
        <div v-if="transactionAuditLogs.length === 0" style="color: var(--hint); font-size: 14px;">Tarix mavjud emas</div>
        <article
          v-for="log in transactionAuditLogs"
          :key="log.id"
          class="list-card"
          style="background: #fafcfb; box-shadow: none; border: 1.5px solid var(--surface-border); gap: 6px; padding: 12px;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="badge" :class="'badge-' + (log.actionType === 'CREATE' ? 'open' : log.actionType === 'COMPLETE' ? 'completed' : 'cancelled')">
              {{ log.actionType }}
            </span>
            <span style="font-size: 12px; color: var(--hint);">{{ log.performedAt.replace('T', ' ').substring(0, 19) }}</span>
          </div>
          <span style="font-size: 13px;">Bajaruvchi ID: #{{ log.performedByUserId }}</span>
          <div style="font-size: 12px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.04); margin-top: 6px;">
            <strong>Avvalgi holat:</strong>
            <pre style="margin: 4px 0 8px; font-family: monospace; white-space: pre-wrap; font-size: 11px;">{{ log.beforeState || 'null' }}</pre>
            <strong>Keyingi holat:</strong>
            <pre style="margin: 4px 0 0; font-family: monospace; white-space: pre-wrap; font-size: 11px;">{{ log.afterState || 'null' }}</pre>
          </div>
        </article>
      </div>
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
        <div class="mini-grid">
          <label class="field">
            <span>Kimdan (From)</span>
            <select v-model.number="moneyEditForm.fromUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>Kimga (To)</span>
            <select v-model.number="moneyEditForm.toUserId">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.fullName }}
              </option>
            </select>
          </label>
        </div>
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
        (activeTab === 'kassa' && kassaMode === 'list') ||
        (activeTab === 'products' && productMode === 'list') ||
        (activeTab === 'money' && moneyMode === 'list') ||
        activeTab === 'debits'
      "
      class="panel"
    >
      <div class="section-title">
        <h2>
          {{ activeTab === 'debits' ? 'Qarzlar (Debits)' : (activeTab === 'kassa' ? 'Kassalar ro‘yxati' : (activeTab === 'products' ? 'Mahsulotlar tranzaksiyalari' : 'Pul tranzaksiyalari')) }}
        </h2>
        <div class="section-actions">
          <button
            v-if="activeTab === 'kassa'"
            class="primary-small-button"
            type="button"
            @click="kassaMode = 'create'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Kassa yaratish
          </button>
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
            Tranzaksiya qo'shish
          </button>
          <button
            v-if="activeTab === 'money'"
            class="primary-small-button"
            type="button"
            @click="moneyMode = 'create'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Pul o'tkazish
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

      <div class="mini-grid">
        <label v-if="activeTab === 'kassa'" class="field">
          <span>Xodim bo'yicha</span>
          <select v-model.number="commonFilter.ownerId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'products' || activeTab === 'debits'" class="field">
          <span>Yuboruvchi user</span>
          <select v-model.number="commonFilter.fromUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'products'" class="field">
          <span>Qabul qiluvchi user</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Kimdan (From)</span>
          <select v-model.number="commonFilter.fromUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Kimga (To)</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Turi bo'yicha</span>
          <select v-model="commonFilter.moneyType">
            <option value="">Hammasi</option>
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label v-if="activeTab === 'kassa'" class="field">
          <span>Status</span>
          <select v-model="commonFilter.isCompleted">
            <option :value="null">Hammasi</option>
            <option :value="true">Completed</option>
            <option :value="false">Open</option>
          </select>
        </label>
        <label v-else-if="activeTab !== 'debits'" class="field">
          <span>Status</span>
          <select v-model="commonFilter.status">
            <option :value="null">Hammasi</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label class="field"><span>Dan</span><input v-model="commonFilter.from" type="date" /></label>
        <label class="field"><span>Gacha</span><input v-model="commonFilter.to" type="date" /></label>
      </div>

      <button class="ghost-button" type="button" @click="refreshActiveList" style="width: 100%; margin-bottom: 20px; font-weight: 700; border-color: var(--primary); color: var(--primary);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="vertical-align: middle; margin-right: 4px;">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtrlarni qo‘llash
      </button>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <button
          v-for="item in kassaList"
          v-if="activeTab === 'kassa'"
          :key="item.id"
          class="list-card"
          type="button"
          @click="openKassaDetail(item.id)"
        >
          <strong>{{ item.ownerName }} · {{ money(item.totaAmount) }} UZS</strong>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ item.kassaDate }} · 
            <span class="badge" :class="item.isCompleted ? 'badge-completed' : 'badge-open'">
              {{ item.isCompleted ? 'Completed' : 'Open' }}
            </span>
          </span>
        </button>

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
            <span class="badge" :class="'badge-' + item.status.toLowerCase()">{{ item.status }}</span> · 
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
            <span class="badge" :class="'badge-' + item.status.toLowerCase()">{{ item.status }}</span> · 
            <span class="badge" :class="'badge-' + item.moneyType.toLowerCase()">{{ item.moneyType }}</span> · 
            {{ money(item.amount) }} UZS
          </span>
        </button>

        <div v-if="activeTab === 'debits'" style="display: flex; flex-direction: column; gap: 8px;">
          <article
            v-for="item in debits"
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
      </div>
    </section>
  </main>
</template>
