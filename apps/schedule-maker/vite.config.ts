import react from '@vitejs/plugin-react'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const uiKitPath = fileURLToPath(
  new URL('../../packages/ui-kit/src', import.meta.url),
)

export default defineConfig({
  // Use a relative base so the app works when hosted from a subfolder (e.g. GitHub Pages)
  base: './',
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
