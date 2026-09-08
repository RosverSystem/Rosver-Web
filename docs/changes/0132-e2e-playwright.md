# Cambio: Tests E2E de humo con Playwright (R07)

**Fecha:** 2026-09-08
**Tipo:** feature

## Qué cambió

Se agregó `@playwright/test` (dev dependency, Chromium instalado vía `npx playwright install chromium`) con `playwright.config.ts` en la raíz de `RosverSac/` y 9 tests de humo en `e2e/`:

- `e2e/public-pages.spec.ts`: Home carga con contenido real (no blanco), `/catalogo` carga, una URL sin match muestra `NotFoundPage` (no pantalla en blanco), un sub-path inválido de `/admin` también cae al 404 público.
- `e2e/auth.spec.ts`: login con credenciales inválidas muestra el mensaje de error genérico (sin romper la página), el link «¿Olvidaste tu clave?» lleva a `/recuperar`, `/admin` y `/cuenta` sin sesión redirigen a `/login`, el form de registro usa `noValidate` (sin bubble nativo del navegador, regla `10-form-toasts`).

Nuevo script `npm run test:e2e` (`playwright test`). El config levanta `dev:api` (`:8787`) y `dev` (`:5173`) él mismo si no están corriendo (`webServer` con dos entradas), y los reutiliza si ya están arriba (`reuseExistingServer`) — no requiere Docker ni un entorno de test aparte.

## Por qué

Recomendación R07 de la auditoría (0125): esta pasada de correcciones (0125-0131) tocó exactamente las rutas más frágiles encontradas en la auditoría (login, registro, 404, rutas protegidas) — sin un test automatizado, un cambio futuro en cualquiera de esos archivos puede reintroducir el mismo bug sin que nadie lo note hasta producción.

## Cómo

- Alcance deliberadamente acotado a **smoke tests** (que la app no se rompa, no un flujo E2E completo con registro real + OTP + checkout): un suite completo de journeys de negocio es un proyecto aparte, más caro de mantener, y no es lo que pedía la recomendación ("regresión auth").
- No se probaron flujos que requieren leer el correo/OTP real (registro completo, recuperación de contraseña completa) porque en modo consola el código OTP sale por `console.log` del servidor, no accesible desde un test de navegador sin instrumentación adicional — quedó fuera de este alcance por simplicidad, se puede sumar después si se decide invertir en cobertura E2E más profunda.
- Los tests no crean ni tocan datos reales: solo navegan páginas públicas y prueban login con un correo que no existe / contraseña incorrecta — corren de forma segura contra la misma Postgres real del `.env` sin dejar residuos.
- Se agregó `test-results/`, `playwright-report/`, `blob-report/` y `playwright/.cache/` a `.gitignore` (no existían ahí antes).

## Archivos

- `RosverSac/playwright.config.ts` (nuevo)
- `RosverSac/e2e/public-pages.spec.ts` (nuevo)
- `RosverSac/e2e/auth.spec.ts` (nuevo)
- `RosverSac/package.json` (`@playwright/test` + script `test:e2e`)
- `RosverSac/.gitignore` (artefactos de Playwright)
- `docs/architecture/04-stack-y-librerias.md` (nueva devDependency documentada)
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

```bash
cd RosverSac
npm run test:e2e
```

- [x] `npx playwright install chromium` instalado correctamente en este entorno.
- [x] `npm run test:e2e`: 9/9 tests pasan, corridos dos veces seguidas (sin flakiness observada).
- [x] Los tests reutilizan los dev servers ya corriendo (`dev`/`dev:api`) sin necesidad de reiniciarlos.
- [x] `npm run build` / `npm run typecheck:server` / `npm run lint` siguen sin errores tras el cambio.
