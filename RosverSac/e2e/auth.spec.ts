import { expect, test } from '@playwright/test'

test('login con credenciales inválidas muestra error, no rompe la página', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Correo').fill('no-existe-nunca@rosversac.internal')
  await page.getByPlaceholder('Contraseña').fill('clave-incorrecta-123')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.getByText(/correo o contraseña incorrectos/i)).toBeVisible()
})

test('el link "olvidaste tu clave" lleva a /recuperar', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: /olvidaste tu clave/i }).click()
  await expect(page).toHaveURL(/\/recuperar/)
})

test('/admin sin sesión redirige a /login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})

test('/cuenta sin sesión redirige a /login', async ({ page }) => {
  await page.goto('/cuenta')
  await expect(page).toHaveURL(/\/login/)
})

test('registro exige los campos obligatorios sin bubble nativo del navegador', async ({
  page,
}) => {
  await page.goto('/registro')
  const form = page.locator('form').first()
  await expect(form).toHaveAttribute('novalidate', '')
})
