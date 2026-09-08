---
name: document-change
description: Registrar un cambio cerrado en docs/changes con la plantilla obligatoria. Usar al terminar cualquier implementación, fix, refactor o tarea de docs.
---

# document-change

Toda tarea cerrada deja un archivo en `docs/changes/`.

## Pasos

1. **Siguiente número:** revisar `docs/changes/` y usar el siguiente `NNNN` (4 dígitos). Ej.: si existe `0001-...`, el siguiente es `0002-...`.

2. **Copiar plantilla:** `docs/templates/cambio.md` → `docs/changes/NNNN-slug.md`.
   - `slug`: kebab-case, descriptivo (ej. `0002-auth-login-page`).

3. **Completar campos:**
   - **Qué cambió** — hechos, no intenciones.
   - **Por qué** — problema o decisión.
   - **Cómo** — enfoque y trade-offs breves.
   - **Archivos** — rutas reales tocadas.
   - **Cómo verificar** — checklist que alguien pueda ejecutar (si UI: móvil + tablet + desktop).

4. **Docs relacionados** (si aplica):
   - Feature nueva o alcance → `docs/features/<nombre>.md` + índice.
   - Arquitectura → `docs/architecture/`.

## Estilo

- Español.
- Concreto, sin relleno.
- Verificación con checkboxes `- [ ]`.

## No cerrar sin

- [ ] Archivo en `docs/changes/NNNN-slug.md`
- [ ] Features/architecture actualizados si el cambio lo requiere
- [ ] Si hay UI: verificación móvil + tablet + desktop en el checklist
- [ ] Contexto legible para Claude Code / Cursor sin depender del chat
