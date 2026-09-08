import { expect, test } from '@playwright/test'

test('home carga con contenido real, sin pantalla en blanco', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Explora por categoría')).toBeVisible()
  await expect(page.locator('body')).not.toBeEmpty()
})

test('catálogo carga sin romper', async ({ page }) => {
  await page.goto('/catalogo')
  await expect(page).toHaveURL(/\/catalogo/)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('una URL sin match muestra la página 404, no una pantalla en blanco', async ({ page }) => {
  await page.goto('/esta-ruta-no-existe-nunca')
  await expect(page.getByText('Página no encontrada')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ir al inicio' })).toBeVisible()
})

test('un sub-path inválido de /admin también cae al 404 público (no queda en blanco)', async ({
  page,
}) => {
  await page.goto('/admin/esto-no-existe')
  await expect(page.getByText('Página no encontrada')).toBeVisible()
})
