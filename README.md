# Checkout Store

Checkout de producto único con SPA en Vue 3 + Vuex y API NestJS con arquitectura hexagonal.

## Arranque local

Requisitos: Docker Desktop iniciado y Docker Compose v2.

1. Copia `backend/.env.example` a `backend/.env` si todavía no existe.
2. Para usar el sandbox de la pasarela, configura únicamente en `backend/.env`:

```env
PAYMENT_PROVIDER=wompi-sandbox
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUBLIC_KEY=tu-llave-publica-sandbox
WOMPI_PRIVATE_KEY=tu-llave-privada-sandbox
BASE_FEE_IN_CENTS=2500
DELIVERY_FEE_IN_CENTS=5000
```

Las llaves no deben versionarse. Con `PAYMENT_PROVIDER=disabled`, la API inicia sin enviar cobros.

3. Desde la raíz del repositorio ejecuta:

```powershell
docker compose up --build
```

El orden de inicio es PostgreSQL saludable, migraciones y seed idempotente, backend y frontend. Los servicios quedan expuestos en:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

Para detener y borrar los datos locales de PostgreSQL:

```powershell
docker compose down -v
```

## Backend

El backend separa controladores HTTP, casos de uso de aplicación, puertos de dominio y adaptadores Sequelize/HTTP. El flujo de checkout persiste una transacción `PENDING`, realiza el cobro fuera de la transacción de base de datos y finaliza de forma atómica; el stock solo cambia ante un pago aprobado.

### Endpoints actuales

- `GET /products`: lista el producto disponible.
- `GET /checkouts/settings`: expone moneda y tarifas base/de entrega que debe usar el resumen de compra.
- `POST /checkouts`: valida producto, cliente, entrega y tarjeta; responde solo `reference`, `status` y `totalAmountInCents`.
- `GET /checkouts/:reference`: recupera el estado y desglose de importes sin exponer datos personales ni de pago.
- `POST /checkouts/:reference/reconcile`: consulta la pasarela para actualizar un checkout pendiente sin volver a cobrarlo.

La documentación OpenAPI está disponible en `http://localhost:3000/docs` y el documento JSON en `http://localhost:3000/docs-json`.

La tarjeta se tokeniza con la pasarela y no se persiste, registra ni devuelve al cliente. Antes del cobro, el backend reserva el inventario dentro de la transacción que crea el checkout; una aprobación confirma la reserva y un rechazo la libera. Una respuesta `PENDING` puede consultarse y conciliarse mediante la referencia sin volver a cobrarla. Para la conciliación automática en producción aún debe añadirse un webhook firmado de Wompi.

### Modelo de datos

- `products`: catálogo, precio en centavos, stock total y reserva de inventario no negativa.
- `customers`: comprador identificado por correo.
- `deliveries`: dirección y destinatario asociados a un cliente.
- `transactions`: referencia idempotente, importes, estado y referencia del proveedor.

Las migraciones añaden llaves foráneas y restricciones de monto, stock, estado y total. El seed de producto es repetible gracias a la unicidad del nombre.

### Scripts

Ejecutar desde `backend`:

```powershell
npm run db:migrate
npm run db:seed
npm run db:migrate:undo
npm run db:seed:undo
npm run lint:check
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

## Estado de calidad

Comprobado localmente: compilación, lint, 11 pruebas unitarias y 5 pruebas HTTP e2e.

La cobertura global actual es `26.87%`; el objetivo de la prueba es superior a `80%`. Faltan pruebas de configuración, repositorios Sequelize, UoW, controladores, pipes y flujos de pago pendientes para alcanzar ese umbral.
