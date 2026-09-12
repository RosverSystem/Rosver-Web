# Cambio: FAQ contacto estilo Rosver + GSAP

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- FAQ rediseñado: acordeón numerado (01…), borde ink grueso, sombra offset roja, toggle +/×.
- Animación de apertura/cierre con **GSAP** (`height` + opacity); entrada escalonada de ítems.
- Respeta `prefers-reduced-motion`.

## Por qué

Pedido de Rosa: parecido a la referencia visual, con estilo Rosver y GSAP.

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`

## Cómo verificar

- [ ] `/contacto` FAQ con números y sombra roja
- [ ] Abrir/cerrar con animación suave
- [ ] Reduced motion: sin tween (estado instantáneo)
- [ ] _(UI)_ Móvil / tablet / desktop
