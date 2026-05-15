<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TelegramConnectButton from '@/components/TelegramConnectButton.vue'
import YattSwitcher from '@/components/YattSwitcher.vue'
import { ApiError, smallSellerApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type {
  KassaResponse,
  MoneyTransactionResponse,
  MoneyType,
  ProductRequest,
  ProductTransactionResponse,
  UserProfileResponse,
  UserResponse,
} from '@/types/api'

type TabKey = 'profile' | 'kassa' | 'products' | 'money'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profil' },
  { key: 'kassa', label: 'Kassa' },
  { key: 'products', label: 'Product' },
  { key: 'money', label: 'Money' },
]
const moneyTypes: MoneyType[] = ['CASH', 'TERMINAL', 'CARD']

const router = useRouter()
const auth = useAuthStore()
const activeTab = ref<TabKey>('profile')
const kassaMode = ref<'list' | 'create' | 'detail' | 'edit'>('list')
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
const selectedKassa = ref<KassaResponse | null>(null)
const selectedProductTransaction = ref<ProductTransactionResponse | null>(null)
const selectedMoneyTransaction = ref<MoneyTransactionResponse | null>(null)

const profileForm = reactive({ fullName: '', username: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '' })
const kassaForm = reactive({
  terminal: 0,
  card: 0,
  cash: 0,
  comment: '',
  kassaDate: today(),
})
const kassaEditForm = reactive({
  terminal: 0,
  card: 0,
  cash: 0,
  comment: '',
  kassaDate: today(),
})
const productForm = reactive({
  fromUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const productEditForm = reactive({
  fromUserId: null as number | null,
  transactionDate: today(),
  products: [{ name: '', price: 0, quantity: 1 }] as ProductRequest[],
})
const moneyForm = reactive({
  toUserId: null as number | null,
  transactionDate: today(),
  amount: 0,
  moneyType: 'CASH' as MoneyType,
})
const moneyEditForm = reactive({
  toUserId: null as number | null,
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
const kassaTotal = computed(() => kassaForm.terminal + kassaForm.card + kassaForm.cash)
const kassaEditTotal = computed(
  () => kassaEditForm.terminal + kassaEditForm.card + kassaEditForm.cash,
)

onMounted(loadDashboard)

async function loadDashboard() {
  await runAction(async () => {
    const [profileResponse, usersResponse] = await Promise.all([
      smallSellerApi.getProfile(),
      smallSellerApi.getUsers(),
    ])

    profile.value = profileResponse
    profileForm.fullName = profileResponse.fullName
    profileForm.username = profileResponse.username
    users.value = usersResponse
    productForm.fromUserId = productForm.fromUserId ?? usersResponse[0]?.id ?? null
    moneyForm.toUserId = moneyForm.toUserId ?? usersResponse[0]?.id ?? null
    await Promise.all([loadKassa(), loadProducts(), loadMoney()])
  }, false)
}

async function loadKassa() {
  const response = await smallSellerApi.getKassa(
    {
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
  const response = await smallSellerApi.getProductTransactions(
    {
      fromUserId: commonFilter.fromUserId,
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
  const response = await smallSellerApi.getMoneyTransactions(
    {
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

async function saveProfile() {
  await runAction(async () => {
    await smallSellerApi.updateProfile(profileForm)
    actionMessage.value = 'Profil yangilandi'
    profile.value = await smallSellerApi.getProfile()
  })
}

async function savePassword() {
  await runAction(async () => {
    await smallSellerApi.updatePassword(passwordForm)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    actionMessage.value = 'Parol yangilandi'
  })
}

function selectTab(tab: TabKey) {
  activeTab.value = tab
  if (tab === 'kassa') kassaMode.value = 'list'
  if (tab === 'products') productMode.value = 'list'
  if (tab === 'money') moneyMode.value = 'list'
}

async function createKassa() {
  await runAction(async () => {
    const id = await smallSellerApi.createKassa({
      ownerId: currentUserId.value,
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

async function createProductTransaction() {
  if (!productForm.fromUserId) return

  await runAction(async () => {
    const id = await smallSellerApi.createProductTransaction({
      fromUserId: productForm.fromUserId as number,
      toUserId: currentUserId.value,
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
  if (!moneyForm.toUserId) return

  await runAction(async () => {
    const id = await smallSellerApi.createMoneyTransaction({
      fromUserId: currentUserId.value,
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
  if (productForm.products.length > 1) productForm.products.splice(index, 1)
}

function addProductEditRow() {
  productEditForm.products.push({ name: '', price: 0, quantity: 1 })
}

function removeProductEditRow(index: number) {
  if (productEditForm.products.length > 1) productEditForm.products.splice(index, 1)
}

async function openKassaDetail(id: number) {
  await runAction(async () => {
    selectedKassa.value = await smallSellerApi.getKassaById(id)
    kassaMode.value = 'detail'
  }, false)
}

async function openProductTransactionDetail(id: number) {
  await runAction(async () => {
    selectedProductTransaction.value = await smallSellerApi.getProductTransactionById(id)
    productMode.value = 'detail'
  }, false)
}

async function openMoneyTransactionDetail(id: number) {
  await runAction(async () => {
    selectedMoneyTransaction.value = await smallSellerApi.getMoneyTransactionById(id)
    moneyMode.value = 'detail'
  }, false)
}

function editKassa() {
  if (!selectedKassa.value) return
  kassaEditForm.terminal = selectedKassa.value.terminal
  kassaEditForm.card = selectedKassa.value.card
  kassaEditForm.cash = selectedKassa.value.cash
  kassaEditForm.comment = selectedKassa.value.comment ?? ''
  kassaEditForm.kassaDate = selectedKassa.value.kassaDate
  kassaMode.value = 'edit'
}

async function updateKassa() {
  if (!selectedKassa.value) return

  await runAction(async () => {
    await smallSellerApi.updateKassa(selectedKassa.value!.id, {
      ownerId: currentUserId.value,
      terminal: kassaEditForm.terminal,
      card: kassaEditForm.card,
      cash: kassaEditForm.cash,
      comment: kassaEditForm.comment,
      kassaDate: kassaEditForm.kassaDate,
    })
    actionMessage.value = 'Kassa yangilandi'
    selectedKassa.value = await smallSellerApi.getKassaById(selectedKassa.value!.id)
    await loadKassa()
    kassaMode.value = 'detail'
  })
}

function editProductTransaction() {
  if (!selectedProductTransaction.value) return
  productEditForm.fromUserId = selectedProductTransaction.value.fromUserId
  productEditForm.transactionDate = selectedProductTransaction.value.transactionDate
  productEditForm.products = selectedProductTransaction.value.products.map((product) => ({
    name: product.name,
    price: product.price,
    quantity: product.quantity,
  }))
  productMode.value = 'edit'
}

async function updateProductTransaction() {
  if (!selectedProductTransaction.value || !productEditForm.fromUserId) return

  await runAction(async () => {
    await smallSellerApi.updateProductTransaction(selectedProductTransaction.value!.id, {
      fromUserId: productEditForm.fromUserId as number,
      toUserId: currentUserId.value,
      transactionDate: productEditForm.transactionDate,
      products: productEditForm.products.filter((product) => product.name.trim()),
    })
    actionMessage.value = 'Product transaction yangilandi'
    selectedProductTransaction.value = await smallSellerApi.getProductTransactionById(
      selectedProductTransaction.value!.id,
    )
    await loadProducts()
    productMode.value = 'detail'
  })
}

function editMoneyTransaction() {
  if (!selectedMoneyTransaction.value) return
  moneyEditForm.toUserId = selectedMoneyTransaction.value.toUserId
  moneyEditForm.transactionDate = selectedMoneyTransaction.value.transactionDate
  moneyEditForm.amount = selectedMoneyTransaction.value.amount
  moneyEditForm.moneyType = selectedMoneyTransaction.value.moneyType as MoneyType
  moneyMode.value = 'edit'
}

async function updateMoneyTransaction() {
  if (!selectedMoneyTransaction.value || !moneyEditForm.toUserId) return

  await runAction(async () => {
    await smallSellerApi.updateMoneyTransaction(selectedMoneyTransaction.value!.id, {
      fromUserId: currentUserId.value,
      toUserId: moneyEditForm.toUserId as number,
      transactionDate: moneyEditForm.transactionDate,
      amount: moneyEditForm.amount,
      moneyType: moneyEditForm.moneyType,
    })
    actionMessage.value = 'Money transaction yangilandi'
    selectedMoneyTransaction.value = await smallSellerApi.getMoneyTransactionById(
      selectedMoneyTransaction.value!.id,
    )
    await loadMoney()
    moneyMode.value = 'detail'
  })
}

async function refreshActiveList() {
  await runAction(async () => {
    if (activeTab.value === 'kassa') await loadKassa()
    if (activeTab.value === 'products') await loadProducts()
    if (activeTab.value === 'money') await loadMoney()
  }, false)
}

async function downloadActiveExcel() {
  await runAction(async () => {
    if (activeTab.value === 'kassa') {
      await smallSellerApi.downloadKassaExcel({
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
    }
    if (activeTab.value === 'products') {
      await smallSellerApi.downloadProductTransactionsExcel({
        fromUserId: commonFilter.fromUserId,
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
    }
    if (activeTab.value === 'money') {
      await smallSellerApi.downloadMoneyTransactionsExcel({
        toUserId: commonFilter.toUserId,
        moneyType: commonFilter.moneyType,
        from: commonFilter.from,
        to: commonFilter.to,
        isCompleted: commonFilter.isCompleted,
      })
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
        <p>Small seller</p>
        <h1>{{ profile?.fullName ?? 'Savdo' }}</h1>
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
        <label class="field"
          ><span>To‘liq ism</span><input v-model="profileForm.fullName" :disabled="isLoading"
        /></label>
        <label class="field"
          ><span>Username</span><input v-model="profileForm.username" :disabled="isLoading"
        /></label>
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
      <form class="form compact" @submit.prevent="savePassword">
        <label class="field"
          ><span>Eski parol</span
          ><input v-model="passwordForm.oldPassword" type="password" :disabled="isLoading"
        /></label>
        <label class="field"
          ><span>Yangi parol</span
          ><input v-model="passwordForm.newPassword" type="password" :disabled="isLoading"
        /></label>
        <button class="ghost-button" type="submit" :disabled="isLoading">Parolni yangilash</button>
      </form>
    </section>

    <section v-if="activeTab === 'kassa' && kassaMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Kassa yaratish</h2>
        <span>Jami: {{ money(kassaTotal) }}</span>
      </div>
      <button class="ghost-button" type="button" @click="kassaMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="createKassa">
        <div class="mini-grid">
          <label class="field"
            ><span>Terminal</span><input v-model.number="kassaForm.terminal" type="number"
          /></label>
          <label class="field"
            ><span>Card</span><input v-model.number="kassaForm.card" type="number"
          /></label>
          <label class="field"
            ><span>Cash</span><input v-model.number="kassaForm.cash" type="number"
          /></label>
        </div>
        <label class="field"
          ><span>Sana</span><input v-model="kassaForm.kassaDate" type="date"
        /></label>
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
        <div class="mini-grid">
          <label class="field"
            ><span>Terminal</span><input v-model.number="kassaEditForm.terminal" type="number"
          /></label>
          <label class="field"
            ><span>Card</span><input v-model.number="kassaEditForm.card" type="number"
          /></label>
          <label class="field"
            ><span>Cash</span><input v-model.number="kassaEditForm.cash" type="number"
          /></label>
        </div>
        <label class="field"
          ><span>Sana</span><input v-model="kassaEditForm.kassaDate" type="date"
        /></label>
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
        <label class="field"
          ><span>From</span
          ><select v-model.number="productForm.fromUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Sana</span><input v-model="productForm.transactionDate" type="date"
        /></label>
        <div v-for="(product, index) in productForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" /></label>
          <label class="field"
            ><span>Narx</span><input v-model.number="product.price" type="number"
          /></label>
          <label class="field"
            ><span>Soni</span><input v-model.number="product.quantity" type="number"
          /></label>
          <button class="ghost-button" type="button" @click="removeProductRow(index)">-</button>
        </div>
        <button class="ghost-button" type="button" @click="addProductRow">Product qo‘shish</button>
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
        <h2>Product transaction #{{ selectedProductTransaction.id }}</h2>
        <span>{{ selectedProductTransaction.isCompleted ? 'Completed' : 'Open' }}</span>
      </div>
      <div class="section-actions">
        <button class="ghost-button" type="button" @click="productMode = 'list'">Ortga</button>
        <button class="ghost-button" type="button" @click="editProductTransaction">Edit</button>
      </div>
      <article class="list-card">
        <strong
          >{{ selectedProductTransaction.fromUserFullName }} →
          {{ selectedProductTransaction.toUserFullName }}</strong
        >
        <span
          >{{ selectedProductTransaction.transactionDate }} ·
          {{ money(selectedProductTransaction.totalPrice) }}</span
        >
      </article>
      <article
        v-for="product in selectedProductTransaction.products"
        :key="product.id"
        class="list-card"
      >
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
        <label class="field"
          ><span>From</span
          ><select v-model.number="productEditForm.fromUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Sana</span><input v-model="productEditForm.transactionDate" type="date"
        /></label>
        <div v-for="(product, index) in productEditForm.products" :key="index" class="product-row">
          <label class="field"><span>Nomi</span><input v-model="product.name" /></label>
          <label class="field"
            ><span>Narx</span><input v-model.number="product.price" type="number"
          /></label>
          <label class="field"
            ><span>Soni</span><input v-model.number="product.quantity" type="number"
          /></label>
          <button class="ghost-button" type="button" @click="removeProductEditRow(index)">-</button>
        </div>
        <button class="ghost-button" type="button" @click="addProductEditRow">
          Product qo‘shish
        </button>
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
        <label class="field"
          ><span>To</span
          ><select v-model.number="moneyForm.toUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Sana</span><input v-model="moneyForm.transactionDate" type="date"
        /></label>
        <label class="field"
          ><span>Summa</span><input v-model.number="moneyForm.amount" type="number"
        /></label>
        <label class="field"
          ><span>Type</span
          ><select v-model="moneyForm.moneyType">
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select></label
        >
        <button class="primary-button" type="submit" :disabled="isLoading">
          Transaction yaratish
        </button>
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
      </div>
      <article class="list-card">
        <strong
          >{{ selectedMoneyTransaction.fromUserFullName }} →
          {{ selectedMoneyTransaction.toUserFullName }}</strong
        >
        <span
          >{{ selectedMoneyTransaction.transactionDate }} ·
          {{ selectedMoneyTransaction.moneyType }}</span
        >
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
        <label class="field"
          ><span>To</span
          ><select v-model.number="moneyEditForm.toUserId">
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Sana</span><input v-model="moneyEditForm.transactionDate" type="date"
        /></label>
        <label class="field"
          ><span>Summa</span><input v-model.number="moneyEditForm.amount" type="number"
        /></label>
        <label class="field"
          ><span>Type</span
          ><select v-model="moneyEditForm.moneyType">
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select></label
        >
        <button class="primary-button" type="submit" :disabled="isLoading">Saqlash</button>
      </form>
    </section>

    <section
      v-if="
        (activeTab === 'kassa' && kassaMode === 'list') ||
        (activeTab === 'products' && productMode === 'list') ||
        (activeTab === 'money' && moneyMode === 'list')
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
        <label v-if="activeTab === 'products'" class="field">
          <span>From user</span>
          <select v-model.number="commonFilter.fromUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>To user</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>Money type</span>
          <select v-model="commonFilter.moneyType">
            <option value="">Hammasi</option>
            <option v-for="type in moneyTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="field">
          <span>Status</span>
          <select v-model="commonFilter.isCompleted">
            <option :value="null">Hammasi</option>
            <option :value="true">Completed</option>
            <option :value="false">Open</option>
          </select>
        </label>
        <label class="field"
          ><span>From</span><input v-model="commonFilter.from" type="date"
        /></label>
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
    </section>
  </main>
</template>
