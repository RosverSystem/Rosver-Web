# Estructura de información y captación de clientes — RosverSac

Capa complementaria a [`02-producto-rosver-sac.md`](./02-producto-rosver-sac.md) y [`03-vistas-y-flujos.md`](./03-vistas-y-flujos.md).
Esos dos documentos definen **qué pantallas y flujos existen**. Este documento define **cómo se organiza y distribuye el contenido dentro de esas pantallas para que un visitante se convierta en lead o cliente con el menor esfuerzo posible**.

No agrega rutas nuevas. Es la guía de contenido/IA (information architecture) que usa quien construye Home, catálogo, ficha, contacto y cotizar.

---

## 1. Objetivo

Bajar la fricción entre "un visitante entra a la web" y "comercial recibe un contacto o cotización". Toda decisión de estructura de contenido se evalúa contra esta pregunta:

> ¿Esto acerca al visitante a contactar/cotizar, o lo aleja?

---

## 2. Temperatura del visitante (quién llega y qué necesita ver)

| Perfil | De dónde viene | Qué busca primero | Contenido prioritario |
| --- | --- | --- | --- |
| **Frío** | Buscador, redes, boca a boca | Entender qué vende Rosver y si es confiable | Home: propuesta de valor, categorías, prueba de confianza (rubros, años, clientes) |
| **Tibio** | Ya vio Home o llegó a una categoría | Comparar productos, ver precio/condiciones | Listado + filtros, ficha de producto clara |
| **Caliente** | Ya eligió producto(s) | Cotizar o preguntar rápido, sin registrarse | CTA Cotizar/WhatsApp visible sin fricción, sin exigir cuenta |
| **Cliente recurrente** | Ya compró o cotizó antes | Repetir pedido, ver historial | Login → `/cuenta`, precios de cliente |

Regla de diseño: **el 80% de las páginas públicas se diseñan para frío/tibio/caliente sin cuenta**. Exigir login antes de contactar o cotizar mata la conversión — por eso F2/F3 en `03-vistas-y-flujos.md` no requieren sesión.

---

## 3. Jerarquía de contenido por página

### Home (`/`) — la página que más se comparte y más tráfico frío recibe

Orden de bloques y su rol en la captación (afina el wireframe de `03-vistas-y-flujos.md §3`):

| # | Bloque | Rol en la captación |
| --- | --- | --- |
| 1 | Header (`PublicNavbar`) | Acceso permanente a buscar, categorías, carrito, cuenta — no debe tapar contenido |
| 2 | Hero | Responde en 3 segundos: qué importa Rosver + 1 CTA primario ("Ver catálogo" o "Cotizar ahora") |
| 3 | Prueba de confianza | Rubros/categorías que maneja, años en el mercado, clientes o volumen — reduce la desconfianza inicial de compra por importación |
| 4 | Categorías destacadas | Ruta rápida al listado filtrado; visitante frío rara vez usa buscador directo |
| 5 | Productos destacados | Ancla concreta ("esto se puede comprar aquí ya") con CTA a ficha |
| 6 | CTA contacto/cotizar (banda intermedia) | Segunda oportunidad de conversión para quien no llegó al footer |
| 7 | Footer | Datos de contacto, WhatsApp, redes, horario — red de seguridad para quien scrollea hasta el final |

**Regla:** nunca dejar el CTA de cotizar/contactar solo en el footer. Debe repetirse al menos 2 veces en Home (hero + banda intermedia) y estar siempre accesible en el header si el espacio lo permite.

### Listado catálogo (`/catalogo`, `/catalogo/:categorySlug`)

- Filtros visibles y simples (categoría, y luego lo que el dominio permita) — nunca ocultar filtros detrás de un clic extra en desktop.
- Cada card de producto lleva su propio micro-CTA ("Ver detalle" o precio/"Consultar"), no solo la imagen.
- Estado vacío de filtro debe sugerir alternativa (categorías relacionadas o botón a `/contacto`), no un callejón sin salida.

### Ficha de producto (`/producto/:slug`)

Orden pensado para decisión rápida:

1. Galería + nombre + categoría (contexto inmediato).
2. Precio o "Consultar" — nunca ocultar el precio sin dar una acción alternativa clara.
3. **Doble CTA siempre visible:** "Añadir al carrito" (compra) y "Cotizar" o "Consultar por WhatsApp" (para quien no quiere comprometerse a comprar todavía).
4. Descripción/specs debajo — información de soporte, no de primera vista.

Justificación: en importaciones, muchos visitantes quieren *cotizar cantidad/condición* antes de comprar. Si el único camino es "carrito → checkout", se pierde a ese visitante. Por eso la ficha ofrece salida a F3 (cotizar) sin pasar por el carrito.

### Carrito (`/carrito`)

- Camino dual explícito: **(A) Solicitar cotización** y **(B) Continuar pedido** con el mismo peso visual — no priorizar uno ocultando el otro.
- Si el visitante no tiene cuenta, no bloquear: dejar ir por (A) sin login (ver regla de negocio 3 en `02-producto-rosver-sac.md`).

### Contacto (`/contacto`) y Cotizar (`/cotizar`)

- Formulario corto primero (nombre, contacto, mensaje/ítems); campos opcionales después. Cada campo extra baja la tasa de envío.
- WhatsApp como atajo paralelo, no como reemplazo del formulario (el formulario deja registro en `admin-leads`/`quotes`; WhatsApp no).
- Confirmación visual clara post-envío (evita que el visitante reenvíe o dude si funcionó).

---

## 4. Mapa de puntos de captación (touchpoints)

Todo punto de la web pública debe resolver, como máximo en un clic, hacia uno de estos tres destinos:

```
Cualquier pantalla pública
   ├── Cotizar     → /cotizar  (o desde ficha/carrito)
   ├── Contactar   → /contacto o WhatsApp
   └── Explorar    → /catalogo o /catalogo/:categoria
```

| Pantalla | CTA primario | CTA secundario |
| --- | --- | --- |
| Home | Ver catálogo / Cotizar | Contacto / WhatsApp |
| Listado | Ver producto | Contacto (si no encuentra nada) |
| Ficha producto | Añadir al carrito | Cotizar / WhatsApp |
| Carrito | Solicitar cotización | Continuar pedido |
| Contacto | Enviar formulario | WhatsApp |

Si una pantalla nueva no encaja en esta tabla, es señal de que le falta un CTA o de que se está agregando contenido decorativo sin función de conversión.

---

## 5. Qué debe poder variar el admin (`admin-content`)

Para poder ajustar el discurso de captación sin tocar código, `admin-content` debe exponer (fase visual: mockeable; fase lógica: editable real):

- Texto e imagen del Hero + su CTA.
- Categorías/productos destacados en Home.
- Banda de CTA intermedia (texto + link a `/cotizar` o `/contacto`).
- Datos de contacto y WhatsApp del footer.

Esto permite a Rosver reaccionar (campaña, temporada, nuevo rubro) sin depender de un despliegue.

---

## 6. Orden de construcción priorizado por captación

Ajuste sobre el orden general de `03-vistas-y-flujos.md §5`, priorizando lo que genera leads antes que lo que retiene clientes ya convertidos:

1. Home (hero + prueba de confianza + destacados + CTAs repetidos).
2. Contacto + Cotizar (formularios) — son el punto de conversión real, no dejarlos para el final.
3. Listado + ficha de producto (con doble CTA).
4. Carrito con camino dual (A/B).
5. Auth + área cliente (`/cuenta`).
6. Admin: contenido → catálogo → leads/cotizaciones → pedidos/usuarios.

Diferencia clave frente al orden anterior: **Contacto/Cotizar sube al puesto 2** porque son el mecanismo directo de captación; no dependen de tener el catálogo completo para dar valor (puede recibir leads genéricos desde el día uno).

---

## 7. Checklist de verificación (además de lo técnico)

- [ ] Todo bloque de Home resuelve a un CTA de los definidos en la sección 4.
- [ ] CTA de cotizar/contacto visible sin scroll en desktop y a máximo un scroll en móvil.
- [ ] Ficha de producto nunca deja al visitante sin una acción distinta a "comprar ya".
- [ ] Ningún flujo de captación (contacto/cotizar/carrito→cotizar) exige login.
- [ ] Responsive: jerarquía de contenido y CTAs se mantiene en móvil/tablet/desktop (regla `.claude/rules/03-responsive-ui.md`).

---

## 8. Relación con el resto de la documentación

- Rutas y flujos técnicos (F1–F8): [`03-vistas-y-flujos.md`](./03-vistas-y-flujos.md).
- Entidades y reglas de negocio (Lead, QuoteRequest, Order): [`02-producto-rosver-sac.md`](./02-producto-rosver-sac.md).
- Fichas de feature afectadas: [`catalog`](../features/catalog.md), [`contact`](../features/contact.md), [`quotes`](../features/quotes.md), [`admin-content`](../features/admin-content.md).

Si un flujo o regla de negocio cambia a partir de esta guía, actualizar primero `02`/`03` y luego este documento.
