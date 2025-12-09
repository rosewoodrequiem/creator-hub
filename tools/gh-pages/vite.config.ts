import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'

const configDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = path.resolve(configDir, '..', '..')
const root = configDir

export default defineConfig({
  root,
  base: './',
  plugins: [react()],
  build: {
    outDir: path.join(repoRoot, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.join(root, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
})
