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

    <section v-if="activeTab === 'products' && productMode === 'create'" class="panel">
      <div class="section-title">
        <h2>Product transaction</h2>
        <span>{{ productForm.products.length }} product</span>
      </div>
      <button class="ghost-button" type="button" @click="productMode = 'list'">Ortga</button>
      <form class="form compact" @submit.prevent="createProductTransaction">
        <label class="field"
          ><span>To</span
          ><select v-model.number="productForm.toUserId">
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
        <button
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="deleteProductTransaction"
        >
          Delete
        </button>
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
        <button
          class="danger-button"
          type="button"
          :disabled="isLoading"
          @click="deleteProduct(product.id)"
        >
          Delete
        </button>
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
          ><span>To</span
          ><select v-model.number="productEditForm.toUserId">
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
          ><span>From</span
          ><select v-model.number="moneyEditForm.fromUserId">
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
        (activeTab === 'products' && productMode === 'list') ||
        (activeTab === 'money' && moneyMode === 'list') ||
        activeTab === 'debits'
      "
      class="panel"
    >
      <div class="section-title">
        <h2>{{ activeTab === 'debits' ? 'Debit ro‘yxati' : 'Ro‘yxat' }}</h2>
        <div class="section-actions">
          <button
            v-if="activeTab === 'products'"
            class="primary-small-button"
            type="button"
            @click="productMode = 'create'"
          >
            + Product transaction
          </button>
          <button class="ghost-button" type="button" @click="downloadActiveExcel">Excel</button>
        </div>
      </div>
      <div v-if="activeTab !== 'debits'" class="mini-grid">
        <label v-if="activeTab === 'products'" class="field">
          <span>To user</span>
          <select v-model.number="commonFilter.toUserId">
            <option :value="null">Hammasi</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.fullName }}
            </option>
          </select>
        </label>
        <label v-if="activeTab === 'money'" class="field">
          <span>From user</span>
          <select v-model.number="commonFilter.fromUserId">
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
      <article
        v-for="item in debits"
        v-if="activeTab === 'debits'"
        :key="item.fromUserId"
        class="list-card"
      >
        <strong>User #{{ item.fromUserId }}</strong>
        <span
          >Active: {{ money(item.activeAmount) }} · Non active: {{ money(item.nonActive) }}</span
        >
      </article>
    </section>
  </main>
</template>
