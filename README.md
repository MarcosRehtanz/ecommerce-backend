# E-commerce Backend

API REST para plataforma de e-commerce B2C desarrollada con NestJS.

## Tech Stack

- **NestJS 10.x** - Framework backend
- **Prisma** - ORM con PostgreSQL
- **JWT** - Autenticación (access + refresh tokens)
- **Zod** - Validación de datos
- **Swagger** - Documentación de API
- **Docker** - Contenedores

## Requisitos

- Node.js 18+
- PostgreSQL 15+ (o Docker)
- npm o yarn

## Instalación

```bash
# Clonar repositorio
git clone git@github.com:MarcosRehtanz/ecommerce-backend.git
cd ecommerce-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Iniciar base de datos con Docker
docker-compose -f docker-compose.dev.yml up -d

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos iniciales
npx prisma db seed

# Iniciar servidor de desarrollo
npm run start:dev
```

## Variables de Entorno

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Servidor con hot reload |
| `npm run build` | Compilar TypeScript |
| `npm run start:prod` | Servidor en producción |
| `npm test` | Ejecutar tests |
| `npm run test:e2e` | Tests end-to-end |
| `npm run lint` | Linter con autofix |
| `npx prisma studio` | UI de base de datos |

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/refresh` | Refrescar token |
| GET | `/api/auth/me` | Usuario actual |

### Usuarios (Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Obtener usuario |
| POST | `/api/users` | Crear usuario |
| PATCH | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos |
| GET | `/api/products/:id` | Obtener producto |
| POST | `/api/products` | Crear producto (Admin) |
| PATCH | `/api/products/:id` | Actualizar producto (Admin) |
| DELETE | `/api/products/:id` | Eliminar producto (Admin) |

### Carrito
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cart` | Obtener carrito |
| POST | `/api/cart/items` | Agregar item |
| PATCH | `/api/cart/items/:id` | Actualizar cantidad |
| DELETE | `/api/cart/items/:id` | Eliminar item |
| POST | `/api/cart/sync` | Sincronizar carrito |

### Órdenes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/orders` | Listar órdenes |
| GET | `/api/orders/:id` | Obtener orden |
| POST | `/api/orders` | Crear orden |
| PATCH | `/api/orders/:id/status` | Actualizar estado (Admin) |

### Reportes (Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Estadísticas generales |
| GET | `/api/reports/sales` | Ventas por período |
| GET | `/api/reports/top-products` | Productos más vendidos |

## Documentación API

Swagger UI disponible en: `http://localhost:3000/api/docs`

## Arquitectura

```
src/
├── auth/               # Autenticación JWT
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   ├── decorators/     # @Public, @Roles, @CurrentUser
│   └── strategies/     # JWT strategies
├── users/              # Gestión de usuarios
├── products/           # Catálogo de productos
├── cart/               # Carrito de compras
├── orders/             # Pedidos
├── reports/            # Reportes y analytics
├── notifications/      # Emails con Nodemailer
├── prisma/             # Servicio de base de datos
└── common/             # Pipes, interceptors
```

## Seguridad

- **JwtAuthGuard** (global) - Todas las rutas protegidas por defecto
- **RolesGuard** (global) - Control de acceso por roles
- `@Public()` - Marcar endpoints públicos
- `@Roles('ADMIN')` - Restringir a administradores

## Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@example.com | Admin123! | ADMIN |
| user@example.com | User123! | USER |

## Docker

```bash
# Solo base de datos (desarrollo)
docker-compose -f docker-compose.dev.yml up -d

# Stack completo (producción)
docker-compose up -d
```

## Base de Datos

```bash
# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Reset completo
npx prisma migrate reset

# Abrir Prisma Studio
npx prisma studio
```

## Licencia

MIT
