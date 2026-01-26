# Módulo de Pagos - MercadoPago Integration

Este documento describe la integración de pagos con MercadoPago Checkout Pro.

---

## Resumen

| Aspecto | Detalle |
|---------|---------|
| **Proveedor** | MercadoPago |
| **Tipo** | Checkout Pro (redirect) |
| **Webhooks** | Sí, con validación de firma |
| **Estados** | PENDING, APPROVED, REJECTED, CANCELLED |

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Backend   │────▶│ MercadoPago │────▶│   Webhook   │
│  (Frontend) │     │  (NestJS)   │     │    API      │     │  Endpoint   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │                    │
      │ 1. Crear          │                    │                    │
      │    Preferencia    │                    │                    │
      │──────────────────▶│                    │                    │
      │                   │ 2. POST            │                    │
      │                   │    /checkout/      │                    │
      │                   │    preferences     │                    │
      │                   │───────────────────▶│                    │
      │                   │                    │                    │
      │                   │ 3. preference_id   │                    │
      │                   │◀───────────────────│                    │
      │ 4. init_point     │                    │                    │
      │◀──────────────────│                    │                    │
      │                   │                    │                    │
      │ 5. Redirect a     │                    │                    │
      │    MercadoPago    │                    │                    │
      │───────────────────────────────────────▶│                    │
      │                   │                    │                    │
      │                   │                    │ 6. Payment         │
      │                   │                    │    Notification    │
      │                   │                    │───────────────────▶│
      │                   │                    │                    │
      │ 7. Redirect       │                    │                    │
      │    back_url       │                    │                    │
      │◀──────────────────────────────────────│                    │
```

---

## Flujo de Pago

### 1. Crear Preferencia de Pago

```typescript
// Frontend: usePayments.ts
const { mutate: createPreference } = useCreatePaymentPreference();

// Llamada
createPreference(orderId, {
  onSuccess: (data) => {
    // Redirigir a MercadoPago
    window.location.href = data.init_point;
  }
});
```

### 2. Backend crea preferencia

```typescript
// payments.service.ts
async createPreference(orderId: string, userId: string) {
  const order = await this.validateOrder(orderId, userId);

  const preference = new Preference(this.mpClient);
  const result = await preference.create({
    body: {
      items: order.items.map(item => ({
        id: item.productId,
        title: item.product.name,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: 'ARS',
      })),
      back_urls: {
        success: `${frontendUrl}/checkout/success?orderId=${orderId}`,
        failure: `${frontendUrl}/checkout/failure?orderId=${orderId}`,
        pending: `${frontendUrl}/checkout/pending?orderId=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${backendUrl}/payments/webhook`,
    },
  });

  // Guardar mercadoPagoId en la orden
  await this.prisma.order.update({
    where: { id: orderId },
    data: { mercadoPagoId: result.id },
  });

  return {
    preferenceId: result.id,
    init_point: result.init_point,
    sandbox_init_point: result.sandbox_init_point,
  };
}
```

### 3. Usuario paga en MercadoPago

El usuario es redirigido a MercadoPago donde puede pagar con:
- Tarjeta de crédito/débito
- Efectivo (Rapipago, Pago Fácil)
- Transferencia bancaria
- Dinero en cuenta MercadoPago

### 4. Webhook recibe notificación

```typescript
// payments.controller.ts
@Post('webhook')
@Public()
@SkipThrottle()
async handleWebhook(
  @Query('data.id') dataId: string,
  @Query('type') type: string,
  @Headers('x-signature') signature: string,
  @Headers('x-request-id') requestId: string,
  @Body() body: any,
) {
  // Validar firma
  if (!this.paymentsService.validateWebhookSignature(
    dataId, requestId, signature
  )) {
    throw new UnauthorizedException('Invalid signature');
  }

  // Procesar según tipo
  if (type === 'payment') {
    await this.paymentsService.processPaymentWebhook(dataId);
  }

  return { received: true };
}
```

### 5. Actualizar estado de pago

```typescript
// payments.service.ts
async processPaymentWebhook(paymentId: string) {
  const payment = new Payment(this.mpClient);
  const paymentData = await payment.get({ id: paymentId });

  const orderId = paymentData.external_reference;

  // Mapear estado de MercadoPago a nuestro enum
  const statusMap = {
    'approved': PaymentStatus.APPROVED,
    'pending': PaymentStatus.PENDING,
    'rejected': PaymentStatus.REJECTED,
    'cancelled': PaymentStatus.CANCELLED,
  };

  await this.prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: statusMap[paymentData.status],
      paymentId: paymentId,
    },
  });

  // Si el pago fue aprobado, confirmar orden automáticamente
  if (paymentData.status === 'approved') {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
    });
  }
}
```

---

## Estados de Pago

| Estado | Descripción | Acción |
|--------|-------------|--------|
| `PENDING` | Esperando pago | Mostrar botón "Pagar" |
| `APPROVED` | Pago aprobado | Confirmar orden |
| `REJECTED` | Pago rechazado | Permitir reintentar |
| `CANCELLED` | Pago cancelado | Permitir reintentar |

---

## Validación de Firma (Webhook Security)

```typescript
validateWebhookSignature(
  dataId: string,
  requestId: string,
  signature: string,
): boolean {
  if (!signature || !dataId || !requestId) {
    return false;
  }

  // Extraer ts y hash del header
  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!ts || !hash) return false;

  // Construir template y calcular HMAC
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expectedHash = crypto
    .createHmac('sha256', this.webhookSecret)
    .update(template)
    .digest('hex');

  return hash === expectedHash;
}
```

---

## Endpoints

### Cliente

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/payments/create-preference` | Crear preferencia de pago |
| GET | `/payments/:orderId` | Obtener estado de pago |

### Webhook (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/payments/webhook` | Recibir notificaciones de MP |

### Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/payments/admin/sync/:orderId` | Sincronizar estado desde MP |
| POST | `/payments/admin/mark-paid/:orderId` | Marcar como pagado manualmente |

---

## Administración de Pagos

### Sincronizar Pago

Si el webhook no llegó o hubo un problema, el admin puede sincronizar manualmente:

```typescript
// Admin UI
const { mutate: syncPayment } = useAdminSyncPayment();
syncPayment({ orderId, paymentId });
```

Esto consulta directamente a MercadoPago y actualiza el estado.

### Marcar como Pagado

Para pagos fuera del sistema (transferencia, efectivo):

```typescript
const { mutate: markPaid } = useAdminMarkAsPaid();
markPaid({ orderId, paymentId: 'manual-123' });
```

---

## Configuración

### Variables de Entorno (Backend)

```env
# MercadoPago Credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# URLs para back_urls
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

### Variables de Entorno (Frontend)

```env
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-xxx
NEXT_PUBLIC_MP_SANDBOX=false
```

---

## Desarrollo con Webhooks

Para probar webhooks en desarrollo local, usar Cloudflare Tunnels:

```bash
# Exponer backend
cloudflared tunnel --url http://localhost:3000

# Usar la URL del tunnel en BACKEND_URL
```

Ver [cloudflare-tunnels.md](./cloudflare-tunnels.md) para más detalles.

---

## Tarjetas de Prueba

| Tipo | Número | CVV | Vencimiento | Resultado |
|------|--------|-----|-------------|-----------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/30 | Aprobado |
| Visa | 4509 9535 6623 3704 | 123 | 11/30 | Aprobado |
| Amex | 3711 803032 57522 | 1234 | 11/30 | Aprobado |

**Nombre:** APRO (para aprobar) o OTHE (para rechazar)
**DNI:** Cualquier número (ej: 12345678)

---

## Reglas de Negocio

1. **Un pedido pendiente sin pagar por usuario**: No se permite crear nuevos pedidos si hay uno pendiente sin pagar.

2. **No se puede confirmar sin pago**: El admin no puede cambiar el estado a CONFIRMED si el pago no está APPROVED.

3. **Auto-expiración**: Pedidos pendientes sin pagar se cancelan automáticamente después de 24 horas (configurable).

4. **Restauración de stock**: Si un pedido se cancela (manual o por expiración), el stock se restaura automáticamente.

---

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| Invalid signature | Firma de webhook inválida | Verificar WEBHOOK_SECRET |
| Order not found | external_reference incorrecto | Verificar creación de preferencia |
| Payment already processed | Webhook duplicado | Ignorar (idempotencia) |

---

*Última actualización: Enero 2025*
