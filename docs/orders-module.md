# Modulo de Pedidos (Orders)

## Descripcion General

El modulo de pedidos gestiona todo el ciclo de vida de una compra, desde que el cliente confirma su carrito hasta que recibe el producto. Implementa una maquina de estados que garantiza transiciones validas y trazabilidad completa.

---

## Estados del Pedido

| Estado | Nombre en UI | Color | Descripcion |
|--------|--------------|-------|-------------|
| `PENDING` | Pendiente | Amarillo | El cliente realizo la compra. Esperando revision del negocio. |
| `CONFIRMED` | Confirmado | Azul | El negocio acepto el pedido y lo esta preparando. |
| `SHIPPED` | Enviado | Cyan | El pedido salio del almacen y esta en transito. |
| `DELIVERED` | Entregado | Verde | El cliente recibio su pedido. Estado final exitoso. |
| `CANCELLED` | Cancelado | Rojo | El pedido fue cancelado. Estado final fallido. |

---

## Diagrama de Estados

```
                    ┌─────────────┐
                    │   PENDING   │
                    │ (Pendiente) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
     ┌─────────────┐       │   ┌─────────────┐
     │  CANCELLED  │       │   │  CONFIRMED  │
     │ (Cancelado) │       │   │(Confirmado) │
     └─────────────┘       │   └──────┬──────┘
                           │          │
                           │          ├────────────┐
                           │          │            │
                           │          ▼            ▼
                           │  ┌─────────────┐  ┌─────────────┐
                           │  │   SHIPPED   │  │  CANCELLED  │
                           │  │  (Enviado)  │  │ (Cancelado) │
                           │  └──────┬──────┘  └─────────────┘
                           │         │
                           │         ▼
                           │  ┌─────────────┐
                           │  │  DELIVERED  │
                           │  │ (Entregado) │
                           │  └─────────────┘
```

---

## Matriz de Transiciones

| Estado Actual | Estados Permitidos | Estados Bloqueados |
|---------------|-------------------|-------------------|
| `PENDING` | `CONFIRMED`, `CANCELLED` | `SHIPPED`, `DELIVERED` |
| `CONFIRMED` | `SHIPPED`, `CANCELLED` | `PENDING`, `DELIVERED` |
| `SHIPPED` | `DELIVERED` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `DELIVERED` | Ninguno (final) | Todos |
| `CANCELLED` | Ninguno (final) | Todos |

### Reglas de Negocio

1. **No se puede retroceder**: Un pedido confirmado no puede volver a pendiente
2. **Envio es irreversible**: Una vez enviado, no se puede cancelar (el producto ya salio)
3. **Estados finales**: `DELIVERED` y `CANCELLED` son terminales, no permiten cambios
4. **Cancelacion temprana**: Solo se puede cancelar antes de que salga el envio

---

## Permisos por Rol

### Cliente (Usuario Autenticado)

| Accion | Permitido | Condicion |
|--------|-----------|-----------|
| Crear pedido | Si | Tener productos en el carrito |
| Ver sus pedidos | Si | Solo los propios |
| Ver detalle de pedido | Si | Solo los propios |
| Cancelar pedido | Si | Solo si esta en `PENDING` |
| Cambiar estado | No | - |

### Administrador

| Accion | Permitido | Condicion |
|--------|-----------|-----------|
| Ver todos los pedidos | Si | - |
| Ver detalle de cualquier pedido | Si | - |
| Confirmar pedido | Si | Solo desde `PENDING` |
| Marcar como enviado | Si | Solo desde `CONFIRMED` |
| Marcar como entregado | Si | Solo desde `SHIPPED` |
| Cancelar pedido | Si | Solo desde `PENDING` o `CONFIRMED` |
| Ver estadisticas | Si | - |

---

## Flujo de Creacion de Pedido

### Proceso Transaccional

Cuando un cliente confirma su compra, ocurre lo siguiente en una sola transaccion:

```
1. VALIDACION
   ├── Verificar que el carrito no este vacio
   ├── Verificar que todos los productos existan
   └── Verificar stock suficiente para cada producto

2. CREACION DEL PEDIDO
   ├── Crear registro de pedido con estado PENDING
   ├── Crear items del pedido con precios actuales
   └── Calcular y guardar el total

3. ACTUALIZACION DE INVENTARIO
   └── Decrementar stock de cada producto

4. LIMPIEZA
   └── Vaciar el carrito del cliente
```

### Atomicidad

- Si cualquier paso falla, toda la operacion se revierte
- El stock nunca queda inconsistente
- El cliente nunca pierde su carrito si hay error

### Datos Capturados

Al crear el pedido se guarda:

| Campo | Descripcion |
|-------|-------------|
| `userId` | ID del cliente que realizo la compra |
| `status` | Estado inicial: `PENDING` |
| `total` | Suma de (precio × cantidad) de todos los items |
| `shippingAddress` | Direccion de envio (opcional) |
| `notes` | Notas adicionales del cliente (opcional) |
| `items[]` | Lista de productos con cantidad y precio al momento de compra |

---

## Flujo de Cancelacion

### Cancelacion por Cliente

1. Cliente solicita cancelar desde `/orders`
2. Sistema verifica que el pedido este en `PENDING`
3. Sistema verifica que el pedido pertenezca al cliente
4. Se cambia estado a `CANCELLED`
5. Se restaura el stock de todos los productos

### Cancelacion por Admin

1. Admin cancela desde `/admin/orders`
2. Sistema verifica que el pedido este en `PENDING` o `CONFIRMED`
3. Se cambia estado a `CANCELLED`
4. Se restaura el stock de todos los productos

### Restauracion de Stock

```
Por cada item del pedido:
   producto.stock = producto.stock + item.quantity
```

---

## Interfaz de Usuario

### Vista del Cliente

#### Pagina de Checkout (`/checkout`)
- Muestra resumen de productos del carrito
- Permite agregar direccion de envio
- Permite agregar notas
- Boton para confirmar pedido

#### Lista de Pedidos (`/orders`)
- Lista de todos los pedidos del cliente
- Filtro por estado
- Boton de actualizar (refresh)
- Actualizacion automatica cada 30 segundos
- Previsualizacion de productos (primeras 3 imagenes)
- Boton cancelar (solo para pendientes)
- Boton ver detalles

#### Detalle de Pedido (`/orders/[id]`)
- Informacion completa del pedido
- Timeline visual del estado
- Tabla de productos con imagenes
- Resumen de totales
- Boton de actualizar
- Mensaje de exito post-compra

### Vista del Administrador

#### Gestion de Pedidos (`/admin/orders`)

**Tarjetas de Estadisticas:**
- Total de pedidos
- Pedidos pendientes
- Pedidos en proceso (confirmados + enviados)
- Ingresos totales

**Tabla de Pedidos:**
- ID del pedido
- Nombre y email del cliente
- Estado con badge de color
- Cantidad de productos
- Total
- Fecha
- Acciones (ver, cambiar estado)

**Modal de Detalles:**
- Informacion del cliente
- Tabla de productos
- Botones para cambiar estado

---

## Estadisticas Disponibles (Admin)

| Metrica | Descripcion |
|---------|-------------|
| `totalOrders` | Numero total de pedidos en el sistema |
| `byStatus.pending` | Cantidad de pedidos pendientes |
| `byStatus.confirmed` | Cantidad de pedidos confirmados |
| `byStatus.shipped` | Cantidad de pedidos enviados |
| `byStatus.delivered` | Cantidad de pedidos entregados |
| `byStatus.cancelled` | Cantidad de pedidos cancelados |
| `totalRevenue` | Suma del total de pedidos entregados |

---

## API Endpoints

### Endpoints del Cliente

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/orders` | Crear pedido desde carrito |
| `GET` | `/orders` | Listar mis pedidos (paginado) |
| `GET` | `/orders/:id` | Ver detalle de mi pedido |
| `PUT` | `/orders/:id/cancel` | Cancelar mi pedido |

### Endpoints del Administrador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/orders/admin/all` | Listar todos los pedidos |
| `GET` | `/orders/admin/stats` | Obtener estadisticas |
| `GET` | `/orders/admin/:id` | Ver detalle de pedido |
| `PUT` | `/orders/admin/:id/status` | Cambiar estado del pedido |

---

## Actualizacion en Tiempo Real

### Estrategia Implementada: Polling

- Los pedidos se actualizan automaticamente cada 30 segundos
- Boton manual de "Actualizar" para refresh inmediato
- Indicador visual de carga durante actualizacion

### Alternativas para Tiempo Real (No Implementadas)

| Tecnologia | Ventaja | Desventaja |
|------------|---------|------------|
| WebSockets | Actualizacion instantanea | Mayor complejidad, requiere servidor WS |
| Server-Sent Events | Mas simple que WS | Solo unidireccional |
| Polling (actual) | Simple, funciona siempre | Delay de hasta 30 segundos |

---

## Consideraciones de Negocio

### Precio Historico

- El precio se guarda al momento de crear el pedido
- Si el producto cambia de precio despues, el pedido mantiene el precio original
- Esto garantiza integridad financiera

### Stock

- El stock se decrementa inmediatamente al crear el pedido
- El stock se restaura si el pedido es cancelado
- No hay "reserva" de stock, es todo o nada

### Carrito Post-Compra

- El carrito se vacia automaticamente al crear el pedido
- Si la creacion falla, el carrito se mantiene intacto

---

## Casos de Uso

### Caso 1: Compra Exitosa

1. Cliente agrega productos al carrito
2. Cliente va a `/checkout`
3. Cliente confirma el pedido
4. Sistema crea pedido en `PENDING`
5. Admin confirma → `CONFIRMED`
6. Admin marca como enviado → `SHIPPED`
7. Admin marca como entregado → `DELIVERED`

### Caso 2: Cliente Cancela

1. Cliente crea pedido (`PENDING`)
2. Cliente se arrepiente
3. Cliente cancela desde `/orders`
4. Stock se restaura
5. Pedido queda en `CANCELLED`

### Caso 3: Admin Cancela por Falta de Stock

1. Cliente crea pedido (`PENDING`)
2. Admin revisa y nota que el stock real es menor
3. Admin cancela el pedido
4. Stock se restaura
5. Pedido queda en `CANCELLED`

### Caso 4: Intento de Cancelar Pedido Enviado

1. Cliente crea pedido
2. Admin confirma y envia (`SHIPPED`)
3. Cliente intenta cancelar
4. Sistema rechaza: "Solo se pueden cancelar pedidos pendientes"
5. El pedido continua su curso

---

## Archivos del Modulo

### Backend

```
backend/src/orders/
├── dto/
│   ├── create-order.dto.ts
│   ├── update-order-status.dto.ts
│   ├── query-orders.dto.ts
│   └── index.ts
├── orders.controller.ts
├── orders.service.ts
└── orders.module.ts
```

### Frontend

```
frontend/src/
├── lib/api/orders.ts
├── hooks/useOrders.ts
└── app/
    ├── (shop)/
    │   ├── checkout/page.tsx
    │   └── orders/
    │       ├── page.tsx
    │       └── [id]/page.tsx
    └── admin/orders/page.tsx
```

---

## Resumen

El modulo de pedidos implementa un flujo de e-commerce estandar con:

- **5 estados** bien definidos con transiciones controladas
- **Separacion de roles** entre cliente y administrador
- **Transacciones atomicas** para garantizar consistencia
- **Historial de precios** para integridad financiera
- **Gestion de inventario** automatica
- **Interfaz intuitiva** con actualizacion periodica
