# checkout-store-app

Checkout de producto único con pago con tarjeta de crédito. SPA en Vue 3 + Vuex y API en NestJS con arquitectura hexagonal.

## Estructura

```text
checkout-store-app/
├── backend/            # NestJS API
├── frontend/           # Vue 3 + Vuex 4 SPA
├── docs/               # Postman + modelo de datos
├── docker-compose.yml
└── .github/workflows/
```

## Backend

- `src/modules/products`, `transactions`, `customers`, `deliveries`, `wompi`
- `src/shared` para helpers de resultado
- `src/config` para configuración
- `seed/` para scripts de datos

### Comandos

```bash
cd /home/runner/work/checkout-store-app/checkout-store-app/backend
npm install
npm run start:dev
npm run test
```

## Frontend

- Vue 3 + TypeScript + Vite
- Vuex 4 en `src/store`
- Páginas en `src/pages`
- Servicios y utilidades en `src/services`, `src/hooks`, `src/utils`

### Comandos

```bash
cd /home/runner/work/checkout-store-app/checkout-store-app/frontend
npm install
npm run dev
npm run build
```

## Docker

```bash
docker compose up
```

## API (base)

- `GET /` (health básico)
