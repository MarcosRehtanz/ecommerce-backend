# Implementaciones de Seguridad

Este documento detalla todas las medidas de seguridad implementadas en el proyecto Dynnamo.

---

## Resumen de Seguridad

| Capa | Implementación | Estado | Descripción |
|------|----------------|--------|-------------|
| Autenticación | JWT (access + refresh) | ✅ | Tokens de corta y larga duración |
| Autorización | RBAC con Guards | ✅ | Control de acceso basado en roles |
| Validación | Zod Schemas | ✅ | Validación estricta de inputs |
| Passwords | bcrypt | ✅ | Hashing seguro |
| Rate Limiting | @nestjs/throttler | ✅ | 3 niveles de protección |
| Headers HTTP | Helmet | ✅ | Headers de seguridad |
| CORS | Configuración restrictiva | ✅ | Solo orígenes permitidos |
| Webhooks | Validación de firma | ✅ | HMAC-SHA256 |
| Exception Handling | JWT Exception Filter | ✅ | Códigos de error específicos |

---

## 1. Autenticación JWT

### Estrategia de Tokens

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Login                                                       │
│     ┌──────────┐        ┌──────────┐        ┌──────────┐       │
│     │  Client  │───────▶│  Server  │───────▶│   DB     │       │
│     │          │ email  │          │ verify │          │       │
│     │          │ pass   │          │ hash   │          │       │
│     └──────────┘        └──────────┘        └──────────┘       │
│           │                   │                                 │
│           │◀──────────────────│                                │
│           │  accessToken (15m)                                 │
│           │  refreshToken (7d)                                 │
│                                                                 │
│  2. Request con Access Token                                   │
│     ┌──────────┐        ┌──────────┐                          │
│     │  Client  │───────▶│  Server  │                          │
│     │          │ Bearer │ JwtGuard │                          │
│     │          │ token  │ verifica │                          │
│     └──────────┘        └──────────┘                          │
│                                                                 │
│  3. Refresh Token (cuando expira access token)                 │
│     ┌──────────┐        ┌──────────┐        ┌──────────┐       │
│     │  Client  │───────▶│  Server  │───────▶│   DB     │       │
│     │          │refresh │          │ verify │ compare  │       │
│     │          │token   │          │ + hash │ hash     │       │
│     └──────────┘        └──────────┘        └──────────┘       │
│           │                   │                                 │
│           │◀──────────────────│                                │
│           │  NEW accessToken                                   │
│           │  NEW refreshToken (rotación)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Configuración de Tokens

| Token | Duración | Almacenamiento | Propósito |
|-------|----------|----------------|-----------|
| Access Token | 15 minutos | Frontend (Zustand) | Autenticar requests |
| Refresh Token | 7 días | Frontend + DB (hash) | Obtener nuevo access token |

### Implementación Backend

```typescript
// auth.service.ts
async login(loginDto: LoginDto) {
  const user = await this.validateUser(loginDto);

  const accessToken = this.jwtService.sign(
    { sub: user.id, email: user.email, role: user.role },
    { secret: JWT_SECRET, expiresIn: '15m' }
  );

  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    { secret: JWT_REFRESH_SECRET, expiresIn: '7d' }
  );

  // Guardar hash del refresh token en DB
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await this.prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return { user, accessToken, refreshToken };
}
```

### Refresh con Rotación

```typescript
async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  // Verificar que el refresh token coincide con el almacenado
  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Generar nuevos tokens (rotación)
  const newAccessToken = this.generateAccessToken(user);
  const newRefreshToken = this.generateRefreshToken(user);

  // Actualizar hash en DB
  await this.updateRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## 2. Autorización (RBAC)

### Roles Disponibles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `USER` | Usuario estándar | Comprar, ver pedidos propios |
| `ADMIN` | Administrador | Todo + gestión |

### Guards Globales

```typescript
// app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,  // 1. Rate limiting
  },
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,     // 2. Autenticación
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,       // 3. Autorización
  },
],
```

### Decoradores Personalizados

```typescript
// @Public() - Hacer endpoint público
@Public()
@Get('products')
findAll() { ... }

// @Roles() - Restringir a roles específicos
@Roles('ADMIN')
@Delete('users/:id')
deleteUser() { ... }

// @CurrentUser() - Obtener usuario actual
@Get('profile')
getProfile(@CurrentUser() user: User) { ... }
```

### RolesGuard con Reflector

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

---

## 3. Validación de Inputs (Zod)

### Schema Validation

```typescript
// create-product.dto.ts
export const createProductSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  price: z.number()
    .positive('El precio debe ser positivo')
    .max(999999.99, 'El precio excede el máximo permitido'),
  stock: z.number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo'),
  categoryId: z.string().uuid().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
```

### Validation Pipe Global

```typescript
// zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.errors);
    }
    return result.data;
  }
}
```

---

## 4. Rate Limiting

### Configuración de 3 Niveles

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 segundo
    limit: 3,     // 3 requests
  },
  {
    name: 'medium',
    ttl: 10000,   // 10 segundos
    limit: 20,    // 20 requests
  },
  {
    name: 'long',
    ttl: 60000,   // 1 minuto
    limit: 100,   // 100 requests
  },
]),
```

### Protección por Endpoint

| Nivel | Ventana | Límite | Uso |
|-------|---------|--------|-----|
| Short | 1 seg | 3 req | Prevenir spam rápido |
| Medium | 10 seg | 20 req | Uso normal intensivo |
| Long | 60 seg | 100 req | Límite general |

### Skip para Webhooks

```typescript
// Webhooks necesitan acceso sin límite
@Post('webhook')
@Public()
@SkipThrottle()
async handleWebhook() { ... }
```

---

## 5. Headers de Seguridad (Helmet)

### Configuración

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

### Headers Aplicados

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | nosniff | Prevenir MIME sniffing |
| `X-Frame-Options` | DENY | Prevenir clickjacking |
| `X-XSS-Protection` | 1; mode=block | Filtro XSS del navegador |
| `Strict-Transport-Security` | max-age=... | Forzar HTTPS |
| `Content-Security-Policy` | default-src 'self' | Restringir recursos |
| `X-DNS-Prefetch-Control` | off | Controlar DNS prefetch |

---

## 6. CORS

### Configuración Restrictiva

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Variables de Entorno

```env
# Solo permitir el frontend específico
CORS_ORIGIN=http://localhost:3001

# En producción
CORS_ORIGIN=https://dynnamo.com
```

---

## 7. Validación de Webhooks

### Firma HMAC-SHA256

```typescript
validateWebhookSignature(
  dataId: string,
  requestId: string,
  signature: string,
): boolean {
  // Header: ts=1234567890,v1=abc123...
  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  // Template de MercadoPago
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;

  // Calcular HMAC con webhook secret
  const expectedHash = crypto
    .createHmac('sha256', this.webhookSecret)
    .update(template)
    .digest('hex');

  return hash === expectedHash;
}
```

---

## 8. Exception Filter para JWT

### Códigos de Error Específicos

```typescript
// jwt-exception.filter.ts
@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const cause = (exception as any).cause;

    let errorCode = 'UNAUTHORIZED';
    let errorMessage = 'No autorizado';

    if (cause instanceof TokenExpiredError) {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'El token ha expirado';
    } else if (cause instanceof JsonWebTokenError) {
      errorCode = 'TOKEN_INVALID';
      errorMessage = 'Token inválido';
    }

    response.status(401).json({
      statusCode: 401,
      errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Códigos Disponibles

| errorCode | Descripción | Acción en Frontend |
|-----------|-------------|-------------------|
| `TOKEN_EXPIRED` | Token expirado | Intentar refresh |
| `TOKEN_INVALID` | Token malformado | Logout |
| `UNAUTHORIZED` | Sin token | Redirect a login |
| `SESSION_INVALID` | Sesión inválida | Logout |
| `USER_NOT_FOUND` | Usuario no existe | Logout |
| `USER_INACTIVE` | Usuario desactivado | Mostrar mensaje |

### Manejo en Frontend

```typescript
// axios.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.errorCode;

      if (errorCode === 'TOKEN_EXPIRED') {
        // Intentar refresh
        return refreshAndRetry(error.config);
      }

      // Otros errores: logout
      useAuthStore.getState().logout();
      window.location.href = '/login?session=expired';
    }
    return Promise.reject(error);
  }
);
```

---

## 9. Hashing de Passwords

### Configuración bcrypt

```typescript
// auth.service.ts
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash al registrar
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verificar al login
const isMatch = await bcrypt.compare(inputPassword, storedHash);
```

### Características

- **Salt rounds**: 10 (balance seguridad/performance)
- **Algoritmo**: bcrypt (resistente a ataques de fuerza bruta)
- **Salt único**: Generado automáticamente por bcrypt

---

## 10. Protección de Datos Sensibles

### Exclusión en Responses

```typescript
// user.service.ts
async findOne(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      // password y refreshToken NUNCA se incluyen
    },
  });
  return user;
}
```

### Variables de Entorno

```env
# Nunca commitear estos valores
JWT_SECRET=super-secret-key-change-in-production
JWT_REFRESH_SECRET=another-super-secret-key
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx
DATABASE_URL=postgresql://...
```

---

## Mejoras Futuras

### Alta Prioridad

| Mejora | Descripción | Impacto |
|--------|-------------|---------|
| HttpOnly Cookies | Mover tokens a cookies | Elimina XSS en tokens |
| 2FA | Autenticación de dos factores | Seguridad adicional |
| Password Reset | Con token temporal | Funcionalidad básica |

### Media Prioridad

| Mejora | Descripción |
|--------|-------------|
| CSRF Protection | Tokens anti-CSRF |
| Input Sanitization | Prevenir XSS almacenado |
| Audit Logging | Registro de acciones sensibles |

### Documentación Relacionada

- [nextjs-api-routes.md](./nextjs-api-routes.md) - Plan para HttpOnly cookies
- [ROADMAP.md](./ROADMAP.md) - Fase 6: Seguridad Avanzada

---

*Última actualización: Enero 2025*
