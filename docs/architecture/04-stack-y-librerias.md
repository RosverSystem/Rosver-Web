# Stack y librerías — RosverSac

Fuente de verdad de **qué usamos y para qué**. Actualizar este archivo al añadir o quitar dependencias en `RosverSac/package.json`.  
Versiones exactas → `package.json` / `package-lock.json`.

App: `RosverSac/` · Alias: `@` → `RosverSac/src`

---

## Resumen

| Área | Librería | Notas |
| --- | --- | --- |
| UI | React 19 + React DOM | Componentes, hooks |
| Tipado / build | TypeScript + Vite 8 | `npm run dev` / `build` |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) | Tokens en `src/styles/global.css` |
| Animación (UI/layout) | Motion (`motion`) | Import: `motion/react` (ex Framer Motion) |
| Animación (scroll / timelines) | GSAP (`gsap`, `@gsap/react`) | `ScrollTrigger` para reveals al hacer scroll |
| Rutas | `react-router-dom` v7 | BrowserRouter, Link, Routes |
| Class names | `clsx` + `tailwind-merge` | Helper `cn()` en `@/shared/lib` |
| Validación UI | `FloatingToasts` + `useFormToasts` (shared) | Sin bubbles nativos; regla `10-form-toasts` |
| API auth | Hono (`RosverSac/server`) | Sesiones cookie, RBAC, OTP, TOTP, Google OAuth |
| DB | `pg` + Postgres Railway | Migraciones SQL en `server/sql/` |
| Caché | `ioredis` + Redis Railway | Destacados home (`rosver:catalog:featured:v1`, TTL 90s); opcional |
| Object storage | `@aws-sdk/client-s3` → Cloudflare R2 | Avatares / media (`/api/profile/avatar`, `/api/media`) |
| Password | `argon2` | argon2id |
| Mail | `nodemailer` | SMTP Hostinger |
| 2FA | `otplib` + `qrcode` | TOTP autenticador |
| Validación API | `zod` | Schemas en server |
| PDF cotización | `jspdf` | Cotización estilo factura (carrito → Continuar pedido) |
| Iconos (UI general) | **`cssvg-icons`** | Obligatorio para iconos UI nuevos — [icon.cssvg.com](https://icon.cssvg.com) |
| Iconos (legado / marca) | `shared/ui/icons.tsx`, `lucide-react` (solo código ya existente) | No usar Lucide en código nuevo |

| Scroll suave | `lenis` | Inercia de scroll sincronizada con GSAP ScrollTrigger |
| Lint | Oxlint | `npm run lint` |

**No usamos (por ahora):** Next.js, shadcn CLI como runtime, CSS Modules como sistema principal, Redux/Zustand, React Query, axios (fase visual con mocks).

Patrones visuales tipo **Aceternity UI** se **reimplementan** en el repo (primitivos propios), no se instala el paquete Aceternity como dependencia.

---

## Dependencias de producción

### `react` / `react-dom` (^19)

- Base de la UI.
- Preferir componentes función + hooks.
- Entry: `src/main.tsx` → `app/App.tsx`.

### `react-router-dom` (^7)

- Navegación SPA.
- Uso típico: `BrowserRouter`, `Routes`, `Route`, `Link`, `useLocation`, `useNavigate`.
- Rutas de producto: ver `docs/architecture/03-vistas-y-flujos.md`.

### `motion` (^13)

- Animaciones (navbar resizable, menús, presencia).
- **Import correcto:** `import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react'`
- Respetar `prefers-reduced-motion` (ya hay base en `global.css`).
- No abusar en móvil: animaciones ligeras.

### `gsap` + `@gsap/react` (^3 / ^2)

- **Cuándo usar GSAP vs. Motion:** Motion es el default para animación de componentes React (layout, `AnimatePresence`, hover/estado — ej. `PublicNavbar`). GSAP es para lo que Motion no cubre bien: reveals disparados por scroll (`ScrollTrigger`) y timelines secuenciados complejos. No usar ambos para el mismo elemento.
- Setup centralizado en `shared/lib/gsap.ts` — registra `ScrollTrigger` y `SplitText` una sola vez (`gsap.registerPlugin`) y exporta el helper `prefersReducedMotion()`. Importar `gsap`/`ScrollTrigger`/`SplitText`/`prefersReducedMotion` siempre desde ahí, nunca directo de `'gsap'` en cada componente.
- Uso en componentes: hook `useGSAP` de `@gsap/react` con `{ scope: ref }` — maneja el cleanup (revert) automáticamente, incluida la doble invocación de efectos de `StrictMode`. Si el efecto crea algo que GSAP no revierte solo (ej. una instancia de `SplitText`, o un side-effect fuera de GSAP como `document.body.style`), devolver una función de cleanup manual desde el callback.
- `SplitText` (gratis desde 2025, incluido en el paquete `gsap` sin licencia aparte): para reveals de texto palabra por palabra. Con `{ type: 'words', mask: 'words' }` cada palabra queda envuelta en una máscara con `overflow: clip` — ideal para animar `yPercent`/`opacity` sin que se vea el corte. Pone automáticamente `aria-label` con el texto original en el elemento padre y `aria-hidden` en los fragmentos — no requiere trabajo extra de accesibilidad. Ejemplo: `features/catalog/ui/Hero.tsx`.
- Primitivo reutilizable: `shared/ui/scroll-reveal.tsx` (`<ScrollReveal>`) — envuelve una sección y la anima al entrar en viewport (`opacity`/`y`, `once: true`). Respeta `prefers-reduced-motion`.
- Contadores animados: `features/catalog/ui/TrustBar.tsx` — anima un objeto JS (`{ val: 0 }`) hasta el valor real y actualiza el texto en `onUpdate`, dentro del mismo timeline que revela el bloque (`ScrollTrigger`, `once: true`). No usar un plugin aparte para esto; un tween simple alcanza.
- Ejemplo de uso general: `features/catalog/ui/HomePage.tsx` — los bloques debajo de Confianza usan `<ScrollReveal>` con `delay` incremental para un stagger sutil.

### `cssvg-icons` (obligatorio para UI nueva)

- Librería de iconos SVG animados (SMIL): [icon.cssvg.com](https://icon.cssvg.com).
- **Import:** `import { Bell, ArrowRight } from 'cssvg-icons'`
- Control: `withIconControls(Icon)` → props `animated`, `hoverToAnimate`.
- Preferir `hoverToAnimate` en grids/listados; respetar `prefers-reduced-motion` (`animated={false}`).
- Regla Cursor/Claude: `.cursor/rules/07-icons-cssvg.mdc` / `.claude/rules/07-icons-cssvg.md`.
- **Excepciones:** logos/redes con color de marca y set de dominio en `shared/ui/icons.tsx`. No instalar otra lib de iconos.

### `lucide-react` (legado)

- Queda en el proyecto por usos existentes. **Código nuevo** debe usar `cssvg-icons`, no Lucide.
- No migrar en masa solo por la regla.

### `lenis`

- Scroll suave con inercia. Se monta una única vez en `app/providers/SmoothScroll.tsx` y se renderiza en `App.tsx` (dentro de `BrowserRouter`, antes de las `Routes`).
- **Integración con GSAP:** el `raf` de Lenis corre dentro de `gsap.ticker` (no `requestAnimationFrame` propio) y cada evento `scroll` de Lenis llama a `ScrollTrigger.update()`. Así los reveals (`ScrollReveal`), los contadores de `TrustBar` y el carrusel/campaña navideña con `ScrollTrigger` siguen sincronizados con la posición real de scroll.
- Respeta `prefers-reduced-motion`: si está activo, `SmoothScroll` no crea la instancia de Lenis y el navegador usa scroll nativo.
- No usar `useScroll`/`useMotionValueEvent` de Motion para leer la posición global de scroll mientras Lenis esté activo (el scroll ya no es 1:1 con el nativo) — para eso, escuchar el evento `scroll` de la instancia de Lenis o usar `ScrollTrigger`.

### `clsx` + `tailwind-merge`

- Combinar clases Tailwind sin conflictos.
- API del proyecto:

```ts
import { cn } from '@/shared/lib'
cn('px-2 py-1', condition && 'bg-rosver-red')
```

Implementación: `RosverSac/src/shared/lib/cn.ts`.

---

## DevDependencies

| Paquete | Para qué |
| --- | --- |
| `vite` | Dev server + build |
| `@vitejs/plugin-react` | JSX / Fast Refresh |
| `typescript` | Tipado estricto; `tsc -b` en build |
| `tailwindcss` + `@tailwindcss/vite` | Utilidades CSS; plugin en `vite.config.ts` |
| `oxlint` | Lint rápido (`npm run lint`) |
| `@types/react`, `@types/react-dom`, `@types/node` | Tipos |

---

## Tailwind CSS v4 — convenciones

- Entrada: `@import 'tailwindcss'` en `src/styles/global.css`.
- Tokens de marca en `@theme` (ver `docs/architecture/06-paleta-colores.md`).
- Clases: `text-rosver-red`, `bg-rosver-blue`, `bg-rosver-yellow`, `bg-rosver-success`, `font-display`, etc.
- Tipografías web: **Manrope** (UI) + **Oswald** (logo/display) vía Google Fonts en `index.html`.
- Breakpoints estándar Tailwind (`sm` / `md` / `lg`…); UI obligatoria en móvil / tablet / desktop.
- **Paleta obligatoria** — regla `09-paleta-colores` (Cursor/Claude).

Plugin Vite:

```ts
// vite.config.ts
plugins: [react(), tailwindcss()]
```

---

## Componentes / patrones UI propios

| Pieza | Ubicación | Origen / idea |
| --- | --- | --- |
| Resizable Navbar | `shared/ui/resizable-navbar/` | Patrón Aceternity (scroll → ancho, blur, sombra) |
| PublicNavbar Rosver | `app/layout/PublicNavbar.tsx` | Branding propio encima de los primitivos |
| Iconos SVG | `shared/ui/icons.tsx` | Sin librería de iconos por ahora |
| `cn` | `shared/lib/cn.ts` | Estándar shadcn-like |

Al copiar más patrones (Aceternity u otros): **adaptar al estilo Rosver**, dejar el primitivo en `shared/ui/`, y documentar aquí + `docs/changes/`.

---

## Fuentes y assets

| Qué | Dónde |
| --- | --- |
| Fuentes | Google Fonts en `RosverSac/index.html` |
| Favicon | `RosverSac/public/favicon.svg` |
| CSS global / tokens | `RosverSac/src/styles/global.css` |

---

## Variables de entorno

- Plantilla: `RosverSac/.env.example`
- Prefijo cliente Vite: `VITE_*`
- Nunca commitear `.env` con secretos.

---

## Rendimiento

Principio: **la página debe sentirse rápida** (móvil incluido). Detalle operativo en:

- Cursor: `.cursor/rules/06-performance.mdc`
- Claude Code: `.claude/rules/06-performance.md`

Al elegir librería (paso 1 arriba): preferir la opción más liviana que cumpla el diseño. Motion + GSAP ya están; no sumar otra lib de animación sin justificar peso.

---

### `qrcode` (^1)

- QR TOTP / también QR en PDF de cotización (`features/cart/lib/quote-pdf.ts`).

### `jspdf` (^3+)

- Generación cliente de PDF cotización (plantilla tipo factura) en «Continuar pedido».
- WhatsApp no admite adjunto por `wa.me`: se descarga el PDF y se abre el chat con resumen.

---

## Cómo añadir una librería nueva

1. Justificar (¿shared? ¿una feature? ¿**optimización de carga**?).
2. `cd RosverSac && npm install <pkg>` (o `-D`).
3. Actualizar **esta ficha** (tabla + uso).
4. `docs/changes/NNNN-slug.md`.
5. Si cambia la forma de trabajar → mencionar en `AGENTS.md` / `CLAUDE.md` si es core.

### Permiso de optimización (2026-09-07)

El equipo autoriza usar **tecnologías, skills y librerías** orientadas a optimizar (imágenes, lazy, compress, LCP, code-splitting) siempre que:

- Mejoren velocidad percibida o real.
- No hinchen el bundle “por si acaso”.
- Queden documentadas aquí + en `docs/changes/`.

Preferir primero CSS/SVG/APIs nativas del stack actual.

---

## Comandos

```bash
cd RosverSac
npm install
npm run dev       # :5173
npm run build
npm run lint
npm run preview   # build local
```
