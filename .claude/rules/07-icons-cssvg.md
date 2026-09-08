# Iconos — cssvg-icons (obligatorio)

Catálogo: [icon.cssvg.com](https://icon.cssvg.com) · npm `cssvg-icons`.

## Regla

Iconos de UI **nuevos** → **`cssvg-icons`**. No usar Lucide ni SVG sueltos para UI genérica nueva.

```tsx
import { Bell, ArrowRight, Heart } from 'cssvg-icons'
import { withIconControls } from 'cssvg-icons'

const HeartHover = withIconControls(Heart)

<Bell size={24} color="currentColor" strokeWidth={2} />
<HeartHover hoverToAnimate />
```

## Rendimiento

- Preferir `hoverToAnimate` en listados; evitar docenas de SMIL en loop.
- Con `prefers-reduced-motion`: `animated={false}`.

## Excepciones

- Marca/redes/dominio en `shared/ui/icons.tsx`.
- Lucide existente: no migrar en masa; nuevo código → cssvg.

Ver `docs/architecture/04-stack-y-librerias.md`.
