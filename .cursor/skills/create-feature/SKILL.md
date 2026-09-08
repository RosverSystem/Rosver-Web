---
name: create-feature
description: Crear un módulo feature nuevo con carpetas, export público, ficha en docs y registro de cambio. Usar cuando se pida una pantalla, dominio o feature nueva.
---

# create-feature

Leer esta skill **antes** de implementar una feature nueva.

## Checklist

### 1. Estructura en código

Crear en `RosverSac/src/features/<nombre>/`:

```
index.ts
ui/
model/
api/
lib/
```

- `index.ts` es el **único** export público.
- Tipos TypeScript en la capa que corresponda (model/ o junto al componente).

Ejemplo mínimo de `index.ts`:

```ts
export { ExamplePage } from './ui/ExamplePage'
```

### 2. Montaje en app

- Importar **solo** desde `@/features/<nombre>` en `app/` (routing, layout, providers).
- No montar una feature desde otra feature.

### 3. Documentación de feature

1. Copiar `docs/templates/feature.md` → `docs/features/<nombre>.md`.
2. Completar propósito, alcance, API pública y verificación.
3. Añadir fila en `docs/features/README.md`.

### 4. Registro de cambio

Al cerrar, usar skill **document-change** → `docs/changes/NNNN-<nombre>-feature.md`.

### 5. Convenciones

- Nombre de carpeta: kebab-case o camelCase consistente (preferir kebab-case).
- Una feature = un dominio de producto.
- Si algo es genérico y reutilizable → `shared/`, no duplicar en la feature.
- UI responsive: móvil, tablet y desktop desde el primer mock.

## Anti-patrones

- Exportar desde subcarpetas (`api/`, `lib/`) directamente al resto del app.
- Mezclar lógica de dos features en un mismo archivo.
- Olvidar ficha en `docs/features/`.
- Diseñar solo para desktop.
