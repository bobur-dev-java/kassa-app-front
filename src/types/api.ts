export type HttpApiResponse<T> = {
  status: number
  success?: boolean
  message?: string
  data?: T
}

export type YattResponse = {
  id: number
  name: string
}

export type LoginRequest = {
  username: string
  password: string
}

export type TelegramLoginRequest = {
  initData: string
}

export type TelegramConnectResponse = {
  botLink: string
}

export type LoginYattRes = {
  id?: number
  yattId?: number
  name: string
  role: YaTTUserRole | string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  activeYattId?: number
  yattRes?: LoginYattRes[]
  role?: YaTTUserRole
}

export type AuthClaims = {
  userId?: number
  role?: YaTTUserRole | string
  yattId?: number
  tokenType?: 'access' | 'refresh' | string
  sub?: string
  exp?: number
  iat?: number
}

export type AccessTokenRequest = {
  refreshToken: string
}

export type YattCreateRequest = {
  name: string
}

export type UserCreateRequest = {
  fullName: string
  username: string
  password: string
  role: YaTTUserRole
}

export type YaTTUserRole = 'ADMIN' | 'YATT_ADMIN' | 'SMALL_SELLER' | 'BIG_SELLER'

export type SystemInfoResponse = {
  userCount: number
  yattCount: number
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type UserProfileResponse = {
  id: number
  fullName: string
  username: string
  role: string
}

export type UserResponse = {
  id: number
  fullName: string
  username: string
}

export type StaffCreateRequest = {
  fullName: string
  username: string
  password: string
  role: YaTTUserRole
}

export type KassaCreateRequest = {
  ownerId: number
  terminal: number
  card: number
  cash: number
  comment: string
  kassaDate: string
}

export type KassaResponse = {
  id: number
  ownerName: string
  ownerId: number
  terminal: number
  card: number
  cash: number
  totaAmount: number
  kassaDate: string
  comment: string
  isCompleted: boolean
}

export type KassaFilter = {
  ownerId?: number | null
  from?: string
  to?: string
  isCompleted?: boolean | null
}

export type ProductRequest = {
  price: number
  name: string
  quantity: number
}

export type ProductTransactionRequest = {
  fromUserId: number
  toUserId: number
  transactionDate: string
  products: ProductRequest[]
}

export type ProductResponse = ProductRequest & {
  id: number
}

export type ProductTransactionResponse = {
  id: number
  fromUserFullName: string
  fromUserId: number
  toUserFullName: string
  toUserId: number
  transactionDate: string
  totalPrice: number
  isCompleted: boolean
  products: ProductResponse[]
}

export type ProductTransactionFilter = {
  fromUserId?: number | null
  toUserId?: number | null
  from?: string
  to?: string
  isCompleted?: boolean | null
}

export type MoneyType = 'CASH' | 'TERMINAL' | 'CARD'

export type MoneyTransactionRequest = {
  fromUserId: number
  toUserId: number
  transactionDate: string
  amount: number
  moneyType: MoneyType
}

export type MoneyTransactionResponse = {
  id: number
  fromUserFullName: string
  fromUserId: number
  toUserFullName: string
  toUserId: number
  transactionDate: string
  amount: number
  moneyType: string
  isCompleted: boolean
}

export type MoneyTransactionFilter = {
  fromUserId?: number | null
  toUserId?: number | null
  moneyType?: MoneyType | ''
  from?: string
  to?: string
  isCompleted?: boolean | null
}

export type DebitResponse = {
  fromUserId: number
  fromUserFullName?: string
  nonActive: number
  activeAmount: number
}

export type DebitFilter = {
  fromUserId?: number | null
}
