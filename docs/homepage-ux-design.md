# Diseño UX/UI - Homepage E-commerce

Guía de diseño para la página de inicio optimizada para conversión (CRO).

---

## 1. Barra de Anuncios (Top Bar)

### Componentes Clave
- Franja de color contrastante (negro, rojo o color de marca)
- Texto centrado con mensaje urgente
- Icono de "X" para cerrar (descartable)
- Contador regresivo opcional para ofertas limitadas
- Persistencia: No mostrar de nuevo si el usuario la cierra (localStorage)

### Objetivo de UX
Crear **urgencia** y comunicar beneficios inmediatos antes de que el usuario haga scroll. Debe captar la atención sin ser intrusivo.

### Copywriting Sugerido

| Tipo | Ejemplo |
|------|---------|
| Envío gratis | "🚚 ENVÍO GRATIS en pedidos +$999 | Solo por tiempo limitado" |
| Descuento | "🔥 -20% en tu primera compra con código: BIENVENIDO20" |
| Urgencia | "⏰ Últimas 24 horas: Hasta 40% OFF en toda la tienda" |
| Temporada | "🎄 Ofertas de Navidad: Entrega garantizada antes del 24" |

### Implementación Técnica
```tsx
// components/TopBar.tsx
interface TopBarProps {
  message: string;
  link?: string;
  endDate?: Date; // Para countdown
}
```

---

## 2. Encabezado (Header) y Navegación

### Componentes Clave

#### Fila Superior
| Posición | Elemento | Funcionalidad |
|----------|----------|---------------|
| Izquierda | **Logo** | Enlace a Home, tamaño mínimo 120px ancho |
| Centro | **Buscador** | Input con autocompletado, icono de lupa, placeholder dinámico |
| Derecha | **Iconos** | Usuario, Wishlist (corazón), Carrito (con badge contador) |

#### Buscador Inteligente
- Autocompletado con productos, categorías y términos populares
- Mostrar miniatura de producto en sugerencias
- Búsquedas recientes del usuario
- "¿Quisiste decir...?" para errores tipográficos

#### Menú de Navegación
- Categorías principales visibles (máximo 6-7)
- Mega menú en hover con subcategorías e imagen destacada
- Categoría "OFERTAS" o "SALE" en color rojo/destacado
- Mobile: Hamburger menu con navegación jerárquica

### Objetivo de UX
Permitir que el usuario encuentre lo que busca en **menos de 3 clics**. El header debe ser sticky (fijo al hacer scroll) para acceso constante al carrito y búsqueda.

### Copywriting Sugerido

**Placeholder del buscador (rotativo):**
- "Buscar productos, marcas..."
- "¿Qué estás buscando hoy?"
- "Zapatillas, camisetas, accesorios..."

**Menú de categorías:**
```
Hombre | Mujer | Niños | Deportes | Ofertas 🔥 | Nuevos
```

### Implementación Técnica
```tsx
// components/Header.tsx
- Logo con Image optimizado (next/image)
- SearchInput con debounce (300ms)
- CartIcon con badge desde useCartStore
- MegaMenu con Mantine Menu o custom
- Sticky header con useScrollPosition
```

---

## 3. Hero Section (Pantalla Principal)

### Componentes Clave
- **Imagen/Video de fondo**: Alta calidad, producto en contexto lifestyle
- **Overlay oscuro** (20-40% opacity) para legibilidad del texto
- **Título H1**: Propuesta de Valor Única (UVP)
- **Subtítulo**: Beneficio secundario o descripción breve
- **CTA Principal**: Botón grande, color contrastante
- **CTA Secundario** (opcional): Enlace de texto o botón ghost

### Especificaciones Visuales
| Elemento | Especificación |
|----------|----------------|
| Altura | 70-80vh (desktop), 60vh (mobile) |
| Imagen | 1920x1080px mínimo, formato WebP |
| Texto | Alineado izquierda o centro |
| CTA | Mínimo 48px altura, padding 24px horizontal |

### Objetivo de UX
**Impactar emocionalmente** en los primeros 3 segundos. El usuario debe entender qué vendes y por qué eres diferente. El CTA debe ser irresistible.

### Copywriting Sugerido

**Opción 1 - Lifestyle:**
```
H1: "Viste tu mejor versión"
Subtítulo: "Ropa deportiva premium que se adapta a tu ritmo de vida"
CTA: "Explorar Colección" | "Ver Novedades →"
```

**Opción 2 - Beneficio directo:**
```
H1: "Calidad premium, precios justos"
Subtítulo: "Sin intermediarios. Directo de fábrica a tu puerta."
CTA: "Comprar Ahora" | "Ver Ofertas"
```

**Opción 3 - Urgencia:**
```
H1: "Rebajas de Temporada"
Subtítulo: "Hasta 50% OFF en +500 productos seleccionados"
CTA: "Ver Ofertas" | "Solo hasta el domingo"
```

**Opción 4 - Nuevo lanzamiento:**
```
H1: "Nueva Colección Primavera 2025"
Subtítulo: "Diseños exclusivos que no encontrarás en otro lugar"
CTA: "Descubrir Ahora"
```

### Variantes
- **Carrusel**: Máximo 3 slides, autoplay 5-7 segundos, indicadores visibles
- **Video**: Autoplay muted, loop, con fallback a imagen
- **Split Hero**: 50% imagen, 50% texto (mejor para conversión)

---

## 4. Prueba Social (Social Proof) Temprana

### Componentes Clave
- Franja horizontal justo debajo del Hero
- Fondo sutil (gris claro o color de marca al 10%)
- Logos de medios/marcas asociadas O estadísticas de clientes
- Altura compacta (80-100px)

### Opciones de Contenido

**Opción A - Logos de Prensa:**
```
"Como se vio en:" [Logo Forbes] [Logo Vogue] [Logo GQ] [Logo TechCrunch]
```

**Opción B - Estadísticas:**
```
✓ +50,000 clientes felices | ✓ 4.8★ en Google Reviews | ✓ 15 años de experiencia
```

**Opción C - Marcas asociadas:**
```
"Trabajamos con:" [Nike] [Adidas] [Puma] [Under Armour]
```

**Opción D - Garantías:**
```
🚚 Envío en 24-48h | 🔄 Devolución gratis 30 días | 🔒 Pago 100% seguro | 💬 Soporte 24/7
```

### Objetivo de UX
Generar **confianza inmediata** antes de que el usuario vea productos. Reducir la fricción mental de "¿será confiable esta tienda?".

### Implementación
```tsx
// components/SocialProof.tsx
<Flex justify="center" align="center" gap="xl" py="md" bg="gray.0">
  <Group>
    <ThemeIcon variant="light"><IconTruck /></ThemeIcon>
    <Text size="sm">Envío en 24-48h</Text>
  </Group>
  // ... más items
</Flex>
```

---

## 5. Categorías Destacadas (Grid)

### Componentes Clave
- Grid de 3-4 categorías principales
- Imagen de fondo representativa de cada categoría
- Overlay con nombre de categoría
- Efecto hover (zoom imagen o cambio de overlay)
- Enlace a página de categoría

### Layout Sugerido

**Desktop (4 columnas):**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│             │             │             │             │
│   HOMBRE    │   MUJER     │   NIÑOS     │  ACCESORIOS │
│             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Alternativa (2+2 asimétrico):**
```
┌───────────────────┬───────────────────┐
│                   │                   │
│      HOMBRE       │      MUJER        │
│                   │                   │
├─────────┬─────────┼─────────┬─────────┤
│  NIÑOS  │DEPORTES │ OFERTAS │ NUEVOS  │
└─────────┴─────────┴─────────┴─────────┘
```

### Objetivo de UX
**Dirigir el tráfico** rápidamente a las secciones principales. El usuario debe poder navegar sin usar el menú. Ideal para usuarios que "browsean" sin un producto específico en mente.

### Copywriting Sugerido

| Categoría | Texto overlay | CTA |
|-----------|---------------|-----|
| Hombre | "Para Él" | "Ver colección →" |
| Mujer | "Para Ella" | "Explorar →" |
| Ofertas | "Hasta -50%" | "Ver ofertas →" |
| Nuevos | "Recién llegados" | "Descubrir →" |

### Implementación
```tsx
// components/CategoryGrid.tsx
<SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
  {categories.map(cat => (
    <CategoryCard
      key={cat.id}
      image={cat.image}
      title={cat.name}
      href={`/products?category=${cat.slug}`}
    />
  ))}
</SimpleGrid>
```

---

## 6. Best Sellers / Novedades (Carrusel de Productos)

### Componentes Clave

#### Encabezado de Sección
- Título: "Los más vendidos" o "Novedades"
- Subtítulo opcional: "Lo que otros están comprando"
- Link "Ver todos →" alineado a la derecha

#### Tarjeta de Producto
| Elemento | Especificación |
|----------|----------------|
| Imagen | Ratio 1:1 o 3:4, hover para segunda imagen |
| Badges | "Nuevo", "Oferta -20%", "Últimas unidades" |
| Nombre | Máximo 2 líneas, truncate con ellipsis |
| Precio | Destacado, precio anterior tachado si hay descuento |
| Rating | Estrellas + número de reseñas (opcional) |
| CTA | "Añadir al carrito" o icono de carrito |
| Wishlist | Icono de corazón en esquina |

#### Carrusel
- 4-5 productos visibles (desktop)
- 2 productos visibles (mobile)
- Flechas de navegación
- Dots indicadores (opcional)
- Swipe en mobile

### Objetivo de UX
Mostrar **productos de alto rendimiento** para facilitar la decisión de compra. Los best sellers generan confianza ("si otros lo compran, debe ser bueno"). Las novedades generan interés en usuarios recurrentes.

### Copywriting Sugerido

**Títulos de sección:**
- "🔥 Los más vendidos"
- "⭐ Favoritos de nuestros clientes"
- "🆕 Recién llegados"
- "👀 Tendencias de la semana"
- "💝 Los más deseados"

**Badges:**
| Badge | Color | Uso |
|-------|-------|-----|
| NUEVO | Verde | Productos de últimos 14 días |
| -20% OFF | Rojo | Productos con descuento |
| ÚLTIMAS UNIDADES | Naranja | Stock < 5 |
| MÁS VENDIDO | Dorado | Top 10 ventas |
| EXCLUSIVO | Morado | Solo en esta tienda |

### Implementación
```tsx
// components/ProductCarousel.tsx
<section>
  <Group justify="space-between" mb="md">
    <div>
      <Title order={2}>Los más vendidos</Title>
      <Text c="dimmed">Lo que otros están comprando</Text>
    </div>
    <Anchor href="/products?sort=best-sellers">Ver todos →</Anchor>
  </Group>

  <Carousel
    slideSize={{ base: '50%', md: '25%' }}
    slideGap="md"
    loop
    align="start"
  >
    {products.map(product => (
      <Carousel.Slide key={product.id}>
        <ProductCard product={product} />
      </Carousel.Slide>
    ))}
  </Carousel>
</section>

// components/ProductCard.tsx
<Card shadow="sm" padding="lg" radius="md" withBorder>
  <Card.Section pos="relative">
    <Image src={product.image} alt={product.name} />
    {product.isNew && <Badge pos="absolute" top={10} left={10}>NUEVO</Badge>}
    <ActionIcon pos="absolute" top={10} right={10} variant="white">
      <IconHeart />
    </ActionIcon>
  </Card.Section>

  <Text fw={500} mt="md" lineClamp={2}>{product.name}</Text>

  <Group mt="xs">
    {product.originalPrice && (
      <Text td="line-through" c="dimmed">${product.originalPrice}</Text>
    )}
    <Text fw={700} c="blue">${product.price}</Text>
  </Group>

  <Button fullWidth mt="md" onClick={() => addToCart(product)}>
    Añadir al carrito
  </Button>
</Card>
```

---

## 7. Propuesta de Valor (Beneficios)

### Componentes Clave
- Grid horizontal de 4 beneficios
- Icono representativo para cada uno
- Título corto (2-4 palabras)
- Descripción breve (1 línea)
- Fondo sutil para destacar la sección

### Beneficios Comunes E-commerce

| Icono | Título | Descripción |
|-------|--------|-------------|
| 🚚 | Envío Gratis | En pedidos superiores a $999 |
| 🔄 | Devolución Fácil | 30 días para cambios o devoluciones |
| 🔒 | Pago Seguro | Encriptación SSL en todas las transacciones |
| 💬 | Soporte 24/7 | Estamos aquí para ayudarte siempre |
| ✅ | Garantía de Calidad | Productos verificados y auténticos |
| 📦 | Entrega Express | Recibe en 24-48 horas |
| 💳 | Pago en Cuotas | Hasta 12 meses sin intereses |
| 🎁 | Envoltorio Regalo | Disponible en el checkout |

### Objetivo de UX
Responder objeciones comunes **antes** de que el usuario las tenga. Reduce la ansiedad de compra y diferencia de la competencia.

### Copywriting Sugerido

**Opción concisa:**
```
🚚 Envío gratis +$999    🔄 30 días devolución    🔒 Pago seguro    💬 Soporte 24/7
```

**Opción detallada:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   🚚 ENVÍO      │  🔄 DEVOLUCIÓN  │   🔒 PAGO       │   💬 SOPORTE    │
│   GRATIS        │     FÁCIL       │    SEGURO       │     24/7        │
│                 │                 │                 │                 │
│ En pedidos      │ 30 días sin     │ Tus datos       │ WhatsApp, chat  │
│ mayores a $999  │ preguntas       │ 100% protegidos │ o email         │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Implementación
```tsx
// components/ValueProposition.tsx
const benefits = [
  { icon: IconTruck, title: 'Envío Gratis', desc: 'En pedidos +$999' },
  { icon: IconRefresh, title: 'Devolución Fácil', desc: '30 días sin preguntas' },
  { icon: IconShieldCheck, title: 'Pago Seguro', desc: '100% protegido' },
  { icon: IconHeadset, title: 'Soporte 24/7', desc: 'Siempre disponibles' },
];

<SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl" py="xl">
  {benefits.map(b => (
    <Group key={b.title}>
      <ThemeIcon size="xl" radius="md" variant="light">
        <b.icon size={24} />
      </ThemeIcon>
      <div>
        <Text fw={600}>{b.title}</Text>
        <Text size="sm" c="dimmed">{b.desc}</Text>
      </div>
    </Group>
  ))}
</SimpleGrid>
```

---

## 8. Sección de Ofertas Especiales

### Componentes Clave
- Banner de ancho completo o split (imagen + texto)
- Countdown timer si hay fecha límite
- Título impactante con porcentaje de descuento
- CTA urgente
- Productos destacados de la oferta (opcional)

### Objetivo de UX
Crear **FOMO (Fear of Missing Out)**. Las ofertas con tiempo limitado aumentan la urgencia y aceleran la decisión de compra.

### Copywriting Sugerido

**Ofertas por tiempo:**
```
⏰ FLASH SALE - Solo 24 horas
Hasta 50% OFF en selección de productos
[Tiempo restante: 05:23:47]
[VER OFERTAS]
```

**Ofertas de temporada:**
```
🌸 REBAJAS DE PRIMAVERA 🌸
Del 20% al 40% en toda la nueva colección
[COMPRAR AHORA]
```

**Oferta especial:**
```
LLEVA 3, PAGA 2
En todos los accesorios seleccionados
[APROVECHA AHORA]
```

---

## 9. Testimonios / Reviews

### Componentes Clave
- Carrusel de testimonios de clientes
- Foto del cliente (o avatar)
- Nombre y ubicación
- Rating en estrellas
- Texto del testimonio
- Producto comprado (opcional)

### Objetivo de UX
Generar **confianza a través de otros clientes**. Los testimonios reales reducen la incertidumbre y validan la decisión de compra.

### Copywriting Sugerido

**Título de sección:**
- "Lo que dicen nuestros clientes"
- "Miles de clientes felices"
- "Experiencias reales"

**Ejemplos de testimonios:**
```
⭐⭐⭐⭐⭐
"La calidad superó mis expectativas. El envío llegó antes de lo prometido. ¡Definitivamente volveré a comprar!"
— María G., Ciudad de México

⭐⭐⭐⭐⭐
"Excelente atención al cliente. Tuve un problema con la talla y me lo resolvieron en minutos."
— Carlos R., Guadalajara
```

---

## 10. Newsletter / Suscripción

### Componentes Clave
- Sección con fondo diferenciado
- Título con beneficio claro
- Input de email
- Botón de suscripción
- Texto de privacidad/opt-in

### Objetivo de UX
Capturar leads para **retención** y remarketing. Ofrecer algo a cambio (descuento, contenido exclusivo).

### Copywriting Sugerido

**Opción descuento:**
```
📧 Únete y obtén 10% OFF en tu primera compra
Recibe ofertas exclusivas y novedades antes que nadie

[tu@email.com] [SUSCRIBIRME]

✓ Sin spam. Puedes darte de baja cuando quieras.
```

**Opción exclusividad:**
```
Sé el primero en enterarte
Acceso anticipado a nuevas colecciones y ofertas VIP

[tu@email.com] [UNIRME AL CLUB]
```

---

## 11. Footer

### Componentes Clave

| Columna 1 | Columna 2 | Columna 3 | Columna 4 |
|-----------|-----------|-----------|-----------|
| **Sobre Nosotros** | **Ayuda** | **Legal** | **Síguenos** |
| Nuestra historia | Preguntas frecuentes | Términos y condiciones | Instagram |
| Tiendas físicas | Envíos y entregas | Política de privacidad | Facebook |
| Trabaja con nosotros | Devoluciones | Cookies | TikTok |
| Blog | Contacto | | Pinterest |

- Logo y descripción breve
- Métodos de pago aceptados (iconos)
- Sellos de seguridad
- Copyright

### Objetivo de UX
Proporcionar **información de confianza** y **navegación secundaria**. Los usuarios que llegan al footer buscan información específica o validación adicional.

---

## 12. Elementos Flotantes

### Componentes Clave

**Chat de soporte (WhatsApp/Live Chat):**
- Posición: Esquina inferior derecha
- Siempre visible pero no intrusivo
- Badge con "¿Necesitas ayuda?"

**Botón "Volver arriba":**
- Aparece después de scroll
- Posición: Esquina inferior derecha (sobre el chat)

**Pop-up de primera visita (opcional):**
- Descuento de bienvenida
- Delay de 5-10 segundos o exit intent
- Fácil de cerrar

---

## Resumen: Orden de Secciones en Homepage

```
┌─────────────────────────────────────────────────────┐
│ 1. TOP BAR - Mensaje urgente (descartable)          │
├─────────────────────────────────────────────────────┤
│ 2. HEADER - Logo | Buscador | Usuario | Carrito     │
│    NAVEGACIÓN - Categorías del menú                 │
├─────────────────────────────────────────────────────┤
│ 3. HERO SECTION - Imagen + UVP + CTA                │
├─────────────────────────────────────────────────────┤
│ 4. SOCIAL PROOF - Logos o estadísticas              │
├─────────────────────────────────────────────────────┤
│ 5. CATEGORÍAS - Grid de 3-4 categorías              │
├─────────────────────────────────────────────────────┤
│ 6. BEST SELLERS - Carrusel de productos             │
├─────────────────────────────────────────────────────┤
│ 7. PROPUESTA DE VALOR - 4 beneficios con iconos     │
├─────────────────────────────────────────────────────┤
│ 8. OFERTAS ESPECIALES - Banner con countdown        │
├─────────────────────────────────────────────────────┤
│ 9. NOVEDADES - Carrusel de productos nuevos         │
├─────────────────────────────────────────────────────┤
│ 10. TESTIMONIOS - Carrusel de reviews               │
├─────────────────────────────────────────────────────┤
│ 11. NEWSLETTER - Suscripción con incentivo          │
├─────────────────────────────────────────────────────┤
│ 12. FOOTER - Links, info legal, redes sociales      │
└─────────────────────────────────────────────────────┘
│ FLOTANTES: Chat de soporte, Volver arriba           │
└─────────────────────────────────────────────────────┘
```

---

## Métricas de Éxito (KPIs)

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| Bounce Rate | < 40% | Google Analytics |
| Tiempo en página | > 2 minutos | Google Analytics |
| CTR Hero → Productos | > 15% | Event tracking |
| Tasa de scroll | > 70% llega a footer | Hotjar/GA4 |
| Conversión Newsletter | > 3% | Formulario |
| Add to Cart Rate | > 8% | Event tracking |

---

*Documento creado: Enero 2025*
*Basado en mejores prácticas de UX/UI para E-commerce y CRO*
