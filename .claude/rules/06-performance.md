# Rendimiento — página rápida

Toda implementación (UI, animaciones, imágenes, rutas, mocks) debe **priorizar velocidad percibida y real**. No entregar “bonito pero pesado”.

## Objetivos

- Primera pintura rápida; interacción usable cuanto antes.
- Scroll fluido en **móvil**, tablet y desktop.
- Bundles y assets lo más livianos posibles sin romper el diseño.

## Reglas prácticas

### Imágenes y media
- Preferir formatos modernos (WebP/AVIF cuando se pueda); evitar PNG/JPG enormes en el critical path.
- Usar tamaño adecuado al viewport (no servir un logo 4K para un header de 40px).
- `loading="lazy"` en imágenes below-the-fold; logo/hero critical pueden ir eager.
- Definir `width`/`height` o aspect-ratio para reducir CLS.

### JS / React
- No instalar librerías pesadas si basta con CSS o un primitivo en `shared/`.
- Lazy-load de rutas/páginas pesadas (`React.lazy` + `Suspense`) cuando el módulo no sea del shell inicial.
- Evitar re-renders innecesarios; no meter `useMemo`/`useCallback` por defecto — solo si hay costo medible.
- Listas largas: paginar / virtualizar en fase lógica; en visual no renderizar cientos de nodos de demo.

### CSS / animaciones
- Preferir `transform` / `opacity` para animar; evitar animar `width`/`height`/`top` en scroll continuo si se puede.
- Respetar `prefers-reduced-motion`.
- En móvil: menos partículas, menos blur pesado, menos listeners de scroll sin throttle/`useScroll` de Motion bien acotado.
- GSAP/Motion: matar tweens/ScrollTriggers al desmontar; no duplicar instancias.

### Red y build
- Code-splitting natural de Vite; no importar un icon pack completo por 2 iconos (seguir SVG locales).
- Fuentes: solo pesos usados; `display=swap` / preconnect ya en `index.html`.
- No bloquear el hilo principal con trabajo pesado en el mount del App.

### Checklist al cerrar UI
En `docs/changes/`, si aplica:
- [ ] No hay assets obviamente sobredimensionados en el critical path
- [ ] Animaciones aceptables en móvil (sin jank evidente)
- [ ] No se añadió dependencia pesada sin justificarla en `04-stack-y-librerias.md`
- [ ] Si se añadió lib de **optimización**, está justificada en el change

## Anti-patrones

- Hero con vídeo autoplay sin compresión / sin poster.
- Importar GSAP + Motion + tres libs de UI “por si acaso”.
- Carruseles infinitos con docenas de imágenes full-res.
- Console.log / mocks gigantes en producción.

## Optimización (permiso)

Se pueden usar **skills y librerías de optimización** cuando ayuden a cargar más rápido. Documentar en `04-stack-y-librerias.md` + `docs/changes/`. Ver `08-assets-optimizacion`.
