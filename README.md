# Tienda Aura (MVP)

## Plan por etapas

**Etapa 1: manual-first**

- Catálogo, carrito y checkout invitado.
- Crear órdenes con estado `pending`.
- Panel admin para marcar pagos manuales.

**Etapa 2: webhook automático**

- Webhook Mercado Pago para confirmar pagos y actualizar stock.
- Idempotencia y tracking para guest.

**Etapa 3: mejoras**

- Emails transaccionales, reportes y automatizaciones.
- Analítica de conversión y cohortes.

## Arquitectura

- **Frontend**: SPA en Vite + React + TypeScript, UI con Tailwind y componentes shadcn.
- **Backend**: Firebase Cloud Functions (Node 18) para crear órdenes y escuchar webhooks.
- **Datos**: Firestore para catálogos y órdenes; Storage para imágenes.
- **Auth**: Firebase Auth (email + Google opcional) para cuentas y admin.
- **Pagos**: Mercado Pago Checkout Pro con `external_reference=orderId`.

## Estructura de carpetas

```
.
├── functions/             # Cloud Functions
├── public/                # Assets estáticos
├── scripts/               # Seed y utilidades
└── src/                   # Frontend
    ├── components/        # UI y bloques
    ├── data/              # Datos mock y seed
    ├── layouts/           # Layouts
    ├── lib/               # Helpers y SDKs
    ├── pages/             # Rutas
    ├── store/             # Zustand
    └── types/             # Tipos compartidos
```

## Setup local

### Inicio desde cero (paso a paso)

Si querés levantar el proyecto desde una máquina nueva, seguí este orden:

1. Verificá versiones de herramientas:
   ```bash
   node -v
   npm -v
   firebase --version
   ```
2. Instalá dependencias del frontend en la raíz:
   ```bash
   npm install
   ```
3. Instalá dependencias de Cloud Functions:
   ```bash
   cd functions && npm install && cd ..
   ```
4. Creá `.env` a partir de `.env.example` y completá variables `VITE_*`.
5. Iniciá frontend y backend en terminales separadas:
   ```bash
   npm run dev
   ```
   ```bash
   cd functions && npm run build -- --watch
   ```

Con eso ya podés iterar localmente en UI + funciones.

1. Instalar dependencias del frontend:
   ```bash
   npm install
   ```
2. Configurar variables en `.env` (ver `.env.example`).
3. Iniciar Vite:
   ```bash
   npm run dev
   ```

### Functions

```bash
cd functions
npm install
npm run build
```

## Deploy

- **Frontend**: Vercel → importar repo, variables `VITE_*`.
- **Backend**: Firebase → `firebase deploy --only functions`.

## Firestore rules

Ver `firestore.rules`.

## Seed de productos

Usar el script en `scripts/seed.ts` (requiere credenciales de admin SDK).

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/ruta/credenciales.json"
npm install --save-dev tsx
npx tsx scripts/seed.ts
```
