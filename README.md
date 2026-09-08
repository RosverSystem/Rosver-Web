# Rosver-Web

Monorepo de la web de **Rosver SAC** (catálogo de importaciones + área cliente) y del backoffice **SystemRSV** (gestión / ERP ligero).

Repositorio: [github.com/RosverSystem/Rosver-Web](https://github.com/RosverSystem/Rosver-Web)

---

## Qué es

| Cara | Pestaña del navegador | Quién | Para qué |
| --- | --- | --- | --- |
| **Catálogo web** | `Rosver SAC` | Visitantes y clientes | Ver productos, ofertas, cotizar, carrito, contacto, cuenta |
| **Gestión (ERP)** | `SystemRSV` | Admin / comercial | Productos, categorías, leads, cotizaciones, pedidos, usuarios |

Misma app React (`RosverSac/`), dos zonas de rutas:

- Público / cliente: `/`, `/catalogo`, `/ofertas`, `/carrito`, `/cotizar`, `/contacto`, `/login`, `/registro`, `/cuenta/*`
- Gestión: `/admin/*`

---

## Fase actual

**Visual primero (mocks)** — pantallas, navegación y datos estáticos.  
**Lógica después** — API, auth real, persistencia.

No hay backend en este repo todavía. Los formularios validan en UI con toasts flotantes; el submit es mock (navegación o estado “enviado”).

---

## Stack

| Área | Tecnología |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS v4 |
| Rutas | React Router DOM |
| Animación | Motion (`motion/react`), GSAP |
| Iconos UI | [`cssvg-icons`](https://icon.cssvg.com) |
| Scroll | Lenis |

Detalle: [`docs/architecture/04-stack-y-librerias.md`](docs/architecture/04-stack-y-librerias.md).

---

## Requisitos

- Node.js 20+ (recomendado)
- npm

---

## Cómo correr

```bash
git clone https://github.com/RosverSystem/Rosver-Web.git
cd Rosver-Web/RosverSac
npm install
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173).

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Lint (Oxlint) |

---

## Estructura del repo

```
RosverWeb/
├── RosverSac/                 # App React (código)
│   ├── public/                # Assets estáticos (logos, heroes WebP, favicon)
│   └── src/
│       ├── app/               # Shell, layouts, routing, providers
│       ├── features/          # Módulos de producto (export solo vía index.ts)
│       ├── shared/            # UI / hooks / lib compartidos
│       └── styles/            # CSS global + tokens de marca
├── docs/                      # Documentación de producto y cambios
│   ├── architecture/          # Producto, vistas, stack, paleta…
│   ├── features/              # Ficha por feature
│   ├── changes/               # Historial de cambios (NNNN-slug.md)
│   └── templates/             # Plantillas de docs
├── .cursor/rules/             # Reglas para agentes Cursor
├── .claude/rules/             # Espejo para Claude Code
├── AGENTS.md                  # Resumen para agentes (Cursor)
├── CLAUDE.md                  # Resumen para Claude Code
└── playbook-como-trabajamos.md
```

**Alias:** `@` → `RosverSac/src`  
Ejemplo: `import { LoginPage } from '@/features/auth'`

### Capas

```
app/        → features (API pública) + shared
features/A  → shared + propio código
features/A  ✗  internos de features/B
shared/     ✗  features
```

---

## Features (módulos)

| Feature | Responsabilidad |
| --- | --- |
| `catalog` | Home, listado, ficha, ofertas |
| `cart` | Carrito → cotizar / pedir |
| `quotes` | Cotización pública + admin |
| `contact` | Contacto / WhatsApp / leads |
| `auth` | Login y registro (UI) |
| `account` | Área cliente |
| `admin-catalog` | CRUD productos / categorías |
| `admin-content` | Contenido de la web |
| `admin-leads` | Bandeja de leads |
| `admin-orders` | Pedidos |
| `admin-users` | Usuarios y roles |

Índice: [`docs/features/README.md`](docs/features/README.md).

---

## Rutas principales

### Público / marketing

| Ruta | Vista |
| --- | --- |
| `/` | Home |
| `/catalogo` | Catálogo |
| `/ofertas` | Ofertas |
| `/producto/:slug` | Ficha de producto |
| `/carrito` | Carrito |
| `/cotizar` | Solicitud de cotización |
| `/contacto` | Contacto |
| `/login` · `/registro` | Auth (pantalla completa) |

### Cliente

| Ruta | Vista |
| --- | --- |
| `/cuenta` | Resumen |
| `/cuenta/pedidos` | Pedidos |
| `/cuenta/cotizaciones` | Cotizaciones |
| `/cuenta/perfil` | Perfil |

### Gestión (SystemRSV)

| Ruta | Vista |
| --- | --- |
| `/admin` | Dashboard |
| `/admin/productos` | Productos |
| `/admin/categorias` | Categorías |
| `/admin/leads` | Leads |
| `/admin/cotizaciones` | Cotizaciones |
| `/admin/pedidos` | Pedidos |
| `/admin/usuarios` | Usuarios |

Mapa completo: [`docs/architecture/03-vistas-y-flujos.md`](docs/architecture/03-vistas-y-flujos.md).

---

## Marca y UI

- **Paleta:** tokens en `RosverSac/src/styles/global.css` — ver [`docs/architecture/06-paleta-colores.md`](docs/architecture/06-paleta-colores.md).
- **Responsive:** móvil / tablet / desktop en toda UI.
- **Iconos UI nuevos:** solo `cssvg-icons`.
- **Formularios:** validación con toasts flotantes (`FloatingToasts` + `useFormToasts`); sin bubbles nativos del browser.
- **Título de pestaña:** `Rosver SAC` (web) · `SystemRSV` (`/admin/*`).

---

## Documentación

| Doc | Contenido |
| --- | --- |
| [`docs/architecture/02-producto-rosver-sac.md`](docs/architecture/02-producto-rosver-sac.md) | Producto y audiencias |
| [`docs/architecture/03-vistas-y-flujos.md`](docs/architecture/03-vistas-y-flujos.md) | Rutas y flujos |
| [`docs/architecture/04-stack-y-librerias.md`](docs/architecture/04-stack-y-librerias.md) | Stack |
| [`docs/architecture/06-paleta-colores.md`](docs/architecture/06-paleta-colores.md) | Colores de marca |
| [`docs/changes/`](docs/changes/) | Historial de cambios cerrados |
| [`playbook-como-trabajamos.md`](playbook-como-trabajamos.md) | Cómo trabajamos en el repo |

Al cerrar una tarea se registra un archivo en `docs/changes/NNNN-slug.md` (plantilla en `docs/templates/cambio.md`).

---

## Agentes (Cursor / Claude Code)

El proyecto está pensado para trabajar con agentes de código con **paridad** de reglas:

- Cursor: `AGENTS.md` + `.cursor/rules/`
- Claude Code: `CLAUDE.md` + `.claude/rules/`

Reglas clave: módulos por feature, responsive, rendimiento, assets livianos, paleta oficial, toasts en forms, iconos cssvg.

---

## Convenciones rápidas

1. Feature nueva → skill `create-feature` + ficha en `docs/features/`.
2. Al cerrar trabajo → `docs/changes/NNNN-slug.md`.
3. Docs en **español**, concretas.
4. Secretos solo en `.env` (gitignored); nunca en el repo.
5. Fase visual: mocks alineados al dominio documentado; sin API real.

---

## Licencia / uso

Repositorio privado/organizacional de **RosverSystem**. Uso interno del producto Rosver SAC / SystemRSV.
