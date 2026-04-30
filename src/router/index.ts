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

  if (to.meta.requiresAuth && (!auth.isAuthenticated || isJwtExpired(auth.accessToken))) {
    const refreshed = await auth.refreshAccessToken().catch(() => null)

    if (!refreshed) {
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

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: getHomeRouteName(auth.role) }
  }

  return true
})

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
