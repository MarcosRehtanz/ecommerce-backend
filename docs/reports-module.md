# Modulo de Reportes (Reports)

## Descripcion General

El modulo de reportes proporciona estadisticas, metricas y visualizaciones para el panel de administracion. Permite monitorear el rendimiento del negocio, identificar tendencias de ventas, y exportar datos para analisis externo.

---

## Funcionalidades

| Funcionalidad | Descripcion |
|---------------|-------------|
| Dashboard Stats | Metricas generales del negocio |
| Tendencia de Ventas | Grafico de ventas por periodo |
| Pedidos por Estado | Distribucion de pedidos |
| Top Productos | Productos mas vendidos |
| Alertas de Stock | Productos con bajo inventario |
| Pedidos Recientes | Ultimas transacciones |
| Exportacion CSV | Descarga de datos |

---

## Dashboard de Estadisticas

### Tarjetas de Metricas

El dashboard muestra 4 tarjetas principales:

| Metrica | Descripcion | Icono | Color |
|---------|-------------|-------|-------|
| **Productos** | Total y activos | Package | Azul |
| **Pedidos** | Total y pendientes | ShoppingCart | Verde |
| **Usuarios** | Total registrados | Users | Violeta |
| **Ingresos** | Total de ventas completadas | CurrencyDollar | Naranja |

### Datos Incluidos

```typescript
{
  products: {
    total: number;      // Total de productos
    active: number;     // Productos activos
    lowStock: number;   // Productos con stock <= 5
  },
  users: {
    total: number;      // Total de usuarios registrados
  },
  orders: {
    total: number;      // Total de pedidos
    pending: number;    // Estado PENDING
    confirmed: number;  // Estado CONFIRMED
    shipped: number;    // Estado SHIPPED
    delivered: number;  // Estado DELIVERED
    cancelled: number;  // Estado CANCELLED
    inProgress: number; // confirmed + shipped
  },
  revenue: {
    total: number;      // Suma de pedidos DELIVERED
  }
}
```

---

## Reporte de Ventas

### Periodos Disponibles

| Periodo | Agrupacion | Ejemplo |
|---------|------------|---------|
| `daily` | Por dia | 2024-01-15 |
| `weekly` | Por semana | 2024-01-08 (inicio de semana) |
| `monthly` | Por mes | 2024-01 |

### Parametros de Consulta

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `startDate` | ISO Date | 30 dias atras | Fecha inicial |
| `endDate` | ISO Date | Hoy | Fecha final |
| `period` | string | daily | Agrupacion temporal |

### Estructura de Respuesta

```typescript
{
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;   // ISO date
  endDate: string;     // ISO date
  summary: {
    totalSales: number;        // Suma total de ventas
    totalOrders: number;       // Cantidad de pedidos
    averageOrderValue: number; // Promedio por pedido
  },
  data: [
    {
      date: string;    // Fecha segun periodo
      orders: number;  // Cantidad de pedidos
      sales: number;   // Monto de ventas
    }
  ]
}
```

### Visualizacion

- **Tipo de grafico**: Area Chart
- **Eje X**: Fecha (segun periodo)
- **Eje Y**: Monto de ventas
- **Selector**: Permite cambiar entre diario/semanal/mensual

---

## Top Productos

### Descripcion

Lista los productos mas vendidos ordenados por cantidad total vendida.

### Parametros

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Cantidad de productos |

### Estructura de Respuesta

```typescript
[
  {
    productId: string;
    name: string;
    price: number;
    imageUrl?: string;
    imageData?: string;
    totalSold: number;      // Unidades vendidas
    totalRevenue: number;   // Ingresos generados
  }
]
```

### Calculo

```sql
SELECT productId, SUM(quantity) as totalSold
FROM OrderItem
GROUP BY productId
ORDER BY totalSold DESC
LIMIT {limit}
```

---

## Alertas de Bajo Stock

### Descripcion

Lista productos activos cuyo stock esta por debajo del umbral definido.

### Parametros

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `threshold` | number | 5 | Umbral de stock minimo |

### Estructura de Respuesta

```typescript
[
  {
    id: string;
    name: string;
    stock: number;      // Stock actual
    price: number;
    imageUrl?: string;
    imageData?: string;
  }
]
```

### Visualizacion en Dashboard

- Se muestra como **alerta naranja** en la parte superior
- Lista los nombres de los productos afectados
- Solo aparece si hay productos con bajo stock

---

## Pedidos Recientes

### Descripcion

Lista los ultimos pedidos realizados en la plataforma.

### Parametros

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `limit` | number | 5 | Cantidad de pedidos |

### Estructura de Respuesta

```typescript
[
  {
    id: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    },
    items: [
      { quantity: number }
    ]
  }
]
```

---

## Grafico de Pedidos por Estado

### Descripcion

Muestra la distribucion de pedidos segun su estado actual.

### Tipo de Grafico

Donut Chart (grafico de dona)

### Datos

| Estado | Color | Etiqueta |
|--------|-------|----------|
| PENDING | Amarillo | Pendientes |
| CONFIRMED | Azul | Confirmados |
| SHIPPED | Cyan | Enviados |
| DELIVERED | Verde | Entregados |
| CANCELLED | Rojo | Cancelados |

### Caracteristicas

- Centro muestra total de pedidos
- Labels con porcentajes
- Tooltip al pasar el mouse
- Estados con 0 pedidos no se muestran

---

## Exportacion de Datos

### Exportar Pedidos

**Endpoint**: `GET /reports/export/orders`

**Parametros**:
- `startDate` (opcional): Fecha inicial
- `endDate` (opcional): Fecha final

**Formato CSV**:

```csv
"ID","Fecha","Cliente","Email","Estado","Productos","Cantidad Items","Total"
"abc123...","2024-01-15T10:30:00Z","Juan Perez","juan@email.com","DELIVERED","Producto A; Producto B","3","150.00"
```

**Columnas**:

| Columna | Descripcion |
|---------|-------------|
| ID | ID completo del pedido |
| Fecha | Fecha ISO de creacion |
| Cliente | Nombre del cliente |
| Email | Email del cliente |
| Estado | Estado del pedido |
| Productos | Lista separada por punto y coma |
| Cantidad Items | Suma de cantidades |
| Total | Monto total |

### Exportar Reporte de Ventas

**Endpoint**: `GET /reports/export/sales`

**Parametros**:
- `startDate` (opcional): Fecha inicial
- `endDate` (opcional): Fecha final
- `period` (opcional): daily, weekly, monthly

**Formato CSV**:

```csv
"Fecha","Pedidos","Ventas"
"2024-01-15","5","250.00"
"2024-01-16","3","180.00"
"","",""
"Resumen","",""
"Total Pedidos","8",""
"Total Ventas","","430.00"
"Promedio por Pedido","","53.75"
```

---

## API Endpoints

### Referencia Completa

| Metodo | Ruta | Descripcion | Parametros |
|--------|------|-------------|------------|
| GET | `/reports/dashboard` | Estadisticas del dashboard | - |
| GET | `/reports/sales` | Reporte de ventas | startDate, endDate, period |
| GET | `/reports/top-products` | Productos mas vendidos | limit |
| GET | `/reports/low-stock` | Productos con bajo stock | threshold |
| GET | `/reports/recent-orders` | Pedidos recientes | limit |
| GET | `/reports/export/orders` | Exportar pedidos CSV | startDate, endDate |
| GET | `/reports/export/sales` | Exportar ventas CSV | startDate, endDate, period |

### Autorizacion

Todos los endpoints requieren:
- Autenticacion JWT
- Rol `ADMIN`

---

## Interfaz de Usuario

### Layout del Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                    [Exportar Pedidos] [Exportar Ventas]
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Productos│ │ Pedidos  │ │ Usuarios │ │ Ingresos │           │
│  │    124   │ │    56    │ │    89    │ │ $12,450  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ Productos con bajo stock: Producto A, Producto B            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Tendencia de Ventas     │ │ Pedidos por Estado      │       │
│  │ [Diario ▼]              │ │                         │       │
│  │                         │ │      ┌─────┐            │       │
│  │    📈 Area Chart        │ │      │Donut│            │       │
│  │                         │ │      └─────┘            │       │
│  │ Total: $X | Pedidos: X  │ │      56 total           │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Productos Mas Vendidos  │ │ Pedidos Recientes       │       │
│  │ ┌────┬─────────┬──────┐ │ │ ┌────┬────────┬───────┐ │       │
│  │ │Img │ Nombre  │ Cant │ │ │ │ ID │ Cliente│ Total │ │       │
│  │ ├────┼─────────┼──────┤ │ │ ├────┼────────┼───────┤ │       │
│  │ │ 🖼️ │ Prod A  │  45  │ │ │ │#abc│ Juan   │ $150  │ │       │
│  │ │ 🖼️ │ Prod B  │  38  │ │ │ │#def│ Maria  │ $200  │ │       │
│  │ └────┴─────────┴──────┘ │ │ └────┴────────┴───────┘ │       │
│  └─────────────────────────┘ └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Utilizados

| Componente | Libreria | Uso |
|------------|----------|-----|
| Card | @mantine/core | Tarjetas de estadisticas |
| AreaChart | @mantine/charts | Grafico de tendencias |
| DonutChart | @mantine/charts | Grafico de distribucion |
| Table | @mantine/core | Tablas de datos |
| Alert | @mantine/core | Alerta de bajo stock |
| Select | @mantine/core | Selector de periodo |
| Button | @mantine/core | Botones de exportacion |
| Skeleton | @mantine/core | Estados de carga |

---

## Actualizacion de Datos

### Frecuencia de Refresco

| Datos | Intervalo | Razon |
|-------|-----------|-------|
| Dashboard Stats | 60 segundos | Balance entre actualidad y carga |
| Sales Report | Manual | Datos historicos, no cambian frecuentemente |
| Top Products | Manual | Ranking estable |
| Low Stock | 60 segundos | Importante para operaciones |
| Recent Orders | Manual | Se actualiza al cargar |

### Refresco Manual

- Recargar la pagina actualiza todos los datos
- No hay boton de refresh individual (los datos se refrescan automaticamente)

---

## Consideraciones Tecnicas

### Rendimiento

- Las consultas usan agregaciones de Prisma (`groupBy`, `aggregate`)
- Los datos de ventas excluyen pedidos cancelados
- El calculo de ingresos solo considera pedidos `DELIVERED`

### Precision Decimal

- Todos los montos usan `Decimal` de Prisma
- Se convierten a `Number` para calculos en JavaScript
- Se formatean con `toFixed(2)` para mostrar

### Fechas

- Se almacenan en UTC
- Se agrupan segun el periodo seleccionado
- El inicio de semana es Domingo (estandar JavaScript)

---

## Casos de Uso

### Caso 1: Revision Diaria

1. Admin abre el dashboard
2. Revisa las tarjetas de metricas
3. Verifica si hay alertas de bajo stock
4. Revisa pedidos pendientes
5. Analiza tendencia de ventas del ultimo mes

### Caso 2: Reporte Mensual

1. Admin selecciona periodo "Mensual" en el grafico
2. Ajusta fechas si es necesario
3. Revisa el resumen de ventas
4. Exporta el reporte a CSV
5. Comparte con el equipo

### Caso 3: Analisis de Inventario

1. Admin revisa alerta de bajo stock
2. Identifica productos afectados
3. Va a la gestion de productos
4. Actualiza el stock

### Caso 4: Identificar Productos Estrella

1. Admin revisa tabla de top productos
2. Identifica los mas vendidos
3. Considera estrategias de promocion
4. Verifica que tengan stock suficiente

---

## Archivos del Modulo

### Backend

```
backend/src/reports/
├── dto/
│   ├── query-reports.dto.ts   # Parametros de consulta
│   └── index.ts               # Exportaciones
├── reports.controller.ts      # Endpoints
├── reports.service.ts         # Logica de negocio
└── reports.module.ts          # Configuracion del modulo
```

### Frontend

```
frontend/src/
├── lib/api/reports.ts         # Funciones API
├── hooks/useReports.ts        # React Query hooks
└── app/admin/page.tsx         # Dashboard (actualizado)
```

---

## Dependencias Agregadas

### Frontend

```json
{
  "@mantine/charts": "^7.6.0",
  "recharts": "^2.12.0"
}
```

---

## Resumen

El modulo de reportes proporciona una vision completa del negocio:

- **Metricas en tiempo real** para decision rapida
- **Graficos interactivos** para analisis visual
- **Alertas automaticas** para gestion proactiva
- **Exportacion de datos** para analisis externo
- **Actualizacion automatica** para datos siempre frescos
