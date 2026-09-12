# Feature: Contacto / leads

**Slug:** `features/contact/`  
**Estado:** activa (API + email)

## Propósito

Canal de contacto (formulario + WhatsApp) que genera leads para comercial.

## Alcance

- `/contacto`, CTAs globales.
- Persistencia: tabla `contact_messages`.
- Confirmación por correo al cliente.

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/contacto` | `ContactPage` | Hero + panel ink/form |

## API

| Método | Path | Notas |
| --- | --- | --- |
| `POST` | `/api/contact` | Público; guarda lead + email confirmación |

WhatsApp del panel: número fijo `51980202591`, mensaje `CONTACT_WHATSAPP_MESSAGE`.

## Verificación

- [x] Formulario → Postgres + toast
- [x] Email de confirmación (SMTP)
- [x] WhatsApp prearmado fijo 980
- [ ] Bandeja admin de leads (ver pendientes)
