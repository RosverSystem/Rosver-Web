# Cambio: banner área cliente en Mi cuenta

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.6  

## Qué cambió

- Banner de marca en `/cuenta` con el texto **Área cliente / Mi cuenta / Hola, {nombre}**, avatar y CTAs.
- Fondo ink + acentos rojo + patrón CSS (sin bitmap pesado).
- Perfil: cabecera de datos más clara bajo el banner.

## Archivos

- `features/account/ui/AccountLayout.tsx`
- `features/account/ui/AccountProfilePage.tsx`

## Cómo verificar

- [ ] `/cuenta` muestra banner oscuro con saludo
- [ ] Avatar y “Editar perfil” visibles
- [ ] Tabs debajo del banner
- [ ] Móvil / tablet / desktop OK
