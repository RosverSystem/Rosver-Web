import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      // Evita F5/HMR cuando la API escribe SQL/data/logs bajo server/
      ignored: [
        '**/server/data/**',
        '**/server/sql/**',
        '**/server/**/*.log',
        '**/.env',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
