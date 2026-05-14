import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:8080'
  const devHost = env.VITE_DEV_HOST || '127.0.0.1'
  const allowedHosts = parseAllowedHosts(env.VITE_DEV_ALLOWED_HOSTS)
  const verifyProxyTls = env.VITE_API_PROXY_INSECURE_TLS !== 'true'

  return {
    plugins: [
      vue(),
      env.VITE_ENABLE_DEVTOOLS === 'true' ? vueDevTools() : null,
    ],
    server: {
      host: devHost,
      port: 5174,
      strictPort: true,
      allowedHosts,
      hmr: false,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: verifyProxyTls,
        },
      },
    },
    preview: {
      host: devHost,
      port: 4173,
      strictPort: true,
      allowedHosts,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})

function parseAllowedHosts(value?: string) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}
