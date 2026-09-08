# 0008 — Navbar: campos consolidados + scrollbar de marca

**Fecha:** 2026-08-27
**Tipo:** fix

## Qué cambió

- `PublicNavbar`: se detectó que la lista de categorías del dropdown estaba **hardcodeada y desincronizada** de las categorías reales del catálogo (`Herramientas, Repuestos, Equipos` vs. `Herramientas, Ferretería, Electrónica, Hogar, Textil`). Ahora el navbar importa `CATEGORIES` desde `@/features/catalog` (fuente única) en vez de mantener su propia copia.
- Nav items: se quitó "Tienda" (duplicaba "Productos", ambos apuntaban a `/catalogo`); quedan `Inicio`, `Catálogo`, `Contacto`.
- Se agregó un botón **"Cotizar"** (CTA primario, rojo) en las acciones del navbar de escritorio y como botón destacado en el menú móvil — antes el único acceso a cotizar dependía de otras páginas, no del header persistente.
- Menú móvil: ya no duplica "Contacto" (venía embebido a mano además de `NAV_ITEMS`); las categorías ahora enlazan a `/catalogo/:slug` real en vez de a un `link` hardcodeado.
- `global.css`: scrollbar de marca (delgado, `rosver-line`/`rosver-muted`, transparente en el track) para reemplazar el scrollbar gris por defecto del navegador, vía `scrollbar-width`/`scrollbar-color` (Firefox) y `::-webkit-scrollbar*` (Chrome/Edge).

## Por qué

El usuario pidió revisar qué campos van en el navbar y notó el scrollbar por defecto del navegador. Al revisar el código encontré que el navbar tenía datos de categorías propios, ya desincronizados de `features/catalog/model/mocks.ts` (creado en el cambio anterior) — bug real, no solo estético. Se optó por estilizar el scrollbar (opción reversible y con mejor accesibilidad) en vez de ocultarlo por completo.

## Cómo

- `CATEGORIES` se consume desde `@/features/catalog` (API pública de la feature), nunca desde `features/catalog/model/mocks.ts` directamente — respeta la regla de no importar internos de otra feature.
- El botón "Cotizar" apunta a `/cotizar` (ruta ya existente).

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/styles/global.css`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [ ] El dropdown "Categorías" del navbar muestra las mismas 5 categorías que `/catalogo`
- [ ] El botón "Cotizar" (rojo) es visible en el navbar de escritorio y lleva a `/cotizar`
- [ ] En móvil, el menú hamburguesa muestra "Cotizar ahora" como botón destacado
- [ ] El scrollbar vertical de la página se ve delgado y en tonos de marca, no el gris por defecto
