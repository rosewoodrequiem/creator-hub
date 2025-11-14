import react from '@vitejs/plugin-react'
import { fileURLToPath,URL } from 'node:url'
import { defineConfig } from 'vite'

const uiKitPath = fileURLToPath(
  new URL('../../packages/ui-kit/src', import.meta.url),
)

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@creator-hub/ui-kit': uiKitPath,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'dexie', 'dexie-react-hooks'],
  },
})
