# Cambio: SEO básico, botón flotante de WhatsApp, lucide-react y scroll suave (Lenis)

**Fecha:** 2026-09-04
**Tipo:** feature

## Qué cambió

- **SEO básico** en `index.html`: `<title>` y `<meta description>` reales, Open Graph + Twitter Card, `theme-color`, `canonical`. Nuevos `public/robots.txt` (bloquea `/admin` y `/cuenta`) y `public/sitemap.xml` con las rutas públicas actuales.
- **Botón flotante de WhatsApp** (`shared/ui/whatsapp-floating-button.tsx`): fijo abajo-derecha en todas las páginas públicas (montado en `PublicLayout` de `App.tsx`), con animación solo por interacción (`hover:scale-110` + rotación del ícono), sin loop/pulso.
- **`lucide-react`** instalado como librería de íconos de UI general (ver decisión de usuario). El set propio (`shared/ui/icons.tsx`) se mantiene para íconos de marca/dominio ya construidos; no se migró nada existente.
- **`lenis`** instalado para scroll con inercia. `app/providers/SmoothScroll.tsx` sincroniza el `raf` de Lenis con `gsap.ticker` y llama `ScrollTrigger.update()` en cada scroll, para no romper los reveals/contadores/campaña que ya usan `ScrollTrigger`. Se desactiva completo si `prefers-reduced-motion` está activo.
- Constantes de contacto centralizadas en `shared/lib/contact.ts` (`WHATSAPP_NUMBER`, `WHATSAPP_DISPLAY`, `WHATSAPP_LINK`).
- `Footer.tsx`: se quitó el label de debug ("Footer — red de seguridad...") que quedó de la fase wireframe, el enlace de WhatsApp ahora es real (`wa.me`) y el footer pasó a fondo oscuro (`bg-rosver-ink`) con copyright.

## Por qué

El usuario pidió explícitamente SEO básico + integraciones razonables para la fase actual (sin backend/credenciales reales todavía — se descartó Analytics/GTM/Maps por falta de IDs), y una forma de conseguir "íconos animados" para la página. Se ofrecieron 3 vías para los íconos (SVG propios, que el usuario baje archivos de Flaticon, o instalar una librería); el usuario eligió instalar `lucide-react`. El scroll suave (Lenis) se agregó a pedido explícito del usuario en un mensaje posterior de esta misma tarea ("quiero que trabajes scroll motion... animación al bajar"), interpretado como Lenis por ser la librería estándar para ese efecto y por encajar con el pedido de "librería de rendimiento" (Lenis se documenta a sí misma como smooth-scroll performante).

## Cómo

- No se pudo automatizar la descarga de íconos de Flaticon (requiere cuenta/atribución); se documentó la limitación y se resolvió con la alternativa que el usuario aprobó.
- Lenis se integra al ticker de GSAP en vez de tener su propio `requestAnimationFrame`, siguiendo la integración oficial recomendada con `ScrollTrigger`, para que el carrusel/campaña navideña y los reveals sigan funcionando igual.
- Todo lo agregado respeta `prefers-reduced-motion` y el principio de "animación solo por interacción" del proyecto (`06-performance.md`).

## Archivos

- `RosverSac/index.html`
- `RosverSac/public/robots.txt` (nuevo)
- `RosverSac/public/sitemap.xml` (nuevo)
- `RosverSac/src/shared/lib/contact.ts` (nuevo)
- `RosverSac/src/shared/lib/index.ts`
- `RosverSac/src/shared/ui/whatsapp-floating-button.tsx` (nuevo)
- `RosverSac/src/app/providers/SmoothScroll.tsx` (nuevo)
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/Footer.tsx`
- `RosverSac/package.json` (`lucide-react`, `lenis`)
- `docs/architecture/04-stack-y-librerias.md`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] Botón de WhatsApp visible y funcional en Home, catálogo, producto, carrito, contacto y cotizar; abre `wa.me` en pestaña nueva.
- [x] `http://localhost:5173/robots.txt` y `/sitemap.xml` sirven contenido correcto.
- [x] Scroll con inercia activo en Home; los reveals (`ScrollReveal`), el contador de `TrustBar` y el carrusel/campaña navideña con `ScrollTrigger` siguen disparando correctamente al hacer scroll.
- [x] Sin errores de consola en pestaña limpia (los "Invalid hook call" vistos durante la edición fueron HMR obsoleto, no reproducibles en carga fresca).
- [x] _(UI)_ Verificado en viewport reducido (~529px); botón flotante no tapa contenido interactivo clave.
