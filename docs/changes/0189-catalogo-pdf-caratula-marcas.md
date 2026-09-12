# Cambio: Catálogo PDF — carátula + banda de marcas

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- La carátula general `public/CatalagoPDF/Caratula.pdf` vuelve a anteponerse al PDF (ruta corregida a `RosverSac/public/...`).
- Si no se puede leer la carátula, la API falla con error claro (ya no genera PDF sin portada en silencio).
- En portadas de categoría, el chip suelto “BOSCH” (y otras marcas) pasa a una banda titulada **Marcas en esta categoría** con grilla de chips.
- Portada de categoría rellenada a A4 (hero + marcas + pie) y título lateral con wrap menos agresivo.

## Por qué

La ruta `sacRoot` apuntaba a `server/` en lugar de `RosverSac/`, así que no encontraba `Caratula.pdf`. En la UI del PDF, un solo chip de marca en un área blanca vacía parecía un fallo (“Bosch no sale completo”).

## Cómo

- `catalog-pdf-render.ts`: `path.resolve(here, '../../..')` + `ignoreEncryption` + log `Carátula OK`.
- `catalog-pdf-html.ts`: bloque de marcas con título/grilla; CSS de `.category-cover` / `.brands` a altura A4.

## Archivos

- `RosverSac/server/src/lib/catalog-pdf-render.ts`
- `RosverSac/server/src/lib/catalog-pdf-html.ts`
- `docs/changes/0189-catalogo-pdf-caratula-marcas.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] API en `:8787`; FAB catálogo o `GET http://127.0.0.1:8787/api/catalog/pdf`
- [ ] Primera página = carátula Rosver (`Caratula.pdf`)
- [ ] Segunda página ≈ portada categoría (hero rojo + lista + banda de marcas, sin vacío enorme)
- [ ] Log API: `[catalog-pdf] Carátula OK (1 pág.)`
- [ ] _(PDF)_ Se abre bien en visor local (A4)
