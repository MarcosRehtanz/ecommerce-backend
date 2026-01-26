# Next.js API Routes - Plan de Implementación

Este documento describe cómo y por qué implementar Route Handlers de Next.js en el frontend de Dynnamo.

---

## Estado Actual

### Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js Frontend                      │    │
│  │                      (port 3001)                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  Zustand    │  │  TanStack   │  │   Axios Client  │  │    │
│  │  │  (Auth/Cart)│  │  Query      │  │   lib/api/*     │  │    │
│  │  └─────────────┘  └─────────────┘  └────────┬────────┘  │    │
│  └─────────────────────────────────────────────┼───────────┘    │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
                                                 │ HTTP Direct
                                                 │ (CORS enabled)
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NestJS Backend                             │
│                         (port 3000)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   /api/auth  /api/users  /api/products  /api/orders     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo Actual de Autenticación

1. Usuario hace login desde el browser
2. Browser envía credenciales directamente al backend NestJS
3. Backend responde con `accessToken` y `refreshToken`
4. Frontend guarda tokens en **localStorage** (via Zustand persist)
5. Axios interceptor agrega token en cada request

### Problemas del Enfoque Actual

| Problema | Impacto | Severidad |
|----------|---------|-----------|
| Tokens en localStorage | Vulnerable a XSS | Alta |
| Backend URL expuesta | Visible en Network tab | Media |
| CORS requerido | Configuración adicional | Baja |
| No hay cache en servidor | Más carga al backend | Media |
| Refresh token en cliente | Menos seguro | Alta |

---

## Arquitectura Propuesta

### Con Next.js API Routes (Route Handlers)

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js Frontend                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  Zustand    │  │  TanStack   │  │   Axios Client  │  │    │
│  │  │  (UI State) │  │  Query      │  │   lib/api/*     │  │    │
│  │  └─────────────┘  └─────────────┘  └────────┬────────┘  │    │
│  └─────────────────────────────────────────────┼───────────┘    │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
                                                 │ Same-origin
                                                 │ (No CORS)
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│                      (port 3001/api)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /api/auth/*   /api/proxy/*   /api/webhooks/*           │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │  - HttpOnly Cookies                               │  │    │
│  │  │  - Server-side token refresh                      │  │    │
│  │  │  - Response caching                               │  │    │
│  │  │  - Request aggregation                            │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────┬────────────────┘
                                                 │
                                                 │ Server-to-Server
                                                 │ (Internal network)
                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NestJS Backend                             │
│                    (port 3000 - interno)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Casos de Uso a Implementar

### 1. Autenticación Segura con HttpOnly Cookies

**Prioridad:** Alta
**Complejidad:** Media
**Beneficio:** Elimina vulnerabilidad XSS en tokens

#### Estructura de Archivos

```
frontend/src/app/api/
├── auth/
│   ├── login/
│   │   └── route.ts       # POST /api/auth/login
│   ├── register/
│   │   └── route.ts       # POST /api/auth/register
│   ├── logout/
│   │   └── route.ts       # POST /api/auth/logout
│   ├── refresh/
│   │   └── route.ts       # POST /api/auth/refresh
│   └── me/
│       └── route.ts       # GET /api/auth/me
```

#### Implementación: Login

```typescript
// frontend/src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Llamar al backend NestJS
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    // Crear respuesta con cookies HttpOnly
    const res = NextResponse.json({
      user: data.user,
      // NO enviamos tokens al cliente
    });

    // Access token en cookie HttpOnly (corta duración)
    res.cookies.set('access_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutos
      path: '/',
    });

    // Refresh token en cookie HttpOnly (larga duración)
    res.cookies.set('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/api/auth/refresh', // Solo accesible para refresh
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { message: 'Error de conexión' },
      { status: 500 }
    );
  }
}
```

#### Implementación: Logout

```typescript
// frontend/src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;

  // Llamar al backend para invalidar refresh token
  if (accessToken) {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  // Limpiar cookies
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');

  return res;
}
```

#### Implementación: Refresh Token

```typescript
// frontend/src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: 'No refresh token' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token inválido - limpiar cookies
      const res = NextResponse.json(
        { message: 'Session expired' },
        { status: 401 }
      );
      res.cookies.delete('access_token');
      res.cookies.delete('refresh_token');
      return res;
    }

    const data = await response.json();

    const res = NextResponse.json({ user: data.user });

    // Actualizar cookies con nuevos tokens
    res.cookies.set('access_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    res.cookies.set('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/api/auth/refresh',
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { message: 'Error refreshing token' },
      { status: 500 }
    );
  }
}
```

#### Cambios en el Cliente

```typescript
// frontend/src/lib/api/axios.ts (MODIFICADO)
import axios from 'axios';

// Ahora apunta a Next.js API routes, no al backend directo
const api = axios.create({
  baseURL: '/api', // Relativo al mismo origen
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para cookies
});

// Interceptor simplificado - no maneja tokens manualmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh automático
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        // Reintentar request original
        return api(error.config);
      } catch {
        // Refresh falló - redirigir a login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

```typescript
// frontend/src/stores/authStore.ts (SIMPLIFICADO)
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ user: data, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

---

### 2. Proxy API (Ocultar Backend)

**Prioridad:** Media
**Complejidad:** Baja
**Beneficio:** Seguridad, simplifica CORS

#### Estructura

```
frontend/src/app/api/
├── proxy/
│   └── [...path]/
│       └── route.ts       # Proxy genérico a backend
```

#### Implementación

```typescript
// frontend/src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const accessToken = request.cookies.get('access_token')?.value;

  const url = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/api/${path}${url.search}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { message: 'Backend unavailable' },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
```

#### Uso

```typescript
// Antes (directo al backend)
const response = await axios.get('http://localhost:3000/api/products');

// Después (a través del proxy)
const response = await axios.get('/api/proxy/products');
```

---

### 3. Webhooks (Stripe, etc.)

**Prioridad:** Alta (cuando se implemente pagos)
**Complejidad:** Media
**Beneficio:** Recibir eventos de servicios externos

#### Estructura

```
frontend/src/app/api/
├── webhooks/
│   ├── stripe/
│   │   └── route.ts       # POST /api/webhooks/stripe
│   └── other/
│       └── route.ts
```

#### Implementación (Stripe)

```typescript
// frontend/src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Procesar eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Notificar al backend
      await fetch(`${BACKEND_URL}/api/orders/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET!,
        },
        body: JSON.stringify({
          sessionId: session.id,
          orderId: session.metadata?.orderId,
          paymentStatus: session.payment_status,
        }),
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await fetch(`${BACKEND_URL}/api/orders/payment-failed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET!,
        },
        body: JSON.stringify({
          orderId: paymentIntent.metadata?.orderId,
          error: paymentIntent.last_payment_error?.message,
        }),
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// Deshabilitar body parsing de Next.js para webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
```

---

### 4. Agregación de Datos

**Prioridad:** Baja
**Complejidad:** Media
**Beneficio:** Reducir roundtrips, mejor UX

#### Ejemplo: Dashboard Data

```typescript
// frontend/src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Hacer múltiples llamadas en paralelo
    const [stats, recentOrders, lowStock, topProducts] = await Promise.all([
      fetch(`${BACKEND_URL}/api/reports/dashboard`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/reports/recent-orders?limit=5`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/reports/low-stock?threshold=10`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/reports/top-products?limit=5`, { headers }).then(r => r.json()),
    ]);

    // Combinar en una sola respuesta
    return NextResponse.json({
      stats,
      recentOrders,
      lowStock,
      topProducts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching dashboard data' },
      { status: 500 }
    );
  }
}
```

#### Uso en el Cliente

```typescript
// Un solo fetch en lugar de 4
const { data } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => fetch('/api/dashboard').then(r => r.json()),
});
```

---

### 5. Cache en Servidor

**Prioridad:** Baja
**Complejidad:** Baja
**Beneficio:** Reducir carga al backend, mejor performance

#### Implementación con Cache

```typescript
// frontend/src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/products?${searchParams.toString()}`,
      {
        // Cache por 60 segundos
        next: { revalidate: 60 },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching products' },
      { status: 500 }
    );
  }
}
```

---

## Plan de Migración

### Fase 1: Autenticación Segura (Sprint 1)

```
Tareas:
├── [ ] Crear estructura /api/auth/*
├── [ ] Implementar login con HttpOnly cookies
├── [ ] Implementar logout
├── [ ] Implementar refresh token server-side
├── [ ] Implementar /api/auth/me
├── [ ] Modificar authStore (remover tokens)
├── [ ] Modificar axios client
├── [ ] Actualizar componentes de auth
├── [ ] Testing de flujo completo
└── [ ] Documentar cambios
```

### Fase 2: Proxy API (Sprint 2)

```
Tareas:
├── [ ] Crear proxy genérico /api/proxy/[...path]
├── [ ] Migrar llamadas de productos
├── [ ] Migrar llamadas de carrito
├── [ ] Migrar llamadas de órdenes
├── [ ] Migrar llamadas de usuarios
├── [ ] Remover CORS del backend (opcional)
├── [ ] Testing de todos los endpoints
└── [ ] Actualizar documentación
```

### Fase 3: Webhooks (Cuando se implemente Stripe)

```
Tareas:
├── [ ] Crear /api/webhooks/stripe
├── [ ] Configurar Stripe webhook secret
├── [ ] Implementar handlers de eventos
├── [ ] Testing con Stripe CLI
└── [ ] Monitoreo de webhooks
```

### Fase 4: Optimizaciones (Sprint Posterior)

```
Tareas:
├── [ ] Implementar agregación para dashboard
├── [ ] Añadir cache a endpoints públicos
├── [ ] Métricas de performance
└── [ ] Documentar patrones de cache
```

---

## Variables de Entorno Requeridas

```env
# frontend/.env.local

# URL del backend (solo accesible desde el servidor Next.js)
BACKEND_URL=http://localhost:3000

# Secret para comunicación interna (webhooks, etc.)
INTERNAL_API_SECRET=your-internal-secret-key

# Stripe (cuando se implemente)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Consideraciones de Seguridad

### Cookies HttpOnly

| Aspecto | Configuración |
|---------|---------------|
| `httpOnly` | `true` - No accesible via JavaScript |
| `secure` | `true` en producción (HTTPS only) |
| `sameSite` | `lax` o `strict` - Protección CSRF |
| `path` | Restringir según necesidad |
| `maxAge` | Access: 15min, Refresh: 7 días |

### Headers de Seguridad

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}
```

---

## Comparativa: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Tokens | localStorage (XSS vulnerable) | HttpOnly cookies (seguro) |
| Backend URL | Expuesta en browser | Oculta (server-side) |
| CORS | Requerido | No necesario |
| Refresh Token | Manejado en cliente | Manejado en servidor |
| Llamadas al backend | N por página | Agregadas/cacheadas |
| Webhooks | No soportados | Soportados |

---

*Documento creado: Enero 2025*
*Prioridad de implementación: Fase 1 (Auth) es crítica para seguridad*
