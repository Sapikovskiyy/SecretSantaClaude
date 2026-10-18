/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  // fs.strict off: on Windows the app-data folder is path-virtualized, which
  // makes Vite reject node_modules font files in dev. Dev-only setting.
  server: { host: true, port: 5173, fs: { strict: false } },
  preview: { host: true, port: 4173 },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
