# Feature: Contacto / leads

**Slug:** `features/contact/`  
**Estado:** activa (diseño visual alineado a catálogo/ofertas)

## Propósito

Canal de contacto (formulario + WhatsApp) que genera leads para comercial.

## Alcance

- `/contacto`, CTAs globales.
- Admin: bandeja en `admin-leads` (puede compartir modelo).

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/contacto` | `ContactPage` | Hero + panel ink/form |

## Flujos

`03-vistas-y-flujos.md` → F2.

## Verificación

- [x] Formulario y estado éxito UI (`idle` → `sent`)
- [x] Botón WhatsApp con mensaje prearmado (`wa.me` con texto codificado)
- [x] Diseño final visual (panel único canales + form)
- [ ] Persistencia real de lead (fase lógica)
