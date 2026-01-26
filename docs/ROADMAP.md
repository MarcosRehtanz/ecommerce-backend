# Roadmap de Evolución - Dynnamo E-commerce

Este documento describe el plan de evolución del e-commerce Dynnamo, organizado en fases incrementales.

---

## Estado Actual

**Versión: 1.1 - MVP+ Completado**

### Funcionalidades Implementadas
- ✅ Autenticación JWT con refresh tokens y rotación
- ✅ Gestión de usuarios con roles (Admin/User)
- ✅ Catálogo de productos con imágenes base64
- ✅ Carrito con sincronización local/servidor (estrategia MAX)
- ✅ Sistema de pedidos con estados y límites
- ✅ **Pagos con MercadoPago Checkout Pro + Webhooks**
- ✅ Dashboard con reportes y gráficos (Recharts)
- ✅ Notificaciones por email (Handlebars templates)
- ✅ **Categorías con CRUD completo**
- ✅ **Best sellers calculados automáticamente**
- ✅ API documentada con Swagger
- ✅ **Rate limiting (3 niveles)**
- ✅ **Headers de seguridad (Helmet)**
- ✅ **Exception filters con códigos de error**
- ✅ **Auto-expiración de pedidos sin pagar**

### Stack Tecnológico Actual
- **Backend:** NestJS 10 + Prisma 5 + PostgreSQL 16
- **Frontend:** Next.js 14 + Mantine 7.6 + TanStack Query 5 + Zustand 4
- **Pagos:** MercadoPago SDK
- **Infraestructura:** Docker + Docker Compose

---

## Fase 1: Fundamentos Comerciales ✅ COMPLETADA

**Objetivo:** Convertir el MVP en un e-commerce funcional para producción.

**Estado:** ✅ Completada (Enero 2025)

### 1.1 Pasarela de Pago ✅
| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Integrar MercadoPago Checkout Pro | Alta | ✅ Completado |
| Webhooks para confirmar pagos | Alta | ✅ Completado |
| Página de confirmación de pago | Alta | ✅ Completado |
| Manejo de pagos fallidos | Alta | ✅ Completado |
| Reembolsos desde admin | Media | ⏳ Pendiente |

**Modelo de datos:**
```prisma
model Payment {
  id              String        @id @default(uuid())
  orderId         String        @unique
  order           Order         @relation(fields: [orderId], references: [id])
  stripePaymentId String        @unique
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  status          PaymentStatus @default(PENDING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### 1.2 Categorías de Productos ✅
| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Modelo de categorías jerárquicas | Alta | ✅ Completado |
| CRUD de categorías (Admin) | Alta | ✅ Completado |
| Filtro por categoría en catálogo | Alta | ✅ Completado |
| Breadcrumbs de navegación | Media | ⏳ Pendiente |
| Menú de categorías en header | Media | ⏳ Pendiente |

**Modelo de datos:**
```prisma
model Category {
  id          String     @id @default(uuid())
  name        String     @unique
  slug        String     @unique
  description String?
  imageUrl    String?
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### 1.3 Búsqueda Avanzada
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Full-text search en PostgreSQL | Alta | Media |
| Autocompletado en barra de búsqueda | Alta | Media |
| Filtros combinados (precio, categoría, stock) | Alta | Baja |
| Ordenamiento múltiple | Media | Baja |
| Historial de búsquedas | Baja | Baja |

### 1.4 Cupones de Descuento
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de cupones | Alta | Media |
| Aplicar cupón en checkout | Alta | Media |
| Validaciones (fecha, usos, monto mínimo) | Alta | Media |
| CRUD de cupones (Admin) | Media | Baja |
| Cupones por categoría/producto | Baja | Media |

**Modelo de datos:**
```prisma
model Coupon {
  id             String       @id @default(uuid())
  code           String       @unique
  description    String?
  discountType   DiscountType
  discountValue  Decimal      @db.Decimal(10, 2)
  minOrderAmount Decimal?     @db.Decimal(10, 2)
  maxUses        Int?
  usedCount      Int          @default(0)
  validFrom      DateTime
  validUntil     DateTime
  isActive       Boolean      @default(true)
  orders         Order[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

---

## Fase 2: Experiencia de Usuario

**Objetivo:** Mejorar la experiencia del cliente y aumentar conversiones.

**Duración estimada:** 3-4 semanas

### 2.1 Reseñas y Ratings
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de reseñas | Alta | Baja |
| Solo usuarios que compraron pueden reseñar | Alta | Media |
| Mostrar rating promedio en productos | Alta | Baja |
| Filtrar reseñas por rating | Media | Baja |
| Moderación de reseñas (Admin) | Media | Baja |
| Respuestas del vendedor | Baja | Media |

**Modelo de datos:**
```prisma
model Review {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  rating    Int      // 1-5
  title     String?
  comment   String
  isVisible Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId, orderId])
}
```

### 2.2 Wishlist (Lista de Deseos)
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de wishlist | Media | Baja |
| Agregar/quitar de wishlist | Media | Baja |
| Página de wishlist del usuario | Media | Baja |
| Notificar cuando producto en oferta | Baja | Media |
| Compartir wishlist | Baja | Baja |

**Modelo de datos:**
```prisma
model WishlistItem {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}
```

### 2.3 Múltiples Direcciones
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de direcciones | Alta | Baja |
| CRUD de direcciones del usuario | Alta | Baja |
| Seleccionar dirección en checkout | Alta | Media |
| Dirección por defecto | Media | Baja |
| Validación de dirección | Baja | Alta |

**Modelo de datos:**
```prisma
model Address {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  label        String   // "Casa", "Oficina", etc.
  fullName     String
  phone        String
  street       String
  number       String
  apartment    String?
  city         String
  state        String
  postalCode   String
  country      String   @default("MX")
  isDefault    Boolean  @default(false)
  orders       Order[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 2.4 Variantes de Producto
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de variantes (talla, color) | Alta | Alta |
| Selector de variantes en detalle | Alta | Media |
| Stock por variante | Alta | Media |
| Imágenes por variante | Media | Media |
| Precios diferenciados por variante | Baja | Media |

**Modelo de datos:**
```prisma
model ProductVariant {
  id         String      @id @default(uuid())
  productId  String
  product    Product     @relation(fields: [productId], references: [id])
  sku        String      @unique
  name       String      // "Rojo - XL"
  attributes Json        // {"color": "Rojo", "talla": "XL"}
  price      Decimal?    @db.Decimal(10, 2) // null = usar precio base
  stock      Int         @default(0)
  imageUrl   String?
  isActive   Boolean     @default(true)
  cartItems  CartItem[]
  orderItems OrderItem[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

### 2.5 Recuperación de Contraseña
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Endpoint solicitar reset | Alta | Baja |
| Envío de email con token | Alta | Baja |
| Página de reset password | Alta | Baja |
| Expiración de token (1 hora) | Alta | Baja |
| Rate limiting para evitar spam | Media | Baja |

---

## Fase 3: Optimización y Performance

**Objetivo:** Preparar la plataforma para escalar.

**Duración estimada:** 2-3 semanas

### 3.1 Almacenamiento de Imágenes en CDN
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Integrar Cloudinary o AWS S3 | Alta | Media |
| Migrar imágenes base64 existentes | Alta | Media |
| Optimización automática (resize, webp) | Alta | Baja |
| Lazy loading de imágenes | Media | Baja |
| Eliminar imágenes huérfanas | Baja | Media |

### 3.2 Cache con Redis
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Configurar Redis en Docker | Alta | Baja |
| Cache de productos más vistos | Alta | Media |
| Cache de sesiones | Media | Media |
| Invalidación inteligente de cache | Media | Alta |
| Rate limiting con Redis | Media | Baja |

### 3.3 Notificaciones en Tiempo Real
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Configurar Socket.io o SSE | Media | Media |
| Notificación de cambio de estado de orden | Media | Baja |
| Notificación de stock bajo (Admin) | Media | Baja |
| Badge de notificaciones en header | Baja | Baja |
| Historial de notificaciones | Baja | Baja |

### 3.4 PWA (Progressive Web App)
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Configurar next-pwa | Media | Baja |
| Service worker para offline | Media | Media |
| Manifest.json | Media | Baja |
| Push notifications | Baja | Alta |
| Splash screen | Baja | Baja |

---

## Fase 4: Inteligencia de Negocio

**Objetivo:** Añadir herramientas de análisis y automatización.

**Duración estimada:** 3-4 semanas

### 4.1 Analytics Avanzado
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Dashboard de ventas mejorado | Alta | Media |
| Métricas de conversión (funnel) | Alta | Alta |
| Reportes exportables (PDF/Excel) | Media | Media |
| Comparativas periodo vs periodo | Media | Media |
| Integración Google Analytics 4 | Baja | Baja |

### 4.2 Sistema de Recomendaciones
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| "Productos relacionados" básico | Media | Media |
| "Clientes también compraron" | Media | Alta |
| "Basado en tu historial" | Baja | Alta |
| "Más vendidos en categoría" | Baja | Baja |

### 4.3 Email Marketing
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Carrito abandonado (reminder) | Alta | Media |
| Email de producto en wishlist con descuento | Media | Media |
| Newsletter de nuevos productos | Media | Baja |
| Emails de re-engagement | Baja | Media |
| Integración con Mailchimp/Sendinblue | Baja | Media |

### 4.4 Inventario Avanzado
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Historial de movimientos de stock | Media | Media |
| Alertas de stock bajo configurables | Media | Baja |
| Reserva de stock temporal (checkout) | Media | Alta |
| Importación masiva de productos (CSV) | Media | Media |
| Códigos de barras / SKU | Baja | Baja |

---

## Fase 5: Expansión

**Objetivo:** Escalar el negocio a nuevos mercados y canales.

**Duración estimada:** 1-2 meses

### 5.1 Internacionalización (i18n)
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Configurar next-intl | Media | Media |
| Traducciones ES/EN | Media | Baja |
| Selector de idioma | Media | Baja |
| Multi-moneda | Baja | Alta |
| Precios por región | Baja | Alta |

### 5.2 App Móvil
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Configurar React Native / Expo | Baja | Alta |
| Reutilizar lógica de hooks | Baja | Media |
| Navegación nativa | Baja | Media |
| Push notifications nativas | Baja | Media |
| Publicar en stores | Baja | Media |

### 5.3 Marketplace (Multi-vendor)
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modelo de vendedores | Baja | Alta |
| Dashboard por vendedor | Baja | Alta |
| Comisiones y pagos a vendedores | Baja | Alta |
| Verificación de vendedores | Baja | Media |
| Reviews de vendedores | Baja | Media |

### 5.4 Integraciones Externas
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| API pública para integraciones | Baja | Media |
| Integración con ERP (SAP, Odoo) | Baja | Alta |
| Integración con shipping (DHL, FedEx) | Baja | Alta |
| Integración con marketplaces (Amazon, ML) | Baja | Alta |
| Zapier / Make webhooks | Baja | Media |

---

## Fase 6: Enterprise

**Objetivo:** Arquitectura robusta para alto volumen.

**Duración estimada:** 2-3 meses

### 6.1 Microservicios
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Separar servicio de auth | Baja | Alta |
| Separar servicio de órdenes | Baja | Alta |
| Separar servicio de notificaciones | Baja | Alta |
| Message broker (RabbitMQ/Kafka) | Baja | Alta |
| API Gateway | Baja | Alta |

### 6.2 Observabilidad
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Logging centralizado (ELK) | Baja | Media |
| Métricas con Prometheus | Baja | Media |
| Dashboards con Grafana | Baja | Media |
| Distributed tracing (Jaeger) | Baja | Alta |
| Alertas automáticas | Baja | Media |

### 6.3 CI/CD y DevOps
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| GitHub Actions para CI | Media | Baja |
| Tests automatizados en PR | Media | Media |
| Deploy automático a staging | Baja | Media |
| Kubernetes para producción | Baja | Alta |
| Blue-green deployments | Baja | Alta |

### 6.4 Seguridad Avanzada
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Next.js API Routes (HttpOnly cookies) | Alta | Media |
| 2FA (Two-Factor Auth) | Media | Media |
| Rate limiting avanzado | Media | Baja |
| WAF (Web Application Firewall) | Baja | Media |
| Auditoría de accesos | Baja | Media |
| Penetration testing | Baja | Alta |

> **Nota:** La migración a Next.js API Routes está documentada en detalle en [nextjs-api-routes.md](./nextjs-api-routes.md). Esta mejora elimina la vulnerabilidad XSS de tokens en localStorage usando cookies HttpOnly.

---

## Resumen Visual del Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ROADMAP DYNNAMO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MVP+ ───► FASE 1 ────► FASE 2 ────► FASE 3 ────► FASE 4 ────► FASE 5+  │
│   ✅         ✅         PRÓXIMA     Futuro       Futuro       Futuro     │
│                                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │ Auth   │ │ Pagos ✅│ │Reviews │ │ CDN    │ │Analytics│ │ i18n       │  │
│  │ Users  │ │ Categ.✅│ │Wishlist│ │ Redis  │ │Recomend.│ │ Mobile App │  │
│  │ Prods  │ │ Search │ │ Dirs.  │ │ Socket │ │ Email   │ │ Marketplace│  │
│  │ Cart   │ │ Cupones│ │Variants│ │ PWA    │ │Inventory│ │ Enterprise │  │
│  │ Orders │ │Rate Lim│ │Password│ │        │ │         │ │            │  │
│  │ Reports│ │ Helmet │ │        │ │        │ │         │ │            │  │
│  │ Emails │ │Filters │ │        │ │        │ │         │ │            │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘  │
│                                                                          │
│  VALOR:     💰💰💰      ⭐⭐⭐       🚀🚀        📊📊       🌍🏢         │
│  Comercial  UX/Conver.  Performance  Intelig.    Expansión               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Priorización Recomendada

### ✅ Completado (Fase 1)
1. ~~**Pasarela de pago**~~ - ✅ MercadoPago integrado
2. ~~**Categorías**~~ - ✅ CRUD completo
3. ~~**Rate limiting**~~ - ✅ 3 niveles con Throttler
4. ~~**Headers de seguridad**~~ - ✅ Helmet configurado

### Siguiente Sprint (Inmediato)
1. **Cupones de descuento** - Herramienta de marketing
2. **Búsqueda avanzada** - Full-text search en PostgreSQL
3. **Recuperación de contraseña** - Funcionalidad crítica

### Corto Plazo (1-2 meses)
4. **Reseñas y ratings** - Confianza y conversión
5. **Múltiples direcciones** - Flexibilidad en envíos
6. **Wishlist** - Engagement del usuario
7. **Tests unitarios** - Calidad de código

### Mediano Plazo (2-4 meses)
8. **CDN para imágenes** - Performance (S3/Cloudinary)
9. **Variantes de producto** - Catálogo profesional
10. **Cache con Redis** - Escalabilidad
11. **httpOnly cookies** - Seguridad de tokens

---

## Métricas de Éxito por Fase

| Fase | KPIs |
|------|------|
| Fase 1 | Tasa de conversión > 2%, Pagos exitosos > 95% |
| Fase 2 | Tiempo en sitio +20%, Productos con reseñas > 50% |
| Fase 3 | Tiempo de carga < 2s, Uptime > 99.5% |
| Fase 4 | Revenue por email > $X, Tasa de recompra > 30% |
| Fase 5 | Usuarios internacionales > 10%, DAU móvil > 1000 |
| Fase 6 | Requests/seg > 10000, Deploy time < 5min |

---

*Documento actualizado: Enero 2025*
*Versión actual del proyecto: 1.1 (MVP+ con pagos y seguridad)*
