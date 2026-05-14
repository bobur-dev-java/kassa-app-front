import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isJwtExpired } from '@/services/api'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/yatt-admin',
      name: 'yatt-admin',
      component: () => import('@/views/YattAdminView.vue'),
      meta: { requiresAuth: true, roles: ['YATT_ADMIN'] },
    },
    {
      path: '/small-seller',
      name: 'small-seller',
      component: () => import('@/views/SmallSellerView.vue'),
      meta: { requiresAuth: true, roles: ['SMALL_SELLER'] },
    },
    {
      path: '/big-seller',
      name: 'big-seller',
      component: () => import('@/views/BigSellerView.vue'),
      meta: { requiresAuth: true, roles: ['BIG_SELLER'] },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const roles = to.meta.roles as string[] | undefined
  const hasExpiredAccessToken = auth.isAuthenticated && isJwtExpired(auth.accessToken)
  const hasTelegramLoginPayload = to.meta.guestOnly && hasTelegramInitData()

  if ((to.meta.requiresAuth || to.meta.guestOnly) && (!auth.isAuthenticated || hasExpiredAccessToken)) {
    const refreshed = await auth.refreshAccessToken().catch(() => null)

    if (to.meta.requiresAuth && !refreshed) {
      auth.logout()
      return { name: 'login' }
    }
  }

  if (roles?.length && !auth.role) {
    return { name: 'login' }
  }

  if (roles?.length && auth.role && !roles.includes(auth.role)) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated && !hasTelegramLoginPayload) {
    return { name: getHomeRouteName(auth.role) }
  }

  return true
})

function hasTelegramInitData() {
  if (window.Telegram?.WebApp?.initData) {
    return true
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  return Boolean(hashParams.get('tgWebAppData') || searchParams.get('tgWebAppData'))
}

export function getHomeRouteName(role: string | null) {
  if (role === 'YATT_ADMIN') {
    return 'yatt-admin'
  }

  if (role === 'SMALL_SELLER') {
    return 'small-seller'
  }

  if (role === 'BIG_SELLER') {
    return 'big-seller'
  }

  return 'admin'
}

export default router
