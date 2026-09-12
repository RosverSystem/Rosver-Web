# Cambio: Fix vista pedido «No encontrado»

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Causa: el API corría sin reiniciar tras agregar rutas; `GET …/by-code/…` caía al 404 global (`No encontrado`).
- Migración `026` aplicada.
- Carga del detalle por `GET /api/admin/orders?code=PD-…` (más simple).
- API reiniciada en `:8787`.

## Cómo verificar

- [ ] Recargar `/admin/pedidos/vista?codigo-pedido=PD-2026-000001&codcliente=…`
- [ ] Debe verse productos + pipeline (no «No encontrado»)
