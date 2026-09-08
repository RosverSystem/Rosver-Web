# 0006 — Estructura de información y captación de clientes

**Fecha:** 2026-08-27
**Tipo:** docs

## Qué cambió

- Nuevo documento `docs/architecture/05-estructura-informacion-y-captacion.md`: guía de jerarquía de contenido, CTAs y touchpoints de captación, pensada sobre las rutas y flujos ya definidos en `02` y `03`.
- Define: temperatura del visitante (frío/tibio/caliente/cliente), orden de bloques de Home orientado a conversión, jerarquía de contenido en listado/ficha/carrito/contacto/cotizar, mapa de CTAs primario/secundario por pantalla, qué debe editar `admin-content`, y un orden de construcción priorizado (Contacto/Cotizar sube al puesto 2, antes que el carrito completo).
- `docs/README.md` y `docs/architecture/00-overview.md` actualizados para enlazar el nuevo documento.

## Por qué

El usuario pidió organizar la información del sitio para "distribuir y captar al cliente con facilidad". Los docs `02`/`03` ya cubren rutas y flujos técnicos pero no explicaban cómo priorizar contenido/CTAs dentro de cada pantalla para bajar la fricción de contacto/cotización. Esta ficha cierra ese vacío sin duplicar ni contradecir lo ya documentado.

## Cómo

- No se tocó código (aún no hay features implementadas más allá del `PublicNavbar`, ver `0003`).
- Documento nuevo en `architecture/` (no en `features/`) porque cruza varias features (`catalog`, `contact`, `quotes`, `admin-content`).
- Se referencian las secciones F2–F4 de `03-vistas-y-flujos.md` en vez de redefinir flujos.

## Archivos

- `docs/architecture/05-estructura-informacion-y-captacion.md`
- `docs/README.md`
- `docs/architecture/00-overview.md`

## Cómo verificar

- [ ] Abrir `docs/architecture/05-estructura-informacion-y-captacion.md` y confirmar que enlaza correctamente a `02`, `03` y las fichas de `features/`
- [ ] `docs/README.md` lista el nuevo doc como paso 4 antes de `features/README.md`
- [ ] Al construir Home/ficha/carrito/contacto, usar este documento como checklist de orden de bloques y CTAs
