# Playbook — cómo trabajamos este proyecto

Guía para **replicar la misma estructura, documentación y reglas** en otro repo o para onboarding. Resume el sistema usado en **Proyectos Personales / Workspace**.

---

## 1. Idea central

1. **Código por feature** (módulos aislados), no por tipo de archivo mezclado.
2. **Cada tarea deja un registro** en `docs/changes/`.
3. **Reglas y skills de Cursor** obligan al agente a seguir el mismo flujo.
4. **Docs en español**, concretas, sin relleno.

Si solo cambias el nombre de carpetas (`App/` en vez de `Workspace/`), el sistema sigue siendo el mismo.

---

## 2. Árbol del monorepo

```
Proyectos Personales/          ← raíz del workspace Cursor
  AGENTS.md                    ← resumen corto para el agente
  .cursor/
    rules/                     ← reglas siempre / por glob
    skills/                    ← create-feature, document-change
  docs/                        ← TODA la documentación de producto
    README.md
    architecture/
    features/
    changes/
    templates/
  Workspace/                   ← app de producto (React + API)
    src/
      app/
      features/
      shared/
      styles/
    server/                    ← API Express (si aplica)
    .agents/skills/            ← skills de stack (opcional)
```

| Qué | Dónde |
| --- | --- |
| Código UI / cliente | `Workspace/src/` |
| API / backend | `Workspace/server/` |
| Documentación | `docs/` (nunca solo en comentarios del código) |
| Reglas del agente | `.cursor/rules/` |
| Skills del agente | `.cursor/skills/` (+ stack en `Workspace/.agents/skills/`) |
| Secretos | `.env` / `.env.production` (gitignored) |

Alias de imports: `@` → `Workspace/src`  
Ejemplo: `import { AuthPage } from '@/features/auth'`.

---

## 3. Capas de `src/`

| Capa | Responsabilidad |
| --- | --- |
| `app/` | Shell: `App.jsx`, providers, hooks de ruta, montaje |
| `features/<nombre>/` | Un módulo de producto (UI + model + api + lib) |
| `shared/` | UI, hooks, lib **sin negocio de una sola feature** |
| `styles/` | CSS global, tokens, heroes |

### Reglas de dependencia

```
app/        → puede usar features (API pública) y shared
features/A  → solo shared + su propio código
features/A  ✗ no importa internos de features/B
shared/     ✗ no importa features
```

---

## 4. Anatomía de una feature

```
src/features/<nombre>/
  index.js    ← ÚNICO export público
  ui/         ← páginas, formularios, iconos de la feature
  model/      ← hooks, providers, estado
  api/        ← llamadas HTTP de esta feature
  lib/        ← helpers solo de esta feature
```

```js
// ✅ desde app u otra capa
import { LoginPage } from '@/features/auth';

// ❌ acoplamiento
import { mapUser } from '@/features/auth/api/mappers';
```

### Dónde poner código nuevo

| Pregunta | Destino |
| --- | --- |
| ¿Solo esta feature lo usa? | Dentro de la feature |
| ¿Dos+ features y sin negocio? | `shared/` |
| ¿Contexto global (sesión, theme)? | `app/providers` o model de la feature dueña |
| ¿Mezclar dos features en un archivo? | **No** — partir o subir a shared con cuidado |

### Nacer una feature

Usar skill **`create-feature`**:

1. Carpetas + `index.js`.
2. Ficha `docs/features/<nombre>.md` (plantilla).
3. Fila en `docs/features/README.md`.
4. Montar desde `app/` (no desde otra feature).
5. Documentar el cambio en `docs/changes/`.

---

## 5. Documentación (`docs/`)

| Carpeta | Para qué |
| --- | --- |
| `architecture/` | Cómo está armado el sistema |
| `features/` | Una ficha por módulo + `README.md` índice |
| `changes/` | Un archivo **por cada** cambio cerrado |
| `templates/` | Plantillas obligatorias |

### Flujo al terminar cualquier tarea

1. Implementar en `Workspace/`.
2. Copiar `docs/templates/cambio.md` → `docs/changes/NNNN-slug.md`.
3. `NNNN` = siguiente entero (4 dígitos). `slug` = kebab-case.
4. Si feature nueva / cambio de alcance → actualizar `docs/features/`.
5. Si cambió la forma de trabajar → actualizar `docs/architecture/`.

### Plantilla de cambio (obligatorio)

Campos mínimos:

- **Qué cambió** — hechos
- **Por qué** — problema o decisión
- **Cómo** — enfoque / trade-offs
- **Archivos** — rutas reales
- **Cómo verificar** — checklist ejecutable

Estilo: español, concreto, sin relleno.

Skill: **`document-change`**.

---

## 6. Reglas Cursor (`.cursor/rules/`)

Copiar la idea a proyectos nuevos. En este repo:

| Archivo | Rol |
| --- | --- |
| `00-workspace-core.mdc` | Features, skills, docs, alias `@` (`alwaysApply`) |
| `01-feature-modules.mdc` | Estructura de feature (`globs: features/**`) |
| `02-documentation.mdc` | Obligación de `docs/changes/` |
| `03-auth-pending.mdc` | Pendientes de auth (ejemplo de “no olvidar”) |
| `04-select-combobox.mdc` | Nunca `<select>` nativo → `@/shared/ui/Select` |
| `05-no-emojis-animated-icons.mdc` | Sin emojis en UI; SVG + CSS |
| `06-crud-confirm-dialogs.mdc` | Sin `window.confirm`; `ConfirmDialog` |

### UI que conviene codificar como regla

- **Select:** componente propio, no nativo del navegador.
- **Iconos:** SVG monocromo / acento de marca; animación sutil; respetar `prefers-reduced-motion`.
- **Confirmaciones CRUD:** `ConfirmDialog` / toast; nunca `alert`/`confirm` nativos.
- **Una feature por archivo** (no mezclar dos dominios).

`AGENTS.md` en la raíz = resumen corto (comandos + punteros a skills).

---

## 7. Skills del agente

| Skill | Cuándo |
| --- | --- |
| `create-feature` | Módulo / pantalla / feature nueva |
| `document-change` | Al cerrar cualquier implementación |

Ubicación tipica:

- Proceso de producto: `.cursor/skills/<nombre>/SKILL.md`
- Stack (build, test, deploy): `Workspace/.agents/skills/`

El agente debe **leer la skill antes** de implementar, no improvisar el flujo.

---

## 8. Comandos habituales (este producto)

```bash
cd Workspace
npm run dev        # UI (ej. :3000)
npm run dev:api    # API (ej. :4000)
npm run db:migrate
npm run test
npm run build
npm run format
npm start          # producción: Express sirve dist/ + /api
```

- `.env` local / `.env.production` Hostinger → **no** a Git.
- Deploy documentado en `Workspace/DEPLOY.md` cuando aplique.

---

## 9. Checklist: nuevo proyecto con el mismo sistema

### Carpetas

- [ ] `docs/{architecture,features,changes,templates}/`
- [ ] `docs/templates/cambio.md` y `feature.md`
- [ ] `docs/README.md` + `docs/features/README.md`
- [ ] `docs/architecture/00-overview.md` + `01-modulos-feature.md`
- [ ] App: `src/{app,features,shared,styles}/`
- [ ] `.cursor/rules/` (core + documentation + features mínimo)
- [ ] `.cursor/skills/create-feature` y `document-change`
- [ ] `AGENTS.md` en la raíz

### Convención diaria

- [ ] Trabajar **una feature** por tarea
- [ ] Imports solo por API pública `@/features/<nombre>`
- [ ] Al terminar → `docs/changes/NNNN-slug.md`
- [ ] Feature nueva → ficha + fila en índice
- [ ] Secretos fuera de Git

### Primer cambio

1. `docs/changes/0001-inicializar-estructura-modular.md`
2. Primera feature con skill `create-feature`

---

## 10. Anti-patrones (evitar)

| Evitar | Preferir |
| --- | --- |
| Importar `features/a/api/foo` desde `features/b` | Solo `@/features/a` |
| Meter lógica de dos features en un JSX | Archivos / features separados |
| Cerrar PR/tarea sin `docs/changes/` | Skill `document-change` |
| Documentar solo en Discord/chat | Archivo en `docs/` |
| `<select>` / `window.confirm` / emojis en UI | Componentes shared + SVG |
| Commitear `.env` | `.env.example` + panel de hosting |

---

## 11. Mapa rápido “¿dónde lo pongo?”

```
¿Es pantalla o dominio de producto?
  → features/<nombre>/

¿Es botón, input, dialog genérico?
  → shared/ui/

¿Es helper sin negocio (cn, session, apiBase)?
  → shared/lib/

¿Es routing / providers globales?
  → app/

¿Es decisión o cambio ya hecho?
  → docs/changes/ (+ features/architecture si aplica)
```

---

## 12. Referencias en este repo

- `AGENTS.md`
- `docs/README.md`
- `docs/architecture/00-overview.md`
- `docs/architecture/01-modulos-feature.md`
- `.cursor/rules/*.mdc`
- `.cursor/skills/create-feature/SKILL.md`
- `.cursor/skills/document-change/SKILL.md`
- `Workspace/DEPLOY.md` (hosting Node / Express)

Este playbook es la **fuente para clonar el método de trabajo**. Ajusta nombres de carpetas y stack, mantén feature + docs + rules + skills.
