# Módulo de Carrito - Documentación Funcional

## Índice

1. [Descripción General](#descripción-general)
2. [Modos de Operación](#modos-de-operación)
3. [Flujo de Sincronización](#flujo-de-sincronización)
4. [Tabla de Verdad - Fusión de Carritos](#tabla-de-verdad---fusión-de-carritos)
5. [API Endpoints](#api-endpoints)
6. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
7. [Casos de Uso](#casos-de-uso)
8. [Casos Borde](#casos-borde)

---

## Descripción General

El módulo de carrito permite a los usuarios agregar productos antes de realizar una compra. El sistema soporta dos modos de operación:

- **Carrito Local (Anónimo):** Para usuarios no autenticados, el carrito se almacena en el navegador (localStorage).
- **Carrito en Servidor (Autenticado):** Para usuarios logueados, el carrito se persiste en la base de datos.

Cuando un usuario anónimo inicia sesión, el sistema **fusiona automáticamente** ambos carritos utilizando una estrategia de "máxima cantidad".

---

## Modos de Operación

### Modo Anónimo (Sin Login)

| Característica | Descripción |
|----------------|-------------|
| **Almacenamiento** | localStorage del navegador |
| **Persistencia** | Hasta que se limpie el navegador o localStorage |
| **Sincronización** | No hay sincronización con servidor |
| **Límites** | Sin validación de stock en tiempo real |

### Modo Autenticado (Con Login)

| Característica | Descripción |
|----------------|-------------|
| **Almacenamiento** | Base de datos PostgreSQL |
| **Persistencia** | Permanente hasta que el usuario elimine items |
| **Sincronización** | Tiempo real con el servidor |
| **Límites** | Validación de stock, producto activo, existencia |

---

## Flujo de Sincronización

### Diagrama de Flujo: Login con Carrito Local

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO HACE LOGIN                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  ¿Tiene items en carrito │
                  │  local (localStorage)?   │
                  └──────────────────────────┘
                         │            │
                        SÍ           NO
                         │            │
                         ▼            ▼
              ┌─────────────────┐   ┌─────────────────┐
              │  POST /cart/sync│   │   GET /cart     │
              │  envía items    │   │   obtiene cart  │
              │  locales        │   │   del servidor  │
              └─────────────────┘   └─────────────────┘
                         │                   │
                         ▼                   │
           ┌───────────────────────┐        │
           │   SERVIDOR FUSIONA:   │        │
           │                       │        │
           │ Por cada item local:  │        │
           │ • Si existe en server │        │
           │   → max(local,server) │        │
           │ • Si no existe        │        │
           │   → agregar nuevo     │        │
           │                       │        │
           │ Limitar por stock     │        │
           │ disponible            │        │
           └───────────────────────┘        │
                         │                   │
                         ▼                   ▼
              ┌─────────────────────────────────┐
              │  RESPUESTA: Carrito fusionado   │
              │  con todos los items            │
              └─────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  FRONTEND: Actualiza            │
              │  localStorage con respuesta     │
              │  del servidor                   │
              └─────────────────────────────────┘
```

### Diagrama de Flujo: Operaciones del Carrito

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPERACIÓN EN CARRITO                          │
│            (Agregar, Actualizar, Eliminar, Vaciar)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌──────────────────────────┐
              │  ¿Usuario autenticado?   │
              └──────────────────────────┘
                    │            │
                   SÍ           NO
                    │            │
                    ▼            ▼
         ┌──────────────┐  ┌──────────────┐
         │ 1. Actualiza │  │ Solo actualiza│
         │    UI local  │  │ localStorage │
         │    (optimist)│  │              │
         │              │  │              │
         │ 2. Envía al  │  └──────────────┘
         │    servidor  │
         │              │
         │ 3. Si error: │
         │    revierte  │
         └──────────────┘
```

---

## Tabla de Verdad - Fusión de Carritos

### Estrategia: MÁXIMO (Mayor Cantidad Gana)

Cuando un usuario con items en carrito local hace login, se aplica la siguiente lógica de fusión:

| # | Carrito Local | Carrito Servidor | Stock Disponible | Resultado Final | Explicación |
|---|---------------|------------------|------------------|-----------------|-------------|
| 1 | Producto A: 3 | No existe | 100 | A: **3** | Se agrega del local |
| 2 | No existe | Producto B: 2 | 100 | B: **2** | Se mantiene del servidor |
| 3 | Producto C: 2 | Producto C: 5 | 100 | C: **5** | Máximo: servidor gana |
| 4 | Producto D: 8 | Producto D: 3 | 100 | D: **8** | Máximo: local gana |
| 5 | Producto E: 5 | Producto E: 5 | 100 | E: **5** | Iguales: se mantiene |
| 6 | Producto F: 10 | No existe | 7 | F: **7** | Limitado por stock |
| 7 | Producto G: 3 | Producto G: 8 | 5 | G: **5** | max(3,8)=8, limitado a 5 |
| 8 | Producto inactivo | - | - | **Ignorado** | No se sincroniza |
| 9 | Producto eliminado | - | - | **Ignorado** | No se sincroniza |
| 10 | Producto X: 0 | - | - | **Ignorado** | Cantidad ≤ 0 ignorada |

### Fórmula de Fusión

```
Para cada producto en carrito local:
    SI producto existe Y está activo:
        cantidad_deseada = MAX(cantidad_local, cantidad_servidor)
        cantidad_final = MIN(cantidad_deseada, stock_disponible)

        SI cantidad_final > 0:
            guardar en carrito
```

### Ejemplo Práctico

**Estado inicial:**

| Producto | Local (anónimo) | Servidor (usuario) | Stock |
|----------|-----------------|-------------------|-------|
| Zapatos | 3 | 5 | 100 |
| Camisa | 2 | - | 50 |
| Pantalón | - | 4 | 30 |
| Gorra | 10 | 2 | 8 |

**Después del login y sincronización:**

| Producto | Cantidad Final | Razón |
|----------|----------------|-------|
| Zapatos | 5 | max(3, 5) = 5 |
| Camisa | 2 | nuevo del local |
| Pantalón | 4 | se mantiene del servidor |
| Gorra | 8 | max(10, 2) = 10, limitado a stock 8 |

---

## API Endpoints

### Base URL: `/cart`

| Método | Endpoint | Descripción | Body | Respuesta |
|--------|----------|-------------|------|-----------|
| `GET` | `/cart` | Obtener carrito | - | Cart |
| `POST` | `/cart/items` | Agregar item | `{productId, quantity}` | Cart |
| `PUT` | `/cart/items/:itemId` | Actualizar cantidad | `{quantity}` | Cart |
| `DELETE` | `/cart/items/:itemId` | Eliminar item | - | Cart |
| `DELETE` | `/cart` | Vaciar carrito | - | Cart |
| `POST` | `/cart/sync` | Sincronizar local | `[{productId, quantity}]` | Cart |

### Estructura de Respuesta del Carrito

```json
{
  "id": "uuid-del-carrito",
  "items": [
    {
      "id": "uuid-del-item",
      "productId": "uuid-del-producto",
      "quantity": 2,
      "product": {
        "id": "uuid-del-producto",
        "name": "Nombre del Producto",
        "price": 99.99,
        "stock": 50,
        "imageUrl": "https://...",
        "imageData": "data:image/...",
        "isActive": true
      }
    }
  ],
  "totalItems": 2,
  "totalPrice": 199.98
}
```

---

## Validaciones y Reglas de Negocio

### Al Agregar Item

| Validación | Código Error | Mensaje |
|------------|--------------|---------|
| Producto no existe | 404 | "Producto no encontrado" |
| Producto inactivo | 400 | "El producto no está disponible" |
| Stock insuficiente | 400 | "Stock insuficiente. Disponible: X" |
| Cantidad < 1 | 400 | "La cantidad mínima es 1" |
| ProductId inválido | 400 | "El ID del producto debe ser un UUID válido" |

### Al Actualizar Cantidad

| Validación | Código Error | Mensaje |
|------------|--------------|---------|
| Item no existe en carrito | 404 | "Item no encontrado en el carrito" |
| Stock insuficiente | 400 | "Stock insuficiente. Disponible: X" |
| Cantidad < 1 | 400 | "La cantidad mínima es 1" |

### Al Eliminar Item

| Validación | Código Error | Mensaje |
|------------|--------------|---------|
| Item no existe en carrito | 404 | "Item no encontrado en el carrito" |

### Reglas de Negocio

1. **Un carrito por usuario:** Cada usuario autenticado tiene exactamente un carrito.
2. **Producto único por carrito:** No puede haber duplicados del mismo producto; se actualiza la cantidad.
3. **Stock en tiempo real:** La validación de stock se hace al momento de agregar/actualizar.
4. **Productos activos:** Solo se pueden agregar productos con `isActive = true`.
5. **Carrito automático:** El carrito se crea automáticamente cuando el usuario agrega su primer item.

---

## Casos de Uso

### CU-01: Agregar Producto al Carrito (Anónimo)

**Actor:** Usuario no autenticado
**Precondición:** El producto existe y está activo
**Flujo:**
1. Usuario navega a la página de productos
2. Usuario hace clic en "Agregar al carrito"
3. Sistema agrega producto al localStorage
4. Sistema muestra notificación de éxito
5. Header actualiza contador del carrito

### CU-02: Agregar Producto al Carrito (Autenticado)

**Actor:** Usuario autenticado
**Precondición:** El producto existe, está activo y hay stock
**Flujo:**
1. Usuario navega a la página de productos
2. Usuario hace clic en "Agregar al carrito"
3. Sistema actualiza UI inmediatamente (optimistic)
4. Sistema envía petición POST al servidor
5. Servidor valida stock y agrega al carrito
6. Sistema muestra notificación de éxito

**Flujo alternativo (Stock insuficiente):**
4. Servidor rechaza por stock insuficiente
5. Sistema revierte cambio en UI
6. Sistema muestra notificación de error

### CU-03: Sincronización al Login

**Actor:** Usuario que hace login con carrito local
**Precondición:** Usuario tiene items en localStorage
**Flujo:**
1. Usuario completa formulario de login
2. Sistema autentica al usuario
3. Sistema detecta items en carrito local
4. Sistema envía items al endpoint `/cart/sync`
5. Servidor fusiona carritos usando estrategia "máximo"
6. Sistema actualiza localStorage con carrito fusionado
7. Usuario ve carrito unificado

### CU-04: Modificar Cantidad en Carrito

**Actor:** Usuario (anónimo o autenticado)
**Flujo:**
1. Usuario navega a página del carrito
2. Usuario modifica cantidad en input numérico
3. Sistema valida cantidad (mín: 1, máx: 99)
4. Si autenticado: sincroniza con servidor
5. Sistema actualiza totales

### CU-05: Eliminar Item del Carrito

**Actor:** Usuario (anónimo o autenticado)
**Flujo:**
1. Usuario navega a página del carrito
2. Usuario hace clic en icono de eliminar
3. Sistema elimina item del carrito
4. Si autenticado: sincroniza con servidor
5. Sistema actualiza totales
6. Si carrito vacío: muestra mensaje y botón a productos

### CU-06: Vaciar Carrito

**Actor:** Usuario (anónimo o autenticado)
**Flujo:**
1. Usuario navega a página del carrito
2. Usuario hace clic en "Vaciar carrito"
3. Sistema elimina todos los items
4. Si autenticado: sincroniza con servidor
5. Sistema muestra carrito vacío

---

## Casos Borde

### Producto Eliminado Durante Sesión

**Escenario:** Usuario tiene producto en carrito, admin elimina el producto.
**Comportamiento:**
- El item permanece en el carrito local
- Al sincronizar o recargar desde servidor, el item desaparece
- No se muestra error, simplemente se omite

### Producto Desactivado Durante Sesión

**Escenario:** Usuario tiene producto en carrito, admin lo desactiva.
**Comportamiento:**
- El item permanece en el carrito local
- Al intentar checkout, se validará nuevamente
- En sincronización, productos inactivos se ignoran

### Stock Reducido Durante Sesión

**Escenario:** Usuario tiene 10 unidades en carrito, stock baja a 5.
**Comportamiento:**
- El carrito muestra 10 unidades localmente
- Al sincronizar con servidor, se ajusta a 5
- Al intentar agregar más, error "Stock insuficiente"

### Usuario con Múltiples Dispositivos

**Escenario:** Usuario logueado en PC y móvil.
**Comportamiento:**
- Ambos dispositivos comparten el mismo carrito (servidor)
- Cambios en un dispositivo se reflejan al recargar/sincronizar en el otro
- No hay sincronización en tiempo real (requeriría WebSockets)

### Login Fallido con Carrito Local

**Escenario:** Usuario intenta login pero falla.
**Comportamiento:**
- Carrito local permanece intacto
- No se intenta sincronización
- Usuario puede reintentar login

### Logout con Carrito

**Escenario:** Usuario con carrito hace logout.
**Comportamiento:**
- Carrito del servidor permanece guardado
- Carrito local se mantiene en localStorage (no se limpia)
- Al hacer login de nuevo, se fusionan

---

## Consideraciones de Rendimiento

1. **Actualización Optimista:** La UI se actualiza antes de confirmar con el servidor para mejor UX.
2. **Caché:** TanStack Query cachea el carrito por 1 minuto (staleTime).
3. **Persistencia Local:** Zustand persiste en localStorage para acceso offline.
4. **Imágenes Base64:** Las imágenes pueden incrementar el tamaño de respuesta.

---

## Glosario

| Término | Definición |
|---------|------------|
| **Carrito Local** | Carrito almacenado en localStorage del navegador |
| **Carrito Servidor** | Carrito almacenado en base de datos PostgreSQL |
| **Sincronización** | Proceso de fusionar carrito local con servidor |
| **Actualización Optimista** | Actualizar UI antes de confirmación del servidor |
| **Item** | Entrada en el carrito (producto + cantidad) |
| **Stock** | Cantidad disponible de un producto |

---

*Última actualización: Enero 2026*
