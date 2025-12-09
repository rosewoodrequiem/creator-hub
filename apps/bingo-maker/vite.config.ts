import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, 'index.html'),
    },
  },
})
