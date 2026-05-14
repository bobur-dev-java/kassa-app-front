<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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
} from '@/types/api'

type TabKey = 'profile' | 'staff' | 'kassa' | 'products' | 'money' | 'debits'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profil' },
  { key: 'staff', label: 'Staff' },
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
    productForm.toUserId = productForm.toUserId ?? usersResponse[1]?.id ?? usersResponse[0]?.id ?? null
    moneyForm.fromUserId = moneyForm.fromUserId ?? usersResponse[0]?.id ?? null
    moneyForm.toUserId = moneyForm.toUserId ?? usersResponse[1]?.id ?? usersResponse[0]?.id ?? null
    await Promise.all([loadKassa(), loadProducts(), loadMoney(), loadDebits()])
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
      isCompleted: commonFilter.isCompleted,
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
      isCompleted: commonFilter.isCompleted,
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
    actionMessage.value = `Staff qoshildi: #${id}`
    staffForm.fullName = ''
    staffForm.username = ''
    staffForm.password = ''
    users.value = await yattAdminApi.getUsers()
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
    productMode.value = 'detail'
  }, false)
}

async function openMoneyTransactionDetail(id: number) {
  await runAction(async () => {
    selectedMoneyTransaction.value = await yattAdminApi.getMoneyTransactionById(id)
    moneyMode.value = 'detail'
  }, false)
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
  if (!selectedMoneyTransaction.value || !moneyEditForm.fromUserId || !moneyEditForm.toUserId) return

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
        <button class="ghost-button" type="button" @click="logout">Chiqish</button>
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
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="actionMessage" class="success">{{ actionMessage }}</p>
    <p v-if="actionError" class="alert">{{ actionError }}</p>

    <section v-if="activeTab === 'profile'" class="panel">
      <div class="section-title">
        <h2>Profil</h2>
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
        <h2>Staff ro‘yxati</h2>
        <button class="primary-small-button" type="button" @click="staffMode = 'create'">
          + Staff
        </button>
      </div>
      <article v-for="user in users" :key="user.id" class="list-card">
        <strong>{{ user.fullName }}</strong>
        <span>#{{ user.id }} · {{ user.username }}</span>
      </article>
    </section>

    <section v-if="activeTab === 'staff' && staffMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Staff qo‘shish</h2>
        <span>{{ users.length }} user</span>
      </div>
      <button class="ghost-button" type="button" @click="staffMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="addStaff">
        <label class="field"><span>To‘liq ism</span><input v-model="staffForm.fullName" /></label>
        <label class="field"><span>Username</span><input v-model="staffForm.username" /></label>
        <label class="field"><span>Parol</span><input v-model="staffForm.password" type="password" /></label>
        <label class="field">
          <span>Role</span>
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
        <span>Jami: {{ money(kassaTotal) }}</span>
      </div>
      <button class="ghost-button" type="button" @click="kassaMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="createKassa">
        <label class="field">
          <span>Owner</span>
          <select v-model.number="kassaForm.ownerId">
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option>
          </select>
        </label>
        <div class="mini-grid">
          <label class="field"><span>Terminal</span><input v-model.number="kassaForm.terminal" type="number" /></label>
          <label class="field"><span>Card</span><input v-model.number="kassaForm.card" type="number" /></label>
          <label class="field"><span>Cash</span><input v-model.number="kassaForm.cash" type="number" /></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="kassaForm.kassaDate" type="date" /></label>
        <label class="field"><span>Comment</span><input v-model="kassaForm.comment" /></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Kassa yaratish</button>
      </form>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'detail' && selectedKassa" class="panel">
      <div class="section-title">
        <h2>Kassa #{{ selectedKassa.id }}</h2>
        <span>{{ selectedKassa.isCompleted ? 'Completed' : 'Open' }}</span>
      </div>
      <div class="section-actions">
        <button class="ghost-button" type="button" @click="kassaMode = 'list'">Ortga</button>
        <button class="ghost-button" type="button" @click="editKassa">Edit</button>
        <button class="danger-button" type="button" :disabled="isLoading" @click="deleteKassa">Delete</button>
      </div>
      <article class="list-card">
        <strong>{{ selectedKassa.ownerName }} · {{ money(selectedKassa.totaAmount) }}</strong>
        <span>{{ selectedKassa.kassaDate }}</span>
        <span>Terminal: {{ money(selectedKassa.terminal) }}</span>
        <span>Card: {{ money(selectedKassa.card) }}</span>
        <span>Cash: {{ money(selectedKassa.cash) }}</span>
        <span v-if="selectedKassa.comment">Comment: {{ selectedKassa.comment }}</span>
      </article>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'edit' && selectedKassa" class="panel">
      <div class="section-title">
        <h2>Kassa tahrirlash</h2>
        <span>Jami: {{ money(kassaEditTotal) }}</span>
      </div>
      <button class="ghost-button" type="button" @click="kassaMode = 'detail'">Ortga</button>
      <form class="form compact" @submit.prevent="updateKassa">
        <label class="field">
          <span>Owner</span>
          <select v-model.number="kassaEditForm.ownerId">
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option>
          </select>
        </label>
        <div class="mini-grid">
          <label class="field"><span>Terminal</span><input v-model.number="kassaEditForm.terminal" type="number" /></label>
          <label class="field"><span>Card</span><input v-model.number="kassaEditForm.card" type="number" /></label>
          <label class="field"><span>Cash</span><input v-model.number="kassaEditForm.cash" type="number" /></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="kassaEditForm.kassaDate" type="date" /></label>
        <label class="field"><span>Comment</span><input v-model="kassaEditForm.comment" /></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section v-if="activeTab === 'products' && productMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Product transaction</h2>
        <span>{{ productForm.products.length }} product</span>
      </div>
      <button class="ghost-button" type="button" @click="productMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="createProductTransaction">
        <div class="mini-grid">
          <label class="field"><span>From</span><select v-model.number="productForm.fromUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
          <label class="field"><span>To</span><select v-model.number="productForm.toUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="productForm.transactionDate" type="date" /></label>
        <div v-for="(product, index) in productForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" /></label>
          <label class="field"><span>Narx</span><input v-model.number="product.price" type="number" /></label>
          <label class="field"><span>Soni</span><input v-model.number="product.quantity" type="number" /></label>
          <button class="ghost-button" type="button" @click="removeProductRow(index)">-</button>
        </div>
        <button class="ghost-button" type="button" @click="addProductRow">Product qo‘shish</button>
        <button class="primary-button" type="submit" :disabled="isLoading">Transaction yaratish</button>
      </form>
    </section>

    <section
      v-if="activeTab === 'products' && productMode === 'detail' && selectedProductTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Product transaction #{{ selectedProductTransaction.id }}</h2>
        <span>{{ selectedProductTransaction.isCompleted ? 'Completed' : 'Open' }}</span>
      </div>
      <div class="section-actions">
        <button class="ghost-button" type="button" @click="productMode = 'list'">Ortga</button>
        <button class="ghost-button" type="button" @click="editProductTransaction">Edit</button>
        <button class="danger-button" type="button" :disabled="isLoading" @click="deleteProductTransaction">
          Delete
        </button>
      </div>
      <article class="list-card">
        <strong>
          {{ selectedProductTransaction.fromUserFullName }} →
          {{ selectedProductTransaction.toUserFullName }}
        </strong>
        <span>{{ selectedProductTransaction.transactionDate }} · {{ money(selectedProductTransaction.totalPrice) }}</span>
      </article>
      <article v-for="product in selectedProductTransaction.products" :key="product.id" class="list-card">
        <strong>{{ product.name }}</strong>
        <span>Narx: {{ money(product.price) }} · Soni: {{ product.quantity }}</span>
      </article>
    </section>

    <section
      v-if="activeTab === 'products' && productMode === 'edit' && selectedProductTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Product tahrirlash</h2>
        <span>{{ productEditForm.products.length }} product</span>
      </div>
      <button class="ghost-button" type="button" @click="productMode = 'detail'">Ortga</button>
      <form class="form compact" @submit.prevent="updateProductTransaction">
        <div class="mini-grid">
          <label class="field"><span>From</span><select v-model.number="productEditForm.fromUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
          <label class="field"><span>To</span><select v-model.number="productEditForm.toUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="productEditForm.transactionDate" type="date" /></label>
        <div v-for="(product, index) in productEditForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" /></label>
          <label class="field"><span>Narx</span><input v-model.number="product.price" type="number" /></label>
          <label class="field"><span>Soni</span><input v-model.number="product.quantity" type="number" /></label>
          <button class="ghost-button" type="button" @click="removeProductEditRow(index)">-</button>
        </div>
        <button class="ghost-button" type="button" @click="addProductEditRow">Product qo‘shish</button>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section v-if="activeTab === 'money' && moneyMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Money transaction</h2>
        <span>{{ moneyForm.moneyType }}</span>
      </div>
      <button class="ghost-button" type="button" @click="moneyMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="createMoneyTransaction">
        <div class="mini-grid">
          <label class="field"><span>From</span><select v-model.number="moneyForm.fromUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
          <label class="field"><span>To</span><select v-model.number="moneyForm.toUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="moneyForm.transactionDate" type="date" /></label>
        <label class="field"><span>Summa</span><input v-model.number="moneyForm.amount" type="number" /></label>
        <label class="field"><span>Type</span><select v-model="moneyForm.moneyType"><option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option></select></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Transaction yaratish</button>
      </form>
    </section>

    <section
      v-if="activeTab === 'money' && moneyMode === 'detail' && selectedMoneyTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Money transaction #{{ selectedMoneyTransaction.id }}</h2>
        <span>{{ selectedMoneyTransaction.isCompleted ? 'Completed' : 'Open' }}</span>
      </div>
      <div class="section-actions">
        <button class="ghost-button" type="button" @click="moneyMode = 'list'">Ortga</button>
        <button class="ghost-button" type="button" @click="editMoneyTransaction">Edit</button>
        <button class="danger-button" type="button" :disabled="isLoading" @click="deleteMoneyTransaction">
          Delete
        </button>
      </div>
      <article class="list-card">
        <strong>
          {{ selectedMoneyTransaction.fromUserFullName }} →
          {{ selectedMoneyTransaction.toUserFullName }}
        </strong>
        <span>{{ selectedMoneyTransaction.transactionDate }} · {{ selectedMoneyTransaction.moneyType }}</span>
        <span>Summa: {{ money(selectedMoneyTransaction.amount) }}</span>
      </article>
    </section>

    <section
      v-if="activeTab === 'money' && moneyMode === 'edit' && selectedMoneyTransaction"
      class="panel"
    >
      <div class="section-title">
        <h2>Money tahrirlash</h2>
        <span>{{ moneyEditForm.moneyType }}</span>
      </div>
      <button class="ghost-button" type="button" @click="moneyMode = 'detail'">Ortga</button>
      <form class="form compact" @submit.prevent="updateMoneyTransaction">
        <div class="mini-grid">
          <label class="field"><span>From</span><select v-model.number="moneyEditForm.fromUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
          <label class="field"><span>To</span><select v-model.number="moneyEditForm.toUserId"><option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option></select></label>
        </div>
        <label class="field"><span>Sana</span><input v-model="moneyEditForm.transactionDate" type="date" /></label>
        <label class="field"><span>Summa</span><input v-model.number="moneyEditForm.amount" type="number" /></label>
        <label class="field"><span>Type</span><select v-model="moneyEditForm.moneyType"><option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option></select></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section
      v-if="
        (activeTab === 'products' && productMode === 'list') ||
        (activeTab === 'money' && moneyMode === 'list') ||
        activeTab === 'debits' ||
        (activeTab === 'kassa' && kassaMode === 'list')
      "
      class="panel"
    >
      <div class="section-title">
        <h2>{{ activeTab === 'kassa' ? 'Kassa ro‘yxati' : 'Ro‘yxat' }}</h2>
        <div class="section-actions">
          <button
            v-if="activeTab === 'kassa'"
            class="primary-small-button"
            type="button"
            @click="kassaMode = 'create'"
          >
            + Kassa
          </button>
          <button
            v-if="activeTab === 'products'"
            class="primary-small-button"
            type="button"
            @click="productMode = 'create'"
          >
            + Product transaction
          </button>
          <button
            v-if="activeTab === 'money'"
            class="primary-small-button"
            type="button"
            @click="moneyMode = 'create'"
          >
            + Money transaction
          </button>
          <button class="ghost-button" type="button" @click="downloadActiveExcel">Excel</button>
        </div>
      </div>
      <div class="mini-grid">
        <label v-if="activeTab === 'kassa'" class="field">
          <span>Owner</span>
          <select v-model.number="commonFilter.ownerId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option>
          </select>
        </label>
        <label v-if="activeTab === 'products' || activeTab === 'money' || activeTab === 'debits'" class="field">
          <span>From user</span>
          <select v-model.number="commonFilter.fromUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option>
          </select>
        </label>
        <label v-if="activeTab === 'products' || activeTab === 'money'" class="field">
          <span>To user</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.fullName }}</option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Money type</span>
          <select v-model="commonFilter.moneyType">
            <option value="">Hammasi</option>
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label v-if="activeTab === 'kassa' || activeTab === 'products' || activeTab === 'money'" class="field">
          <span>Status</span>
          <select v-model="commonFilter.isCompleted">
            <option :value="null">Hammasi</option>
            <option :value="true">Completed</option>
            <option :value="false">Open</option>
          </select>
        </label>
        <label class="field"><span>From</span><input v-model="commonFilter.from" type="date" /></label>
        <label class="field"><span>To</span><input v-model="commonFilter.to" type="date" /></label>
      </div>
      <button class="ghost-button" type="button" @click="refreshActiveList">Filter</button>

      <button
        v-for="item in kassaList"
        v-if="activeTab === 'kassa'"
        :key="item.id"
        class="list-card"
        type="button"
        @click="openKassaDetail(item.id)"
      >
        <strong>{{ item.ownerName }} · {{ money(item.totaAmount) }}</strong>
        <span>{{ item.kassaDate }} · {{ item.isCompleted ? 'Completed' : 'Open' }}</span>
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
        <span>{{ item.transactionDate }} · {{ money(item.totalPrice) }}</span>
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
        <span>{{ item.transactionDate }} · {{ item.moneyType }} · {{ money(item.amount) }}</span>
      </button>
      <article v-for="item in debits" v-if="activeTab === 'debits'" :key="item.fromUserId" class="list-card">
        <strong>User #{{ item.fromUserId }}</strong>
        <span>Active: {{ money(item.activeAmount) }} · Non active: {{ money(item.nonActive) }}</span>
      </article>
    </section>
  </main>
</template>
