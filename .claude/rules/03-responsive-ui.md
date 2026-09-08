# Responsive obligatorio (móvil / tablet / desktop)

**Toda** UI, animación, sección, layout, componente, tipografía, espaciado, menú, modal, formulario o patrón visual se diseña y verifica para **tres breakpoints**:

| Viewport | Guía aprox. | Enfoque |
| --- | --- | --- |
| **Móvil** | &lt; 768px | Primero: touch, una columna, menús colapsables |
| **Tablet** | 768px – 1023px | Intermedio: no “desktop encogido” ni “móvil estirado” |
| **Desktop / PC** | ≥ 1024px | Densidad y hover; no romper lo ya pensado en móvil |

## Reglas

- No entregar solo desktop. Si algo “se ve bien en PC”, debe funcionar también en móvil y tablet.
- Animaciones: respetar `prefers-reduced-motion`; en móvil evitar efectos pesados o que rompan el layout.
- Touch: targets ≥ ~44px; no depender solo de hover.
- Tipografía e imágenes: escalables; sin overflow horizontal.
- Probar mentalmente (y en DevTools) los tres anchos antes de cerrar la tarea.
- En `docs/changes/` del cambio UI, incluir checklist de verificación móvil + tablet + desktop.

## Anti-patrones

- Navbar / hero / grids solo pensados para widescreen.
- Modales o drawers que no caben en móvil.
- Texto o tablas que fuerzan scroll horizontal.
