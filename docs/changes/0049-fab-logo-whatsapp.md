# Cambio: FAB WhatsApp con logo oficial

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `WhatsAppFloatingButton` usa `IconWhatsApp` (logo marca) en vez de `MessageCircle` de Lucide.
- Fondo `#25D366`; ícono blanco vía `currentColor`.
- `IconWhatsApp` pasó de fill fijo verde a `currentColor` (funciona en botones verdes con texto blanco).

## Archivos

- `RosverSac/src/shared/ui/whatsapp-floating-button.tsx`
- `RosverSac/src/shared/ui/icons.tsx`
- `docs/changes/0049-fab-logo-whatsapp.md`

## Cómo verificar

- [ ] Botón flotante muestra el logo de WhatsApp (no burbuja genérica)
- [ ] Contraste blanco sobre verde OK
- [ ] Click abre el link de WhatsApp
- [ ] Móvil / tablet / desktop OK
