import type {
  AccessTokenRequest,
  AuthClaims,
  DebitFilter,
  DebitResponse,
  HttpApiResponse,
  KassaCreateRequest,
  KassaFilter,
  KassaResponse,
  LoginRequest,
  LoginResponse,
  LoginYattRes,
  MoneyTransactionFilter,
  MoneyTransactionRequest,
  MoneyTransactionResponse,
  PageResponse,
  ProductTransactionFilter,
  ProductTransactionRequest,
  ProductTransactionResponse,
  StaffCreateRequest,
  SystemInfoResponse,
  TelegramConnectResponse,
  TelegramLoginRequest,
  UserCreateRequest,
  UserProfileResponse,
  UserResponse,
  YaTTUserRole,
  YattCreateRequest,
  YattResponse,
} from '@/types/api'
import { APP_CONFIG } from '@/config/app-config'

const API_BASE_URL = APP_CONFIG.apiBaseUrl
const ACCESS_TOKEN_KEY = 'kassa_access_token'
const REFRESH_TOKEN_KEY = 'kassa_refresh_token'
const ROLE_KEY = 'kassa_user_role'
const USER_ID_KEY = 'kassa_user_id'
const YATT_ID_KEY = 'kassa_yatt_id'
const LOGIN_YATTS_KEY = 'kassa_login_yatts'
export const AUTH_CHANGED_EVENT = 'kassa-auth-changed'
let refreshPromise: Promise<LoginResponse | null> | null = null

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

type QueryValue = string | number | boolean | null | undefined

export class ApiError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getRole: () => localStorage.getItem(ROLE_KEY),
  getUserId: () => Number(localStorage.getItem(USER_ID_KEY)) || null,
  getYattId: () => Number(localStorage.getItem(YATT_ID_KEY)) || null,
  getLoginYatts: () =>
    safeJsonParse(localStorage.getItem(LOGIN_YATTS_KEY) ?? '[]') as LoginYattRes[],
  setAuth: (response: LoginResponse, options: { preserveLoginYatts?: boolean } = {}) => {
    const claims = decodeJwtPayload(response.accessToken)
    const role = normalizeRole(response.role ?? claims?.role)
    const yattId = claims?.yattId ?? response.activeYattId

    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(YATT_ID_KEY)
    if (!options.preserveLoginYatts) {
      localStorage.removeItem(LOGIN_YATTS_KEY)
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)

    if (role) {
      localStorage.setItem(ROLE_KEY, role)
    }

    if (claims?.userId) {
      localStorage.setItem(USER_ID_KEY, String(claims.userId))
    }

    if (yattId) {
      localStorage.setItem(YATT_ID_KEY, String(yattId))
    }

    if (response.yattRes) {
      localStorage.setItem(LOGIN_YATTS_KEY, JSON.stringify(response.yattRes))
    }

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(YATT_ID_KEY)
    localStorage.removeItem(LOGIN_YATTS_KEY)
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  },
}

export function decodeJwtPayload(token: string | null): AuthClaims | null {
  if (!token) {
    return null
  }

  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    return JSON.parse(json) as AuthClaims
  } catch {
    return null
  }
}

export function normalizeRole(role: AuthClaims['role']): YaTTUserRole | null {
  if (!role) {
    return null
  }

  const normalized = String(role).replace(/^ROLE_/, '') as YaTTUserRole
  const roles: YaTTUserRole[] = ['ADMIN', 'YATT_ADMIN', 'SMALL_SELLER', 'BIG_SELLER']

  return roles.includes(normalized) ? normalized : null
}

export function isJwtExpired(token: string | null) {
  const claims = decodeJwtPayload(token)

  if (!claims?.exp) {
    return true
  }

  return claims.exp * 1000 <= Date.now()
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  didRetry = false,
): Promise<T> {
  const headers = new Headers()

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false) {
    const token = tokenStorage.getAccessToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    throw new ApiError(`Backendga ulanib bolmadi: ${API_BASE_URL}${path}`, 0, error)
  }

  const text = await response.text()
  const payload = text ? safeJsonParse(text) : null

  if (response.status === 401 && options.auth !== false && !didRetry) {
    refreshPromise ??= refreshStoredAccessToken().finally(() => {
      refreshPromise = null
    })

    const refreshed = await refreshPromise

    if (refreshed) {
      return request<T>(path, options, true)
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? 'Server bilan boglanishda xatolik yuz berdi',
      response.status,
      payload,
    )
  }

  return payload as T
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function refreshStoredAccessToken() {
  const refreshToken = tokenStorage.getRefreshToken()

  if (!refreshToken) {
    tokenStorage.clear()
    return null
  }

  try {
    const response = await apiResponse<LoginResponse>('/api/auth/access-token', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })

    tokenStorage.setAuth(response, { preserveLoginYatts: true })
    return response
  } catch {
    tokenStorage.clear()
    return null
  }
}

async function apiResponse<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await request<HttpApiResponse<T>>(path, options)

  if (response.status >= 400) {
    throw new ApiError(response.message ?? 'Sorov bajarilmadi', response.status, response)
  }

  return response.data as T
}

function withQuery(path: string, params: Record<string, QueryValue>) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function downloadFile(path: string, filename: string) {
  const headers = new Headers()
  const token = tokenStorage.getAccessToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers })

  if (!response.ok) {
    throw new ApiError('Excel faylni yuklab bolmadi', response.status)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const authApi = {
  getAllYatt: () => apiResponse<YattResponse[]>('/api/auth/all-yatt'),
  login: (body: LoginRequest) =>
    apiResponse<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body,
      auth: false,
    }),
  telegramLogin: (body: TelegramLoginRequest) =>
    apiResponse<LoginResponse>('/api/auth/login/telegram', {
      method: 'POST',
      body,
      auth: false,
    }),
  createTelegramConnectToken: () =>
    request<TelegramConnectResponse>('/api/auth/telegram/connect-token', {
      method: 'POST',
    }),
  selectYatt: (yattId: number) =>
    apiResponse<LoginResponse>(withQuery('/api/auth/select-yatt', { yattId }), {
      method: 'POST',
    }),
  getAccessToken: (body: AccessTokenRequest) =>
    apiResponse<LoginResponse>('/api/auth/access-token', {
      method: 'POST',
      body,
      auth: false,
    }),
}

export const adminApi = {
  createYatt: (body: YattCreateRequest) =>
    apiResponse<number>('/api/system-admin/yatt', {
      method: 'POST',
      body,
    }),
  addUser: (yattId: number, body: UserCreateRequest) =>
    apiResponse<number>(`/api/system-admin/${yattId}`, {
      method: 'POST',
      body,
    }),
  getSystemInfo: () => apiResponse<SystemInfoResponse>('/api/system-admin/statistics'),
}

export const yattAdminApi = {
  getProfile: () => apiResponse<UserProfileResponse>('/api/yatt-admin/profile'),
  updateProfile: (body: { fullName: string; username: string }) =>
    apiResponse<boolean>('/api/yatt-admin/profile', { method: 'PUT', body }),
  updatePassword: (body: { oldPassword: string; newPassword: string }) =>
    apiResponse<boolean>('/api/yatt-admin/password', { method: 'PUT', body }),
  getUsers: () => apiResponse<UserResponse[]>('/api/yatt-admin/users'),
  addStaff: (body: StaffCreateRequest) =>
    apiResponse<number>('/api/yatt-admin/add-staff', { method: 'POST', body }),
  createKassa: (body: KassaCreateRequest) =>
    apiResponse<number>('/api/yatt-admin/kassa', { method: 'POST', body }),
  getKassa: (filter: KassaFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<KassaResponse>>(
      withQuery('/api/yatt-admin/kassa', { ...filter, page, size }),
    ),
  getKassaById: (id: number) => apiResponse<KassaResponse>(`/api/yatt-admin/kassa/${id}`),
  updateKassa: (id: number, body: KassaCreateRequest) =>
    apiResponse<boolean>(`/api/yatt-admin/kassa/${id}`, { method: 'PUT', body }),
  deleteKassa: (id: number) =>
    apiResponse<boolean>(`/api/yatt-admin/kassa/${id}`, { method: 'DELETE' }),
  downloadKassaExcel: (filter: KassaFilter = {}) =>
    downloadFile(withQuery('/api/yatt-admin/kassa-excel', filter), 'kassa.xlsx'),
  createProductTransaction: (body: ProductTransactionRequest) =>
    apiResponse<number>('/api/yatt-admin/product-transaction', { method: 'POST', body }),
  getProductTransactions: (filter: ProductTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<ProductTransactionResponse>>(
      withQuery('/api/yatt-admin/product-transactions', { ...filter, page, size }),
    ),
  getProductTransactionById: (id: number) =>
    apiResponse<ProductTransactionResponse>(`/api/yatt-admin/product-transaction/${id}`),
  updateProductTransaction: (id: number, body: ProductTransactionRequest) =>
    apiResponse<boolean>(`/api/yatt-admin/product-transaction/${id}`, { method: 'PUT', body }),
  deleteProductTransaction: (id: number) =>
    apiResponse<boolean>(`/api/yatt-admin/product-transaction/${id}`, { method: 'DELETE' }),
  downloadProductTransactionsExcel: (filter: ProductTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/yatt-admin/product-transactions/excel', filter),
      'product_transactions.xlsx',
    ),
  createMoneyTransaction: (body: MoneyTransactionRequest) =>
    apiResponse<number>('/api/yatt-admin/money-transaction', { method: 'POST', body }),
  getMoneyTransactions: (filter: MoneyTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<MoneyTransactionResponse>>(
      withQuery('/api/yatt-admin/money-transactions', { ...filter, page, size }),
    ),
  getMoneyTransactionById: (id: number) =>
    apiResponse<MoneyTransactionResponse>(`/api/yatt-admin/money-transaction/${id}`),
  updateMoneyTransaction: (id: number, body: MoneyTransactionRequest) =>
    apiResponse<boolean>(`/api/yatt-admin/money-transaction/${id}`, { method: 'PUT', body }),
  deleteMoneyTransaction: (id: number) =>
    apiResponse<boolean>(`/api/yatt-admin/money-transaction/${id}`, { method: 'DELETE' }),
  downloadMoneyTransactionsExcel: (filter: MoneyTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/yatt-admin/money-transactions/excel', filter),
      'money_transactions.xlsx',
    ),
  getDebits: (filter: DebitFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<DebitResponse>>(
      withQuery('/api/yatt-admin/debits', { ...filter, page, size }),
    ),
  downloadDebitsExcel: (filter: DebitFilter = {}) =>
    downloadFile(withQuery('/api/yatt-admin/debits/excel', filter), 'debits.xlsx'),
}

export const smallSellerApi = {
  getProfile: () => apiResponse<UserProfileResponse>('/api/small-seller/profile'),
  updateProfile: (body: { fullName: string; username: string }) =>
    apiResponse<boolean>('/api/small-seller/profile', { method: 'PUT', body }),
  updatePassword: (body: { oldPassword: string; newPassword: string }) =>
    apiResponse<boolean>('/api/small-seller/password', { method: 'PUT', body }),
  getUsers: () => apiResponse<UserResponse[]>('/api/small-seller/users'),
  createKassa: (body: KassaCreateRequest) =>
    apiResponse<number>('/api/small-seller/kassa', { method: 'POST', body }),
  getKassa: (filter: KassaFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<KassaResponse>>(
      withQuery('/api/small-seller/kassa', { ...filter, page, size }),
    ),
  getKassaById: (id: number) => apiResponse<KassaResponse>(`/api/small-seller/kassa/${id}`),
  updateKassa: (id: number, body: KassaCreateRequest) =>
    apiResponse<number>(`/api/small-seller/kassa/${id}`, { method: 'PUT', body }),
  downloadKassaExcel: (filter: KassaFilter = {}) =>
    downloadFile(withQuery('/api/small-seller/kassa-excel', filter), 'kassa.xlsx'),
  createProductTransaction: (body: ProductTransactionRequest) =>
    apiResponse<number>('/api/small-seller/product-transaction', { method: 'POST', body }),
  getProductTransactions: (filter: ProductTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<ProductTransactionResponse>>(
      withQuery('/api/small-seller/product-transactions', { ...filter, page, size }),
    ),
  getProductTransactionById: (id: number) =>
    apiResponse<ProductTransactionResponse>(`/api/small-seller/product-transaction/${id}`),
  updateProductTransaction: (id: number, body: ProductTransactionRequest) =>
    apiResponse<number>(`/api/small-seller/product-transaction/${id}`, { method: 'PUT', body }),
  downloadProductTransactionsExcel: (filter: ProductTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/small-seller/product-transactions/excel', filter),
      'product_transactions.xlsx',
    ),
  createMoneyTransaction: (body: MoneyTransactionRequest) =>
    apiResponse<number>('/api/small-seller/money-transaction', { method: 'POST', body }),
  getMoneyTransactions: (filter: MoneyTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<MoneyTransactionResponse>>(
      withQuery('/api/small-seller/money-transactions', { ...filter, page, size }),
    ),
  getMoneyTransactionById: (id: number) =>
    apiResponse<MoneyTransactionResponse>(`/api/small-seller/money-transaction/${id}`),
  updateMoneyTransaction: (id: number, body: MoneyTransactionRequest) =>
    apiResponse<number>(`/api/small-seller/money-transaction/${id}`, { method: 'PUT', body }),
  downloadMoneyTransactionsExcel: (filter: MoneyTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/small-seller/money-transactions/excel', filter),
      'money_transactions.xlsx',
    ),
}

export const bigSellerApi = {
  getProfile: () => apiResponse<UserProfileResponse>('/api/big-seller/profile'),
  updateProfile: (body: { fullName: string; username: string }) =>
    apiResponse<boolean>('/api/big-seller/profile', { method: 'PUT', body }),
  updatePassword: (body: { oldPassword: string; newPassword: string }) =>
    apiResponse<boolean>('/api/big-seller/password', { method: 'PUT', body }),
  getUsers: () => apiResponse<UserResponse[]>('/api/big-seller/users'),
  createProductTransaction: (body: ProductTransactionRequest) =>
    apiResponse<number>('/api/big-seller/product-transaction', { method: 'POST', body }),
  getProductTransactions: (filter: ProductTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<ProductTransactionResponse>>(
      withQuery('/api/big-seller/product-transactions', { ...filter, page, size }),
    ),
  getProductTransactionById: (id: number) =>
    apiResponse<ProductTransactionResponse>(`/api/big-seller/product-transaction/${id}`),
  updateProductTransaction: (id: number, body: ProductTransactionRequest) =>
    apiResponse<number>(`/api/big-seller/product-transaction/${id}`, { method: 'PUT', body }),
  deleteProductTransaction: (id: number) =>
    apiResponse<boolean>(`/api/big-seller/product-transaction/${id}`, { method: 'DELETE' }),
  deleteProduct: (productTransactionId: number, productId: number) =>
    apiResponse<boolean>(
      withQuery('/api/big-seller/product', { productTransactionId, productId }),
      { method: 'DELETE' },
    ),
  downloadProductTransactionsExcel: (filter: ProductTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/big-seller/product-transactions/excel', filter),
      'product_transactions.xlsx',
    ),
  getMoneyTransactions: (filter: MoneyTransactionFilter = {}, page = 0, size = 20) =>
    apiResponse<PageResponse<MoneyTransactionResponse>>(
      withQuery('/api/big-seller/money-transactions', { ...filter, page, size }),
    ),
  getMoneyTransactionById: (id: number) =>
    apiResponse<MoneyTransactionResponse>(`/api/big-seller/money-transaction/${id}`),
  updateMoneyTransaction: (id: number, body: MoneyTransactionRequest) =>
    apiResponse<number>(`/api/big-seller/money-transaction/${id}`, { method: 'PUT', body }),
  downloadMoneyTransactionsExcel: (filter: MoneyTransactionFilter = {}) =>
    downloadFile(
      withQuery('/api/big-seller/money-transactions/excel', filter),
      'money_transactions.xlsx',
    ),
  getDebits: (page = 0, size = 20) =>
    apiResponse<PageResponse<DebitResponse>>(withQuery('/api/big-seller/debits', { page, size })),
  downloadDebitsExcel: () => downloadFile('/api/big-seller/debits/excel', 'debits.xlsx'),
}
