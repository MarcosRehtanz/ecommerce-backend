# Dynnamo E-Commerce B2C

Plataforma de comercio electrónico B2C desarrollada con NestJS y Next.js. Proyecto completo con todas las funcionalidades de un e-commerce moderno incluyendo pagos, reportes, notificaciones y panel de administración.

---

## Índice

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura](#arquitectura)
4. [Módulos](#módulos)
5. [Funcionalidades Destacadas](#funcionalidades-destacadas)
6. [Seguridad](#seguridad)
7. [Estructura de Archivos](#estructura-de-archivos)
8. [Instalación y Ejecución](#instalación-y-ejecución)
9. [API Endpoints](#api-endpoints)
10. [Base de Datos](#base-de-datos)
11. [Roadmap](#roadmap)

---

## Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | E-Commerce B2C Completo |
| **Backend** | NestJS 10 + Prisma 5 + PostgreSQL 16 |
| **Frontend** | Next.js 14 + React 18 + TypeScript 5 |
| **UI** | Mantine 7.6 + Recharts |
| **Autenticación** | JWT (Access Token 15min + Refresh Token 7d) |
| **Pagos** | MercadoPago Checkout Pro |
| **Estado** | MVP+ Completado (11 módulos, 52+ endpoints) |
| **Documentación** | Swagger + 10 archivos de documentación técnica |

---

## Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 10.x | Framework backend modular |
| Prisma | 5.x | ORM con migraciones |
| PostgreSQL | 16 | Base de datos relacional |
| JWT | - | Autenticación con tokens |
| Passport | - | Estrategias de autenticación |
| Swagger | - | Documentación API interactiva |
| Zod | - | Validación de schemas |
| Nodemailer | - | Envío de emails transaccionales |
| Handlebars | - | Templates de email |
| MercadoPago SDK | - | Integración de pagos |
| Helmet | - | Headers de seguridad HTTP |
| Throttler | - | Rate limiting |
| Docker | - | Contenedorización |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 14.1 | Framework React con App Router |
| React | 18.x | UI Library |
| TypeScript | 5.x | Tipado estático |
| Mantine UI | 7.6 | Componentes UI accesibles |
| TanStack Query | 5.x | Estado del servidor + cache |
| TanStack Table | 8.x | Tablas interactivas |
| Zustand | 4.x | Estado local (auth, cart) |
| Axios | 1.x | Cliente HTTP con interceptores |
| Recharts | 2.x | Gráficos para dashboard |
| React Hook Form | 7.x | Manejo de formularios |
| MercadoPago React | - | Integración frontend de pagos |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Next.js 14 Frontend                              │ │
│  │                                                                         │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │ │
│  │  │  Zustand  │  │  TanStack │  │   Axios   │  │    Mantine UI     │   │ │
│  │  │ AuthStore │  │   Query   │  │Interceptor│  │   + Recharts      │   │ │
│  │  │ CartStore │  │   Cache   │  │  + Retry  │  │                   │   │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘   │ │
│  │                                                                         │ │
│  │  Route Groups: (auth) | (shop) | admin/                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/REST + Webhooks
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVIDOR                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        NestJS 10 Backend                                │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Global Middleware                             │   │ │
│  │  │  • Helmet (Security Headers)  • ThrottlerGuard (Rate Limiting)  │   │ │
│  │  │  • JwtAuthGuard (Auth)        • RolesGuard (Authorization)      │   │ │
│  │  │  • LoggingInterceptor         • JwtExceptionFilter              │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│  │  │  Auth   │ │ Products│ │  Cart   │ │ Orders  │ │Payments │          │ │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Module  │          │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │ │
│  │                                                                         │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│  │  │ Reports │ │ Notif.  │ │ Categ.  │ │ Users   │ │  Site   │          │ │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │ │ Config  │          │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Prisma ORM + Validación Zod                  │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BASE DE DATOS                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        PostgreSQL 16                                    │ │
│  │  Users │ Products │ Categories │ Cart │ Orders │ Payments │ Config    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐   │
│  │  MercadoPago  │  │     SMTP      │  │    Cloudflare Tunnels         │   │
│  │   Checkout    │  │    Server     │  │   (Dev Webhooks)              │   │
│  └───────────────┘  └───────────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Módulos

### Estado de Módulos (11 implementados)

| # | Módulo | Estado | Descripción | Documentación |
|---|--------|--------|-------------|---------------|
| 0 | Infraestructura | ✅ Completo | Docker, Prisma, Config | - |
| 1 | Autenticación | ✅ Completo | JWT access+refresh, roles | - |
| 2 | Usuarios | ✅ Completo | CRUD admin, gestión de cuentas | - |
| 3 | Productos | ✅ Completo | CRUD, stock, best sellers | - |
| 4 | Categorías | ✅ Completo | Jerarquía, slugs, imágenes | - |
| 5 | Carrito | ✅ Completo | Local + Server sync | [cart-module.md](./cart-module.md) |
| 6 | Pedidos | ✅ Completo | Estados, cancelación, stock | [orders-module.md](./orders-module.md) |
| 7 | Pagos | ✅ Completo | MercadoPago, webhooks | [payments-module.md](./payments-module.md) |
| 8 | Reportes | ✅ Completo | Dashboard, gráficos, CSV | [reports-module.md](./reports-module.md) |
| 9 | Notificaciones | ✅ Completo | Email transaccional | [notifications-module.md](./notifications-module.md) |
| 10 | Newsletter | ✅ Completo | Suscripciones | - |
| 11 | Site Config | ✅ Completo | Configuración dinámica | - |

### Descripción Detallada de Módulos

#### Módulo 1: Autenticación
- Registro de usuarios con validación de email único
- Login con generación de JWT (access token + refresh token)
- Refresh token con rotación de tokens
- Logout con invalidación de refresh token
- Guards globales (autenticado por defecto)
- Decoradores personalizados (`@Public()`, `@Roles()`, `@CurrentUser()`)
- Exception filter para errores JWT con códigos específicos

#### Módulo 2: Usuarios
- CRUD completo de usuarios (solo Admin)
- Listado paginado con filtros (nombre, email, rol, estado)
- Cambio de roles (ADMIN/USER)
- Activación/desactivación de cuentas

#### Módulo 3: Productos
- CRUD completo con imágenes (base64)
- Control de stock con validaciones
- Productos destacados (featured)
- **Best sellers**: Cálculo automático de productos más vendidos
- Filtros: categoría, precio, búsqueda por nombre
- Paginación y ordenamiento

#### Módulo 4: Categorías
- CRUD de categorías con slugs únicos
- Soporte para imágenes
- Orden de visualización configurable
- Relación con productos

#### Módulo 5: Carrito
- Carrito local (Zustand) para usuarios anónimos
- Carrito en servidor para usuarios autenticados
- **Sincronización inteligente** al login (merge con estrategia MAX)
- Validación de stock en cada operación
- Optimistic updates en UI

Ver documentación completa: [cart-module.md](./cart-module.md)

#### Módulo 6: Pedidos
- Crear pedido desde carrito (transacción atómica)
- **5 estados**: PENDING → CONFIRMED → SHIPPED → DELIVERED (o CANCELLED)
- Cancelación solo si PENDING (restaura stock)
- **Límite de 1 pedido pendiente sin pagar por usuario**
- **Bloqueo de confirmación si no está pagado**
- Auto-expiración de pedidos pendientes (configurable)
- Historial para cliente y admin

Ver documentación completa: [orders-module.md](./orders-module.md)

#### Módulo 7: Pagos (MercadoPago)
- Creación de preferencias de pago (Checkout Pro)
- **Webhooks** con validación de firma
- Sincronización automática de estado de pago
- Admin puede sincronizar/marcar como pagado manualmente
- Estados: PENDING, APPROVED, REJECTED, CANCELLED

Ver documentación completa: [payments-module.md](./payments-module.md)

#### Módulo 8: Reportes
- **Dashboard en tiempo real** con métricas clave
- Gráfico de tendencia de ventas (diario/semanal/mensual)
- Gráfico de distribución de pedidos (donut)
- Top productos más vendidos
- Alertas de bajo stock
- **Exportación CSV** (pedidos y ventas)

Ver documentación completa: [reports-module.md](./reports-module.md)

#### Módulo 9: Notificaciones
- Emails transaccionales con templates Handlebars
- Email de bienvenida
- Confirmación de pedido
- Actualización de estado de pedido
- Modo desarrollo (log en consola)

Ver documentación completa: [notifications-module.md](./notifications-module.md)

---

## Funcionalidades Destacadas

### Para Clientes
| Funcionalidad | Descripción |
|---------------|-------------|
| Catálogo de productos | Navegación con filtros, búsqueda, categorías |
| Carrito inteligente | Sincronización local/servidor, validación de stock |
| Checkout con MercadoPago | Pago seguro con tarjetas, débito, efectivo |
| Historial de pedidos | Ver estado y detalle de cada pedido |
| Perfil de usuario | Gestión de datos personales |
| Homepage completa | Hero, categorías, best sellers, ofertas, newsletter |

### Para Administradores
| Funcionalidad | Descripción |
|---------------|-------------|
| Dashboard analítico | Métricas en tiempo real, gráficos interactivos |
| Gestión de productos | CRUD completo con imágenes y stock |
| Gestión de pedidos | Cambiar estados, ver detalles, sincronizar pagos |
| Gestión de usuarios | CRUD, roles, activación/desactivación |
| Gestión de categorías | Organización del catálogo |
| Exportación de datos | CSV de pedidos y ventas |
| Alertas de stock | Productos con bajo inventario |

### Funcionalidades Técnicas Avanzadas
| Funcionalidad | Descripción |
|---------------|-------------|
| Token refresh automático | Axios interceptor con retry queue |
| Rate limiting (3 niveles) | Protección contra abuso |
| Headers de seguridad | Helmet configurado |
| Exception filters | Respuestas de error consistentes |
| Webhooks seguros | Validación de firma MercadoPago |
| Scheduler de pedidos | Auto-cancelación de pedidos expirados |
| Cart merge strategy | Algoritmo MAX para sincronización |

---

## Seguridad

### Implementaciones de Seguridad

| Capa | Implementación | Estado |
|------|----------------|--------|
| **Autenticación** | JWT con access + refresh tokens | ✅ |
| **Autorización** | Role-based access control (RBAC) | ✅ |
| **Validación** | Zod schemas en todos los inputs | ✅ |
| **Passwords** | Hashing con bcrypt | ✅ |
| **Rate Limiting** | @nestjs/throttler (3 niveles) | ✅ |
| **Headers HTTP** | Helmet (security headers) | ✅ |
| **CORS** | Configuración restrictiva | ✅ |
| **Webhooks** | Validación de firma | ✅ |
| **Exception Handling** | JWT Exception Filter con códigos | ✅ |

### Configuración de Rate Limiting

```typescript
// 3 niveles de throttling
{
  name: 'short',  ttl: 1000,  limit: 3    // 3 req/seg
  name: 'medium', ttl: 10000, limit: 20   // 20 req/10seg
  name: 'long',   ttl: 60000, limit: 100  // 100 req/min
}
```

### Códigos de Error JWT

El sistema devuelve códigos específicos para errores de autenticación:

| Código | Descripción |
|--------|-------------|
| `TOKEN_EXPIRED` | Token JWT expirado |
| `TOKEN_INVALID` | Token JWT inválido |
| `UNAUTHORIZED` | No autorizado |
| `SESSION_INVALID` | Sesión inválida |
| `USER_NOT_FOUND` | Usuario no encontrado |
| `USER_INACTIVE` | Usuario desactivado |

---

## Estructura de Archivos

### Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── migrations/            # Historial de migraciones
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── auth/
│   │   ├── decorators/        # @Public, @Roles, @CurrentUser
│   │   ├── dto/               # LoginDto, RegisterDto
│   │   ├── filters/           # JwtExceptionFilter
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── strategies/        # JwtStrategy, JwtRefreshStrategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── cart/
│   ├── orders/
│   │   └── orders-scheduler.service.ts  # Auto-cancel
│   ├── payments/              # MercadoPago integration
│   ├── reports/
│   ├── notifications/
│   │   └── templates/         # Handlebars email templates
│   ├── newsletter/
│   ├── site-config/
│   ├── common/
│   │   └── interceptors/      # LoggingInterceptor
│   ├── prisma/
│   ├── app.module.ts          # Global guards, filters, interceptors
│   └── main.ts                # Bootstrap + Helmet + Swagger
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile
└── package.json
```

### Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (shop)/
│   │   │   ├── page.tsx               # Home (best sellers, categories)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Catálogo
│   │   │   │   └── [id]/page.tsx      # Detalle producto
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx           # Checkout
│   │   │   │   ├── success/page.tsx   # Pago exitoso
│   │   │   │   ├── pending/page.tsx   # Pago pendiente
│   │   │   │   └── failure/page.tsx   # Pago fallido
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # Mis pedidos
│   │   │   │   └── [id]/page.tsx      # Detalle pedido
│   │   │   └── profile/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   └── site-config/page.tsx
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── auth/AuthGuard.tsx
│   │   ├── home/                      # Hero, Categories, Carousels
│   │   ├── layout/Header.tsx, Footer.tsx
│   │   └── providers/Providers.tsx
│   ├── hooks/                         # 12 custom hooks
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useCart.ts
│   │   ├── useUnifiedCart.ts
│   │   ├── useOrders.ts
│   │   ├── usePayments.ts
│   │   ├── useReports.ts
│   │   ├── useUsers.ts
│   │   ├── useCategories.ts
│   │   ├── useNewsletter.ts
│   │   ├── useSiteConfig.ts
│   │   └── useIntersectionObserver.ts
│   ├── lib/api/
│   │   ├── axios.ts                   # Interceptors + refresh
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   ├── reports.ts
│   │   └── server.ts                  # Server-side fetching
│   ├── stores/
│   │   ├── authStore.ts               # Zustand persisted
│   │   └── cartStore.ts               # Zustand persisted
│   ├── types/index.ts
│   └── utils/image.ts
├── package.json
└── next.config.js
```

---

## Instalación y Ejecución

### Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

### Instalación

```bash
# Clonar repositorios
git clone <backend-url> backend
git clone <frontend-url> frontend

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Configuración

**Backend (.env):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="tu-secreto-refresh-super-seguro"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3001"
FRONTEND_URL="http://localhost:3001"
BACKEND_URL="http://localhost:3000"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="TEST-xxx"
MERCADOPAGO_PUBLIC_KEY="TEST-xxx"

# SMTP (opcional en desarrollo)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM=noreply@example.com

# Orders
ORDER_EXPIRATION_HOURS=24
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxx
NEXT_PUBLIC_MP_SANDBOX=false
```

### Ejecución

```bash
# Terminal 1: Base de datos
cd backend
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Backend
cd backend
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

### Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@example.com | Admin123! | ADMIN |
| user@example.com | User123! | USER |

---

## API Endpoints

### Resumen (52+ endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| Auth | 5 | Login, register, refresh, logout, me |
| Users | 5 | CRUD usuarios (Admin) |
| Products | 7 | CRUD + best sellers |
| Categories | 4 | CRUD categorías |
| Cart | 6 | CRUD items + sync |
| Orders | 8 | CRUD + estados + stats |
| Payments | 5 | MercadoPago + webhooks |
| Reports | 7 | Dashboard + exports |
| Newsletter | 3 | Suscripciones |
| Site Config | 4 | Configuración |

### Detalle de Endpoints

#### Autenticación (`/auth`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | /auth/register | Registrar usuario | Público |
| POST | /auth/login | Iniciar sesión | Público |
| POST | /auth/refresh | Renovar tokens | Público |
| POST | /auth/logout | Cerrar sesión | Protegido |
| GET | /auth/me | Obtener perfil | Protegido |

#### Productos (`/products`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | /products | Listar productos | Público |
| GET | /products/:id | Obtener producto | Público |
| GET | /products/best-sellers | Más vendidos | Público |
| POST | /products | Crear producto | Admin |
| PUT | /products/:id | Actualizar | Admin |
| DELETE | /products/:id | Eliminar | Admin |
| GET | /products/admin/all | Todos (incl. inactivos) | Admin |

#### Pedidos (`/orders`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | /orders | Crear pedido | Usuario |
| GET | /orders | Mis pedidos | Usuario |
| GET | /orders/:id | Mi pedido | Usuario |
| PUT | /orders/:id/cancel | Cancelar | Usuario |
| GET | /orders/admin/all | Todos los pedidos | Admin |
| GET | /orders/admin/stats | Estadísticas | Admin |
| GET | /orders/admin/:id | Pedido por ID | Admin |
| PUT | /orders/admin/:id/status | Cambiar estado | Admin |

#### Pagos (`/payments`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | /payments/create-preference | Crear link de pago | Protegido |
| POST | /payments/webhook | Webhook MercadoPago | Público |
| GET | /payments/:orderId | Estado de pago | Protegido |
| POST | /payments/admin/sync/:orderId | Sincronizar pago | Admin |
| POST | /payments/admin/mark-paid/:orderId | Marcar pagado | Admin |

#### Reportes (`/reports`) - Solo Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /reports/dashboard | Estadísticas dashboard |
| GET | /reports/sales | Reporte de ventas |
| GET | /reports/top-products | Productos más vendidos |
| GET | /reports/low-stock | Productos bajo stock |
| GET | /reports/recent-orders | Pedidos recientes |
| GET | /reports/export/orders | Exportar pedidos CSV |
| GET | /reports/export/sales | Exportar ventas CSV |

---

## Base de Datos

### Modelos Principales

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String
  name         String
  role         Role     @default(USER)
  isActive     Boolean  @default(true)
  refreshToken String?
  cart         Cart?
  orders       Order[]
}

model Product {
  id            String     @id @default(uuid())
  name          String     @unique
  description   String?
  price         Decimal    @db.Decimal(10, 2)
  originalPrice Decimal?   @db.Decimal(10, 2)
  stock         Int        @default(0)
  featured      Boolean    @default(false)
  imageUrl      String?
  imageData     String?    @db.Text
  categoryId    String?
  category      Category?  @relation(...)
  isActive      Boolean    @default(true)
}

model Order {
  id            String        @id @default(uuid())
  userId        String
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  paymentId     String?
  mercadoPagoId String?       @unique
  total         Decimal       @db.Decimal(10, 2)
  items         OrderItem[]
}
```

### Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

## Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [cart-module.md](./cart-module.md) | Sincronización, merge strategy, tabla de verdad |
| [orders-module.md](./orders-module.md) | Estados, transiciones, flujos |
| [payments-module.md](./payments-module.md) | MercadoPago, webhooks, estados |
| [reports-module.md](./reports-module.md) | Dashboard, gráficos, exportación |
| [notifications-module.md](./notifications-module.md) | Emails, templates, SMTP |
| [security.md](./security.md) | Implementaciones de seguridad |
| [ROADMAP.md](./ROADMAP.md) | Plan de evolución (6 fases) |
| [EVALUACION_TECNICA.md](./EVALUACION_TECNICA.md) | Evaluación del proyecto |
| [nextjs-api-routes.md](./nextjs-api-routes.md) | Plan de migración a httpOnly cookies |
| [cloudflare-tunnels.md](./cloudflare-tunnels.md) | Desarrollo con webhooks |

---

## Roadmap

El proyecto está en MVP+ completado. Ver [ROADMAP.md](./ROADMAP.md) para el plan de evolución.

### Próximas Mejoras Prioritarias

| Prioridad | Feature | Estado |
|-----------|---------|--------|
| Alta | Cupones de descuento | Pendiente |
| Alta | Búsqueda full-text | Pendiente |
| Media | Reseñas y ratings | Pendiente |
| Media | Wishlist | Pendiente |
| Media | Múltiples direcciones | Pendiente |
| Baja | CDN para imágenes | Pendiente |

---

*Última actualización: Enero 2025*
*Versión: 1.1 (MVP+ con pagos y seguridad)*
