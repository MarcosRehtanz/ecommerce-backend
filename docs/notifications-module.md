# Modulo de Notificaciones (Notifications)

## Descripcion General

El modulo de notificaciones maneja el envio de correos electronicos transaccionales a los usuarios. Utiliza NodeMailer para el envio y Handlebars para las plantillas HTML.

---

## Funcionalidades

| Notificacion | Evento Disparador | Destinatario |
|--------------|-------------------|--------------|
| Bienvenida | Registro de usuario | Usuario nuevo |
| Confirmacion de pedido | Creacion de pedido | Cliente |
| Actualizacion de estado | Cambio de estado del pedido | Cliente |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    NotificationsService                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  NodeMailer │  │  Handlebars │  │  Email Templates    │  │
│  │  Transport  │  │  Compiler   │  │  (.hbs files)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SMTP Server                             │
│         (Gmail, SendGrid, Mailgun, etc.)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuracion

### Variables de Entorno

| Variable | Descripcion | Requerido | Default |
|----------|-------------|-----------|---------|
| `SMTP_HOST` | Servidor SMTP | No* | - |
| `SMTP_PORT` | Puerto SMTP | No | 587 |
| `SMTP_USER` | Usuario SMTP | No* | - |
| `SMTP_PASS` | Contrasena SMTP | No* | - |
| `SMTP_FROM` | Email remitente | No | noreply@dynnamo.com |
| `APP_NAME` | Nombre de la app | No | Dynnamo |
| `FRONTEND_URL` | URL del frontend | Si | - |

*Si no se configuran las credenciales SMTP, los emails se registran en consola (modo desarrollo).

### Ejemplo de Configuracion

**Desarrollo (.env):**
```env
# SMTP no configurado - emails se loguean en consola
APP_NAME="Dynnamo"
FRONTEND_URL="http://localhost:3001"
```

**Produccion (.env):**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
SMTP_FROM="noreply@tudominio.com"
APP_NAME="Dynnamo"
FRONTEND_URL="https://tudominio.com"
```

### Proveedores SMTP Comunes

| Proveedor | Host | Puerto | Notas |
|-----------|------|--------|-------|
| Gmail | smtp.gmail.com | 587 | Requiere App Password |
| SendGrid | smtp.sendgrid.net | 587 | Usar API Key como password |
| Mailgun | smtp.mailgun.org | 587 | - |
| Amazon SES | email-smtp.{region}.amazonaws.com | 587 | - |

---

## Plantillas de Email

### Ubicacion

```
backend/src/notifications/templates/
├── welcome.hbs           # Email de bienvenida
├── order-confirmation.hbs # Confirmacion de pedido
└── order-status.hbs      # Actualizacion de estado
```

### Variables Disponibles

#### Todas las plantillas

| Variable | Descripcion |
|----------|-------------|
| `{{appName}}` | Nombre de la aplicacion |

#### welcome.hbs

| Variable | Descripcion |
|----------|-------------|
| `{{name}}` | Nombre del usuario |
| `{{loginUrl}}` | URL para iniciar sesion |

#### order-confirmation.hbs

| Variable | Descripcion |
|----------|-------------|
| `{{orderId}}` | ID corto del pedido (8 chars) |
| `{{customerName}}` | Nombre del cliente |
| `{{items}}` | Array de productos |
| `{{items.name}}` | Nombre del producto |
| `{{items.quantity}}` | Cantidad |
| `{{items.price}}` | Precio unitario |
| `{{total}}` | Total del pedido |
| `{{orderUrl}}` | URL para ver el pedido |

#### order-status.hbs

| Variable | Descripcion |
|----------|-------------|
| `{{orderId}}` | ID corto del pedido |
| `{{customerName}}` | Nombre del cliente |
| `{{status}}` | Codigo de estado (CONFIRMED, etc) |
| `{{statusLabel}}` | Etiqueta del estado (Confirmado, etc) |
| `{{statusMessage}}` | Mensaje descriptivo |
| `{{items}}` | Array de productos |
| `{{total}}` | Total del pedido |
| `{{orderUrl}}` | URL para ver el pedido |

---

## Uso del Servicio

### Metodos Disponibles

```typescript
// Email generico
sendEmail(options: EmailOptions): Promise<boolean>

// Emails especificos
sendWelcomeEmail(name: string, email: string): Promise<boolean>
sendOrderConfirmation(data: OrderEmailData): Promise<boolean>
sendOrderStatusUpdate(data: OrderEmailData): Promise<boolean>
```

### Interfaces

```typescript
interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status?: string;
  statusLabel?: string;
}
```

---

## Integracion con Otros Modulos

### AuthService (Registro)

```typescript
// Despues de crear el usuario
this.notifications.sendWelcomeEmail(user.name, user.email);
```

### OrdersService (Crear Pedido)

```typescript
// Despues de crear el pedido
this.notifications.sendOrderConfirmation({
  orderId: order.id,
  customerName: user.name,
  customerEmail: user.email,
  total: Number(order.total),
  items: order.items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: Number(item.price),
  })),
});
```

### OrdersService (Actualizar Estado)

```typescript
// Despues de actualizar el estado
this.notifications.sendOrderStatusUpdate({
  orderId: updatedOrder.id,
  customerName: updatedOrder.user.name,
  customerEmail: updatedOrder.user.email,
  total: Number(updatedOrder.total),
  status: updatedOrder.status,
  statusLabel: statusLabels[updatedOrder.status],
  items: updatedOrder.items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: Number(item.price),
  })),
});
```

---

## Emails Enviados

### 1. Email de Bienvenida

**Disparador:** Usuario se registra exitosamente

**Contenido:**
- Saludo personalizado
- Lista de funcionalidades disponibles
- Boton para iniciar sesion

**Preview:**
```
Asunto: Bienvenido a Dynnamo

Bienvenido, Juan!

Gracias por registrarte en Dynnamo. Estamos emocionados de tenerte con nosotros.

Ahora puedes:
- Explorar nuestro catalogo de productos
- Agregar productos a tu carrito
- Realizar compras de forma segura
- Hacer seguimiento de tus pedidos

[Iniciar Sesion]
```

### 2. Confirmacion de Pedido

**Disparador:** Usuario crea un nuevo pedido

**Contenido:**
- Numero de pedido
- Tabla de productos
- Total
- Boton para ver el pedido

**Preview:**
```
Asunto: Pedido #abc12345 confirmado

Pedido Confirmado!
Pedido #abc12345

Hola Juan,

Hemos recibido tu pedido y esta siendo procesado.

| Producto    | Cantidad | Precio  |
|-------------|----------|---------|
| Producto A  | 2        | $50.00  |
| Producto B  | 1        | $30.00  |
| Total       |          | $130.00 |

[Ver mi Pedido]
```

### 3. Actualizacion de Estado

**Disparador:** Admin cambia el estado del pedido

**Estados y Mensajes:**

| Estado | Mensaje |
|--------|---------|
| CONFIRMED | Tu pedido ha sido confirmado y esta siendo preparado. |
| SHIPPED | Tu pedido ha sido enviado y esta en camino. |
| DELIVERED | Tu pedido ha sido entregado. Gracias por tu compra! |
| CANCELLED | Tu pedido ha sido cancelado. |

**Preview:**
```
Asunto: Pedido #abc12345 - Enviado

Actualizacion de Pedido
Pedido #abc12345
[ENVIADO]

Hola Juan,

Tu pedido ha sido enviado y esta en camino.

[Ver Detalles del Pedido]
```

---

## Modo Desarrollo

Cuando las credenciales SMTP no estan configuradas, el servicio opera en modo desarrollo:

1. No se envia ningun email real
2. Los emails se registran en la consola del backend
3. El formato del log incluye:
   - Destinatario (TO)
   - Asunto (SUBJECT)
   - Plantilla (TEMPLATE)
   - Contexto (CONTEXT)

**Ejemplo de Log:**
```
[NotificationsService] ==================================================
[NotificationsService] EMAIL TO: user@example.com
[NotificationsService] SUBJECT: Bienvenido a Dynnamo
[NotificationsService] TEMPLATE: welcome
[NotificationsService] CONTEXT: {
  "name": "Juan Perez",
  "loginUrl": "http://localhost:3001/login"
}
[NotificationsService] ==================================================
```

---

## Manejo de Errores

### Comportamiento

- Los errores de envio se registran pero **no interrumpen** el flujo principal
- Las operaciones de negocio (registro, pedido) se completan aunque falle el email
- Los errores se registran con nivel ERROR en los logs

### Ejemplo

```typescript
// El email se envia de forma "fire and forget"
this.notifications.sendWelcomeEmail(user.name, user.email);
// No se espera el resultado, el registro continua
```

### Logs de Error

```
[NotificationsService] ERROR Failed to send email to user@example.com: Connection timeout
```

---

## Personalizacion de Plantillas

### Estructura HTML

Las plantillas usan:
- HTML5 semantico
- CSS inline (para compatibilidad con clientes de email)
- Diseño responsive basico
- Colores consistentes con la marca (#228be6 azul primario)

### Modificar una Plantilla

1. Abrir el archivo `.hbs` correspondiente
2. Modificar el HTML/CSS
3. Usar `{{variable}}` para datos dinamicos
4. Usar `{{#each items}}...{{/each}}` para listas
5. Reiniciar el backend para cargar cambios

### Agregar Nueva Plantilla

1. Crear archivo `nueva-plantilla.hbs` en `/templates`
2. Disenar el HTML con variables Handlebars
3. Crear metodo en `NotificationsService`:

```typescript
async sendNuevaNotificacion(data: DataType): Promise<boolean> {
  return this.sendEmail({
    to: data.email,
    subject: 'Asunto del email',
    template: 'nueva-plantilla',
    context: {
      // variables para la plantilla
    },
  });
}
```

---

## Archivos del Modulo

```
backend/src/notifications/
├── notifications.module.ts     # Modulo (Global)
├── notifications.service.ts    # Servicio principal
└── templates/
    ├── welcome.hbs             # Plantilla bienvenida
    ├── order-confirmation.hbs  # Plantilla confirmacion
    └── order-status.hbs        # Plantilla actualizacion
```

---

## Dependencias

```json
{
  "nodemailer": "^6.x",
  "handlebars": "^4.x",
  "@types/nodemailer": "^6.x" // devDependency
}
```

---

## Consideraciones de Seguridad

1. **Credenciales SMTP**: Nunca commitear credenciales reales
2. **App Passwords**: Usar contrasenas de aplicacion, no la principal
3. **Rate Limiting**: Considerar limites del proveedor SMTP
4. **SPF/DKIM**: Configurar registros DNS para evitar spam

---

## Proximas Mejoras (Opcionales)

| Mejora | Descripcion |
|--------|-------------|
| Queue de emails | Usar Bull/Redis para procesamiento asincrono |
| Reintentos | Reintentar envios fallidos automaticamente |
| Tracking | Rastrear apertura y clicks |
| Preferencias | Permitir usuarios desactivar notificaciones |
| Plantillas admin | Editor de plantillas desde el panel |

---

## Resumen

El modulo de notificaciones proporciona:

- **Emails transaccionales** para eventos clave del sistema
- **Plantillas HTML** profesionales y personalizables
- **Modo desarrollo** que loguea en consola sin enviar
- **Integracion transparente** con modulos existentes
- **Manejo de errores** no bloqueante
