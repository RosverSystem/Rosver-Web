# Cambio: Registro vista completa + ilustración

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `RegisterPage` a paridad con login: split full `dvh`, panel ilustración + formulario.
- Asset `public/register-hero-rosver.webp` (ilustración profesional Rosver).
- Formulario: nombre, correo, teléfono opcional, contraseña + confirmar (ver/ocultar), checkbox de contacto comercial, CTA Crear cuenta → `/cuenta`.
- Beneficios con checks, stubs Facebook/Google, link «Cotiza sin cuenta» → `/cotizar`, «Ingresar» → `/login`.
- Shell: `AuthLayout` (sin navbar/footer marketplace; chip ROSVER · Inicio).

## Por qué

El registro seguía en panel oscuro tipográfico; debía igualar la calidad visual del login full-bleed.

## Cómo

Mismo layout grid `lg:grid-cols-2` que `LoginPage`; inputs pill `rosver-soft`; ilustración solo en desktop (`hidden lg:block`). Fase visual: sin API ni sesión real.

## Archivos

- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/public/register-hero-rosver.webp`
- `docs/features/auth.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0076-registro-vista-completa.md`

## Cómo verificar

- [ ] `/registro` llena la pantalla; sin header/footer marketplace
- [ ] Desktop (≥1024px): ilustración izquierda + form derecha; franja roja izquierda
- [ ] Tablet (768–1023px): form usable; ilustración según breakpoint (`lg`)
- [ ] Móvil (&lt;768px): solo form; wordmark ROSVER visible; chip Inicio arriba
- [ ] Crear cuenta → `/cuenta`; Ingresar → `/login`; Cotiza sin cuenta → `/cotizar`
- [ ] Imagen carga en `/register-hero-rosver.webp`
- [ ] `prefers-reduced-motion`: sin animación de entrada pesada
