# 0002 — Documentar producto catálogo y flujos

**Fecha:** 2026-08-27  
**Tipo:** docs

## Qué cambió

- Documento de producto: audiencias (visitante, cliente, admin, comercial), dos caras (catálogo + gestión), entidades y reglas de negocio previstas.
- Mapa de rutas, flujos F1–F8, wireframes lógicos y orden de construcción visual.
- Fichas borrador de 11 features en `docs/features/`.
- Actualización de overview y README de docs (ruta app = `RosverSac/`).

## Por qué

Definir el contexto del catálogo web de importaciones Rosver Sac y dejar documentada la lógica/flujos antes de implementar UI, para que el agente y el equipo sepan cómo deben funcionar las vistas cuando llegue la fase lógica.

## Cómo

- Solo documentación; sin código de producto.
- Fase visual primero con mocks; lógica después según `02` y `03`.
- Alcance acordado: contacto + cotización + carrito/pedido; roles público, cliente, admin y comercial.

## Archivos

- `docs/architecture/02-producto-rosver-sac.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/architecture/00-overview.md`
- `docs/features/*.md` + `docs/features/README.md`
- `docs/README.md`
- `AGENTS.md`

## Cómo verificar

- [ ] Leer `docs/architecture/02-producto-rosver-sac.md` y entender las dos caras del sistema
- [ ] En `03-vistas-y-flujos.md` existen rutas públicas, `/cuenta` y `/admin`
- [ ] `docs/features/README.md` lista las 11 features en estado borrador
- [ ] No se añadió lógica de negocio en `RosverSac/src` en este cambio
