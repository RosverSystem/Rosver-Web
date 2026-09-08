# 0001 — Inicializar estructura modular

**Fecha:** 2026-08-26  
**Tipo:** chore

## Qué cambió

- Proyecto React + TypeScript (Vite) en `Workspace/`.
- Estructura por capas: `app/`, `features/`, `shared/`, `styles/`.
- Alias `@` → `Workspace/src`.
- Documentación en `docs/` (architecture, features, changes, templates).
- Reglas y skills de Cursor en `.cursor/`.
- `AGENTS.md` en la raíz.

## Por qué

Arrancar RosverSac con el mismo método de trabajo del playbook: features aisladas, registro de cambios y guía para el agente.

## Cómo

- Scaffold con Vite `react-ts`.
- Shell mínimo en `app/App.tsx` (sin features ni demo).
- Sin backend en esta fase; se añade `server/` cuando haga falta.

## Archivos

- `Workspace/` — app cliente
- `docs/` — documentación de producto
- `.cursor/rules/` — reglas del agente
- `.cursor/skills/` — create-feature, document-change
- `AGENTS.md`

## Cómo verificar

- [ ] `cd Workspace && npm install && npm run dev` — app vacía en el navegador
- [ ] `npm run build` — compila sin errores
- [ ] Existe `docs/changes/0001-inicializar-estructura-modular.md`
- [ ] Alias `@/app/App` resuelve en TypeScript y Vite
