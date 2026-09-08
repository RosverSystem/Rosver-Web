---
description: Documentar pendientes y recomendaciones tras cada pedido del usuario
alwaysApply: true
---

# Pendientes y recomendaciones (obligatorio)

Tras **cada pedido** del usuario (feature, fix, deploy, docs), el agente debe actualizar el registro vivo de lo que quedó incompleto y qué conviene añadir después.

## Dónde

| Documento | Uso |
| --- | --- |
| `docs/pendientes/PENDIENTES.md` | Deudas abiertas: no hecho, bloqueado, parcial |
| `docs/pendientes/RECOMENDACIONES.md` | Mejoras / siguientes pasos sugeridos (no pedidos aún) |
| `docs/pendientes/README.md` | Cómo usar esta carpeta |

## Obligatorio al cerrar (o al dejar trabajo a medias)

1. Añadir o actualizar filas en `PENDIENTES.md` con: ítem, origen (pedido del usuario), estado, bloqueo si hay.
2. Si hay ideas útiles no pedidas → fila en `RECOMENDACIONES.md` (sin implementarlas solas).
3. Si un pendiente se completa → marcarlo hecho o moverlo a `docs/changes/` vía change y quitarlo de pendientes.
4. Mencionar en el change `docs/changes/NNNN-*.md` si se tocó la lista de pendientes.

## Paridad

Misma regla en `.cursor/rules/12-pendientes-recomendaciones.mdc`.

## Anti-patrones

- Cerrar un chat dejando “falta Google / SMTP / X” solo en la respuesta y no en `PENDIENTES.md`.
- Inventar pendientes irrelevantes; solo lo del pedido actual o bloqueos reales.
