# Cambio: toasts animados globales + éxito en cada acción

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Toasts con **Motion**: entrada desde la derecha (spring), salida con `AnimatePresence`, icono con pop, barra de progreso.
- Tamaño compacto (~280px, tipografía `text-xs`, padding reducido).
- `ToastProvider` en `App` → un solo stack global (`z-[120]`); iconos SVG nítidos (check / error / aviso).
- Éxito con toast en: perfil, contacto, cotizar, login, registro, reset password, carrito (card / ficha / oferta / quitar), marcas, categorías, unidades, usuarios, productos, ofertas, listado de precios, media picker, PDF/WhatsApp pedido.

## Por qué

El perfil mostraba texto verde inline; faltaba feedback flotante en muchos guardados/borrados. Se pedía animación y cobertura en toda acción.

## Cómo

- `FloatingToasts` + `FloatingToastsHost` + `ToastProvider`
- `useFormToasts` reusa el contexto global si existe
- Instancias locales de `<FloatingToasts />` se omiten cuando hay provider (sin duplicar)

## Archivos

- `RosverSac/src/shared/ui/floating-toasts.tsx`
- `RosverSac/src/shared/ui/toast-provider.tsx`
- `RosverSac/src/shared/ui/toast-context.ts`
- `RosverSac/src/shared/hooks/use-form-toasts.ts`
- `RosverSac/src/app/App.tsx`
- Perfil, contacto, cotizar, login, catalog cards, admin CRUD (marcas/cats/unidades/users/products/offers/precios)
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Guardar perfil → toast verde animado “Perfil actualizado.”
- [ ] Agregar al carrito desde catálogo → toast
- [ ] Admin: crear/editar/eliminar marca → toast
- [ ] Contacto / cotizar → toast de éxito
- [ ] Toast entra desde la derecha y sale al cerrar o a los ~4.5 s
- [ ] Móvil / tablet / desktop: toast legible arriba a la derecha (móvil centrado)
- [ ] `prefers-reduced-motion`: sin spring agresivo
