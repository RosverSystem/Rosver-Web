---
description: Paleta oficial Rosver — única fuente de color de marca en UI
alwaysApply: true
---

# Paleta de colores Rosver (obligatoria)

Guía de marca. **No inventar** hex de marca ni usar paletas genéricas (purple, cream terracotta, etc.).

## Tokens (`RosverSac/src/styles/global.css` → `@theme`)

| Token | Hex | Uso |
| --- | --- | --- |
| `rosver-red` | `#E30613` | CTA primario, acentos de marca, nav roja |
| `rosver-red-dark` | `#90040D` | Hover del rojo |
| `rosver-ink` | `#0D0D0D` | Texto principal, fondos oscuros, botones secundarios sólidos |
| `rosver-blue` | `#1E3A5F` | Confianza / B2B / paneles industriales (no sustituir al rojo como CTA 1°) |
| `rosver-muted` | `#6B7280` | Texto secundario, iconos quietos |
| `rosver-line` | `#E5E7EB` | Bordes, divisores |
| `rosver-soft` | `#F3F4F6` | Fondos de sección / inputs suaves |
| `rosver-surface` | `#FFFFFF` | Superficie / cards |
| `rosver-yellow` | `#F2B705` | Badges de oferta / promo |
| `rosver-success` | `#10B981` | Stock / éxito / estados positivos |

Clases Tailwind: `bg-rosver-red`, `text-rosver-ink`, `border-rosver-line`, `bg-rosver-yellow`, `text-rosver-success`, `bg-rosver-blue`, etc.

## Distribución (referencia visual)

Rojo y negro mandan; azul industrial como apoyo; gris/gris claro para estructura; amarillo y verde solo en badges/estados (poco volumen).

## Botones

- **Primario:** `bg-rosver-red text-white hover:bg-rosver-red-dark`
- **Secundario outline:** `border border-rosver-red text-rosver-red bg-transparent`
- **Oscuro / carrito:** `bg-rosver-ink text-white hover:bg-rosver-red` (o hover `rosver-blue` en contextos B2B)

## Badges

- Oferta / promo → `bg-rosver-yellow text-rosver-ink`
- En stock / éxito → `bg-rosver-success text-white`
- Destacado → `bg-rosver-ink text-white` o `bg-rosver-blue text-white`

## Excepciones

| Caso | Color |
| --- | --- |
| WhatsApp CTA | Verde WhatsApp `#25D366` (marca de plataforma) |
| Logos redes con color propio | Permitido en `shared/ui/icons.tsx` |

## Anti-patrones

- Hex sueltos de marca en componentes (`#e30613` hardcode) → usar token.
- Sustituir la paleta por temas AI (púrpura, cream, etc.).
- Usar amarillo/verde/azul como fondo de página completa.
- Más de un CTA primario rojo compitiendo en la misma zona sin jerarquía.

## Docs

Detalle en `docs/architecture/06-paleta-colores.md`. Al añadir color nuevo de marca: actualizar tokens + esta regla + espejo Cursor + change en `docs/changes/`.
