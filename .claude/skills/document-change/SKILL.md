---
name: document-change
description: Registrar un cambio cerrado en docs/changes con la plantilla obligatoria. Usar al terminar cualquier implementación, fix, refactor o tarea de docs. Es el puente de contexto entre Claude Code y Cursor.
---

# document-change

Toda tarea cerrada deja un archivo en `docs/changes/`.  
Ese archivo es el **contexto** para el otro agente (Cursor ↔ Claude Code).

## Pasos

1. **Siguiente número:** revisar `docs/changes/` y usar el siguiente `NNNN` (4 dígitos).

2. **Copiar plantilla:** `docs/templates/cambio.md` → `docs/changes/NNNN-slug.md`.

3. **Completar campos:**
   - **Qué cambió** — hechos, no intenciones.
   - **Por qué** — problema o decisión.
   - **Cómo** — enfoque y trade-offs breves.
   - **Archivos** — rutas reales tocadas.
   - **Cómo verificar** — checklist ejecutable.
   - Si hay UI: incluir checks **móvil**, **tablet** y **desktop**.

4. **Docs relacionados** (si aplica):
   - Feature nueva o alcance → `docs/features/<nombre>.md` + índice.
   - Arquitectura → `docs/architecture/`.
   - Flujos de lógica → `docs/logica-y-flujos/`.
   - Deudas / ideas → `docs/pendientes/PENDIENTES.md` y `RECOMENDACIONES.md` (regla `12`).
   - Esquema DB → `RosverSac/server/sql/NNN_*.sql` en el mismo cambio (regla `15`).

## Estilo

- Español.
- Concreto, sin relleno.
- Verificación con checkboxes `- [ ]`.

## No cerrar sin

- [ ] Archivo en `docs/changes/NNNN-slug.md`
- [ ] Features/architecture/logica-y-flujos actualizados si el cambio lo requiere
- [ ] `docs/pendientes/` actualizado (qué quedó o qué se cerró)
- [ ] Si hubo cambio de datos: migración SQL numerada aplicada/documentada (regla `15`)
- [ ] Si hay UI: verificación móvil + tablet + desktop en el checklist
- [ ] Contexto legible para el otro agente sin el chat
- [ ] Push `main` + deploy Railway (regla `11`)
