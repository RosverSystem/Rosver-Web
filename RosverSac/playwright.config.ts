import { defineConfig, devices } from '@playwright/test'

/**
 * E2E de humo (Chromium): flujos públicos + auth críticos.
 * Levanta el dev server de Vite y el API propios (no requiere Docker ni
 * servicios externos); usa la misma Postgres real del `.env` del proyecto,
 * así que los tests no deben crear/dejar datos permanentes — solo leer
 * páginas públicas y probar rutas de auth con credenciales inválidas
 * o inexistentes (sin tocar cuentas reales).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      url: 'http://localhost:8787/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
