import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const siteConfigurations = [
  {
    key: 'general',
    value: {
      storeName: 'Mi Tienda',
      storeDescription: 'Tu tienda online de tecnología, moda y más',
      socialLinks: {
        instagram: 'https://instagram.com/mitienda',
        facebook: 'https://facebook.com/mitienda',
      },
      titleSuffix: 'Tu tienda online de confianza',
      keywords: 'tienda online, ecommerce, productos, compras',
    },
  },
  {
    key: 'topbar',
    value: {
      message: '¡Envío gratis en compras mayores a $50.000! 🚚',
      isVisible: true,
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
    },
  },
  {
    key: 'hero',
    value: {
      title: 'Estilo que Define tu Esencia',
      subtitle: 'Descubre piezas exclusivas seleccionadas para quienes buscan lo extraordinario.',
      primaryButtonText: 'Explorar Colección',
      primaryButtonLink: '/products',
      secondaryButtonText: 'Novedades',
      secondaryButtonLink: '/products?sortBy=createdAt&sortOrder=desc',
      backgroundImage: null,
      badge: 'Nueva Colección 2025',
      trustIndicators: [
        { value: '10K+', label: 'Clientes felices' },
        { value: '4.9', label: 'Calificación' },
        { value: '24h', label: 'Envío express' },
      ],
      floatingBadge: '-40% OFF',
      priceOriginal: '$299.00',
      priceDiscounted: '$179.00',
      isVisible: true,
    },
  },
  {
    key: 'special-offer',
    value: {
      title: '¡Oferta Especial de Temporada!',
      subtitle: 'Hasta 40% de descuento en productos seleccionados',
      description: 'Aprovecha nuestras ofertas exclusivas por tiempo limitado. ¡No te lo pierdas!',
      buttonText: 'Ver Ofertas',
      buttonLink: '/ofertas',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isVisible: true,
      backgroundColor: '#f8f9fa',
      trustText: 'Envío gratis en pedidos mayores a $50.000',
    },
  },
  {
    key: 'testimonials',
    value: {
      sectionLabel: 'Testimonios',
      title: 'Lo Que Dicen Nuestros Clientes',
      subtitle: '+10,000 clientes satisfechos nos respaldan',
      isVisible: true,
      items: [
        {
          name: 'María García',
          rating: 5,
          text: 'La calidad superó mis expectativas. El empaque fue impecable y llegó en tiempo récord. Una experiencia de compra premium.',
          product: 'Auriculares Pro X',
        },
        {
          name: 'Carlos Rodríguez',
          rating: 5,
          text: 'Atención al cliente excepcional. Resolvieron mi duda en minutos. La calidad del producto es exactamente como se muestra.',
          product: 'Smartwatch Elite',
        },
        {
          name: 'Ana Martínez',
          rating: 5,
          text: 'Productos premium a precios justos. La experiencia de compra fue fluida y sin complicaciones. Definitivamente regresaré.',
          product: 'Bolso Signature',
        },
      ],
      metrics: {
        averageRating: '4.9',
        totalCustomers: '10K+',
        recommendRate: '98%',
        averageRatingLabel: 'Calificación promedio',
        totalCustomersLabel: 'Clientes felices',
        recommendRateLabel: 'Recomendarían',
      },
    },
  },
  {
    key: 'value-proposition',
    value: {
      sectionLabel: 'Nuestra Promesa',
      title: '¿Por Qué Elegirnos?',
      isVisible: true,
      items: [
        { icon: 'IconTruck', title: 'Envío Express', description: 'Gratis en pedidos mayores a $50.000', colorScheme: 'orchid' },
        { icon: 'IconRefresh', title: 'Devolución Fácil', description: '30 días sin preguntas', colorScheme: 'jade' },
        { icon: 'IconShieldCheck', title: 'Pago 100% Seguro', description: 'Tus datos siempre protegidos', colorScheme: 'jade' },
        { icon: 'IconCreditCard', title: 'Pago en Cuotas', description: 'Hasta 12 meses sin intereses', colorScheme: 'orchid' },
      ],
    },
  },
  {
    key: 'trust-bar',
    value: {
      isVisible: true,
      items: [
        { icon: 'IconTruckDelivery', text: 'Envío Express 24-48h' },
        { icon: 'IconShieldCheck', text: 'Pago 100% Seguro' },
        { icon: 'IconHeadset', text: 'Soporte Premium 24/7' },
      ],
    },
  },
  {
    key: 'product-carousels',
    value: {
      bestSellers: { title: 'Los más vendidos', subtitle: 'Lo que otros están comprando', isVisible: true },
      newProducts: { title: 'Novedades', subtitle: 'Recién llegados a la tienda', isVisible: true },
    },
  },
  {
    key: 'newsletter',
    value: {
      badge: 'EXCLUSIVO PARA MIEMBROS',
      title: 'Únete al Círculo Interior',
      description: 'Recibe acceso anticipado a nuevos lanzamientos, ofertas exclusivas y un **10% de descuento** en tu primera compra.',
      buttonText: 'Unirme',
      successTitle: '¡Bienvenido al círculo!',
      successMessage: 'Revisa tu correo para confirmar tu suscripción.',
      trustText: 'Sin spam. Cancela cuando quieras.',
      benefits: ['10% en primera compra', 'Acceso anticipado', 'Ofertas exclusivas'],
      isVisible: true,
    },
  },
  {
    key: 'category-grid',
    value: {
      sectionLabel: 'Colecciones',
      title: 'Explora por Categoría',
      isVisible: true,
    },
  },
];

async function main() {
  console.log('⚙️  Seed de Site Config (sin borrar otros datos)\n');

  let created = 0;
  let updated = 0;

  for (const config of siteConfigurations) {
    const existing = await prisma.siteConfig.findUnique({
      where: { key: config.key },
    });

    if (existing) {
      await prisma.siteConfig.update({
        where: { key: config.key },
        data: {
          value: config.value,
          isActive: true,
        },
      });
      console.log(`  ✏️  Actualizado: ${config.key}`);
      updated++;
    } else {
      await prisma.siteConfig.create({
        data: {
          key: config.key,
          value: config.value,
          isActive: true,
        },
      });
      console.log(`  ✅ Creado: ${config.key}`);
      created++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  ✅ Creados: ${created}  |  ✏️  Actualizados: ${updated}`);
  console.log(`  📊 Total configs: ${siteConfigurations.length}`);
  console.log(`═══════════════════════════════════════\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
