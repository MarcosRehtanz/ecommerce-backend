import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// DATOS DE PRODUCTOS POR CATEGORÍA
// ============================================

// URLs de imágenes reales de Unsplash por categoría/tipo
const productImages = {
  // Laptops
  laptop: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop',
  ],
  // Smartphones
  smartphone: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&h=400&fit=crop',
  ],
  // Tablets
  tablet: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=400&fit=crop',
  ],
  // Auriculares
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop',
  ],
  // Earbuds
  earbuds: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop',
  ],
  // Smartwatches
  smartwatch: [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=400&h=400&fit=crop',
  ],
  // Monitores
  monitor: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop',
  ],
  // Consolas
  console: [
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop',
  ],
  // Gaming accessories
  gaming: [
    'https://images.unsplash.com/photo-1612801799890-4ba4760b6590?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1618499890638-3a0dd4b278cd?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=400&h=400&fit=crop',
  ],
  // Ropa - camisetas
  tshirt: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop',
  ],
  // Pantalones
  pants: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
  ],
  // Zapatillas
  sneakers: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop',
  ],
  // Sudaderas/Hoodies
  hoodie: [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&h=400&fit=crop',
  ],
  // Chaquetas
  jacket: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544923246-77307dd628b0?w=400&h=400&fit=crop',
  ],
  // Aspiradoras
  vacuum: [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400&h=400&fit=crop',
  ],
  // Cocina
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
  ],
  // Smart home
  smarthome: [
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=400&fit=crop',
  ],
  // Muebles
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=400&fit=crop',
  ],
  // Fitness
  fitness: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=400&fit=crop',
  ],
  // Running
  running: [
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=400&fit=crop',
  ],
  // Ciclismo
  cycling: [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=400&fit=crop',
  ],
  // Outdoor
  outdoor: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&h=400&fit=crop',
  ],
  // Skincare
  skincare: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=400&fit=crop',
  ],
  // Maquillaje
  makeup: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
  ],
  // Cabello
  haircare: [
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
  ],
  // Perfumes
  perfume: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=400&fit=crop',
  ],
};

// Función para obtener imagen según el nombre del producto
function getProductImage(productName: string, categoryKey: string): string {
  const name = productName.toLowerCase();

  // Electrónica
  if (name.includes('macbook') || name.includes('laptop') || name.includes('thinkpad') ||
      name.includes('xps') || name.includes('spectre') || name.includes('surface') ||
      name.includes('swift') || name.includes('pavilion') || name.includes('zephyrus') ||
      name.includes('blade') || name.includes('rog')) {
    return productImages.laptop[Math.floor(Math.random() * productImages.laptop.length)];
  }
  if (name.includes('iphone') || name.includes('galaxy s') || name.includes('pixel') ||
      name.includes('oneplus') || name.includes('xiaomi')) {
    return productImages.smartphone[Math.floor(Math.random() * productImages.smartphone.length)];
  }
  if (name.includes('ipad') || name.includes('tab s')) {
    return productImages.tablet[Math.floor(Math.random() * productImages.tablet.length)];
  }
  if (name.includes('airpods pro') || name.includes('buds') || name.includes('wf-')) {
    return productImages.earbuds[Math.floor(Math.random() * productImages.earbuds.length)];
  }
  if (name.includes('airpods max') || name.includes('wh-') || name.includes('quietcomfort') ||
      name.includes('beats') || name.includes('arctis')) {
    return productImages.headphones[Math.floor(Math.random() * productImages.headphones.length)];
  }
  if (name.includes('watch')) {
    return productImages.smartwatch[Math.floor(Math.random() * productImages.smartwatch.length)];
  }
  if (name.includes('monitor') || name.includes('ultragear') || name.includes('odyssey') ||
      name.includes('ultrasharp') || name.includes('proart')) {
    return productImages.monitor[Math.floor(Math.random() * productImages.monitor.length)];
  }
  if (name.includes('playstation') || name.includes('xbox') || name.includes('nintendo') ||
      name.includes('switch')) {
    return productImages.console[Math.floor(Math.random() * productImages.console.length)];
  }
  if (name.includes('dualsense') || name.includes('controller') || name.includes('teclado') ||
      name.includes('mouse') || name.includes('blackwidow')) {
    return productImages.gaming[Math.floor(Math.random() * productImages.gaming.length)];
  }

  // Moda
  if (name.includes('camiseta') || name.includes('polo')) {
    return productImages.tshirt[Math.floor(Math.random() * productImages.tshirt.length)];
  }
  if (name.includes('jean') || name.includes('pantalón') || name.includes('jogger') ||
      name.includes('chino')) {
    return productImages.pants[Math.floor(Math.random() * productImages.pants.length)];
  }
  if (name.includes('nike') || name.includes('adidas') || name.includes('jordan') ||
      name.includes('new balance') || name.includes('converse') || name.includes('vans') ||
      name.includes('puma') || name.includes('reebok') || name.includes('zapatilla')) {
    if (categoryKey === 'moda') {
      return productImages.sneakers[Math.floor(Math.random() * productImages.sneakers.length)];
    }
  }
  if (name.includes('hoodie') || name.includes('sudadera')) {
    return productImages.hoodie[Math.floor(Math.random() * productImages.hoodie.length)];
  }
  if (name.includes('chaqueta') || name.includes('bomber') || name.includes('parka') ||
      name.includes('nuptse') || name.includes('windrunner')) {
    return productImages.jacket[Math.floor(Math.random() * productImages.jacket.length)];
  }

  // Hogar
  if (name.includes('dyson') || name.includes('roomba') || name.includes('roborock') ||
      name.includes('aspiradora') || name.includes('vacuum')) {
    return productImages.vacuum[Math.floor(Math.random() * productImages.vacuum.length)];
  }
  if (name.includes('ninja') || name.includes('instant pot') || name.includes('kitchenaid') ||
      name.includes('nespresso') || name.includes('airfryer') || name.includes('vitamix') ||
      name.includes('thermomix') || name.includes('weber')) {
    return productImages.kitchen[Math.floor(Math.random() * productImages.kitchen.length)];
  }
  if (name.includes('echo') || name.includes('nest') || name.includes('hue') ||
      name.includes('ring') || name.includes('thermostat') || name.includes('smart lock')) {
    return productImages.smarthome[Math.floor(Math.random() * productImages.smarthome.length)];
  }
  if (name.includes('silla') || name.includes('escritorio') || name.includes('sofá') ||
      name.includes('mesa') || name.includes('estantería') || name.includes('herman miller')) {
    return productImages.furniture[Math.floor(Math.random() * productImages.furniture.length)];
  }

  // Deportes
  if (name.includes('mancuerna') || name.includes('bicicleta estática') || name.includes('cinta') ||
      name.includes('banco') || name.includes('kettlebell') || name.includes('banda') ||
      name.includes('colchoneta') || name.includes('trx') || name.includes('peloton')) {
    return productImages.fitness[Math.floor(Math.random() * productImages.fitness.length)];
  }
  if (name.includes('vaporfly') || name.includes('adizero') || name.includes('kayano') ||
      name.includes('forerunner') || name.includes('coros')) {
    return productImages.running[Math.floor(Math.random() * productImages.running.length)];
  }
  if (name.includes('trek') || name.includes('specialized') || name.includes('casco') ||
      name.includes('ciclocomputador') || name.includes('ciclismo')) {
    return productImages.cycling[Math.floor(Math.random() * productImages.cycling.length)];
  }
  if (name.includes('tienda') || name.includes('saco') || name.includes('mochila') ||
      name.includes('bastones') || name.includes('botas')) {
    return productImages.outdoor[Math.floor(Math.random() * productImages.outdoor.length)];
  }

  // Belleza
  if (name.includes('serum') || name.includes('crema') || name.includes('protector') ||
      name.includes('retinol') || name.includes('vitamina c') || name.includes('limpiador') ||
      name.includes('tónico') || name.includes('mascarilla')) {
    return productImages.skincare[Math.floor(Math.random() * productImages.skincare.length)];
  }
  if (name.includes('base') || name.includes('corrector') || name.includes('paleta') ||
      name.includes('máscara') || name.includes('labial') || name.includes('iluminador')) {
    return productImages.makeup[Math.floor(Math.random() * productImages.makeup.length)];
  }
  if (name.includes('shampoo') || name.includes('acondicionador') || name.includes('tratamiento') ||
      name.includes('aceite') || name.includes('secador') || name.includes('plancha') ||
      name.includes('olaplex') || name.includes('moroccanoil') || name.includes('ghd')) {
    return productImages.haircare[Math.floor(Math.random() * productImages.haircare.length)];
  }
  if (name.includes('perfume') || name.includes('chanel') || name.includes('dior') ||
      name.includes('ysl') || name.includes('fragancia')) {
    return productImages.perfume[Math.floor(Math.random() * productImages.perfume.length)];
  }

  // Default por categoría
  const defaults: Record<string, string[]> = {
    electronica: productImages.laptop,
    moda: productImages.sneakers,
    hogar: productImages.kitchen,
    deportes: productImages.fitness,
    belleza: productImages.skincare,
  };

  const categoryImages = defaults[categoryKey] || productImages.laptop;
  return categoryImages[Math.floor(Math.random() * categoryImages.length)];
}

const categories = {
  electronica: {
    name: 'Electrónica',
    products: [
      // Laptops
      { name: 'MacBook Pro 14" M3', description: 'Laptop Apple con chip M3, 16GB RAM, 512GB SSD. Pantalla Liquid Retina XDR.', price: 2399999, stock: 12 },
      { name: 'MacBook Air 13" M2', description: 'Laptop ultradelgada con chip M2, 8GB RAM, 256GB SSD. Batería de hasta 18 horas.', price: 1319999, stock: 20 },
      { name: 'Dell XPS 15', description: 'Laptop premium con Intel Core i7-13700H, 16GB RAM, 512GB SSD, pantalla OLED 3.5K.', price: 1859999, stock: 8 },
      { name: 'HP Spectre x360', description: 'Laptop 2-en-1 convertible con Intel Core i7, 16GB RAM, pantalla táctil 4K OLED.', price: 1679999, stock: 15 },
      { name: 'Lenovo ThinkPad X1 Carbon', description: 'Laptop empresarial ultraligera con Intel Core i7, 16GB RAM, 512GB SSD.', price: 1979999, stock: 10 },
      { name: 'ASUS ROG Zephyrus G14', description: 'Laptop gaming con AMD Ryzen 9, RTX 4060, 16GB RAM, pantalla 165Hz.', price: 1919999, stock: 7 },
      { name: 'Razer Blade 15', description: 'Laptop gaming premium con Intel Core i7, RTX 4070, 16GB RAM, pantalla QHD 240Hz.', price: 2999999, stock: 5 },
      { name: 'Microsoft Surface Laptop 5', description: 'Laptop elegante con Intel Core i7, 16GB RAM, pantalla táctil PixelSense.', price: 1559999, stock: 18 },
      { name: 'Acer Swift 5', description: 'Laptop ultraligera de 1kg con Intel Core i7, 16GB RAM, pantalla 2.5K.', price: 1439999, stock: 22 },
      { name: 'HP Pavilion 15', description: 'Laptop versátil con Intel Core i5, 8GB RAM, 256GB SSD. Ideal para estudiantes.', price: 719999, stock: 35 },

      // Smartphones
      { name: 'iPhone 15 Pro Max', description: 'El iPhone más avanzado con chip A17 Pro, cámara de 48MP, pantalla 6.7" ProMotion.', price: 1439999, stock: 30 },
      { name: 'iPhone 15 Pro', description: 'iPhone con chip A17 Pro, titanio, cámara de 48MP, pantalla 6.1" ProMotion.', price: 1199999, stock: 25 },
      { name: 'iPhone 15', description: 'iPhone con Dynamic Island, chip A16, cámara de 48MP, USB-C.', price: 959999, stock: 40 },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Smartphone premium con S Pen, cámara de 200MP, pantalla 6.8" QHD+ 120Hz.', price: 1559999, stock: 20 },
      { name: 'Samsung Galaxy S24+', description: 'Smartphone con pantalla 6.7" QHD+, cámara de 50MP, batería de 4900mAh.', price: 1199999, stock: 28 },
      { name: 'Samsung Galaxy S24', description: 'Smartphone compacto con pantalla 6.2" FHD+, cámara de 50MP, chip Exynos 2400.', price: 959999, stock: 35 },
      { name: 'Google Pixel 8 Pro', description: 'Smartphone con IA avanzada, cámara de 50MP, chip Tensor G3, 7 años de actualizaciones.', price: 1199999, stock: 15 },
      { name: 'Google Pixel 8', description: 'Smartphone con chip Tensor G3, cámara de 50MP, pantalla 6.2" OLED 120Hz.', price: 839999, stock: 22 },
      { name: 'OnePlus 12', description: 'Flagship killer con Snapdragon 8 Gen 3, cámara Hasselblad, carga 100W.', price: 959999, stock: 18 },
      { name: 'Xiaomi 14 Pro', description: 'Smartphone con cámara Leica, Snapdragon 8 Gen 3, pantalla LTPO AMOLED.', price: 1079999, stock: 12 },

      // Tablets
      { name: 'iPad Pro 12.9" M2', description: 'Tablet profesional con chip M2, pantalla Liquid Retina XDR, compatible con Apple Pencil.', price: 1319999, stock: 15 },
      { name: 'iPad Air 5', description: 'Tablet versátil con chip M1, pantalla 10.9", compatible con Magic Keyboard.', price: 719999, stock: 25 },
      { name: 'iPad 10th Gen', description: 'iPad con chip A14, pantalla 10.9", USB-C, ideal para estudiantes.', price: 539999, stock: 40 },
      { name: 'Samsung Galaxy Tab S9 Ultra', description: 'Tablet premium con pantalla 14.6" AMOLED, Snapdragon 8 Gen 2, S Pen incluido.', price: 1439999, stock: 8 },
      { name: 'Samsung Galaxy Tab S9+', description: 'Tablet con pantalla 12.4" AMOLED, Snapdragon 8 Gen 2, S Pen incluido.', price: 1199999, stock: 12 },

      // Auriculares
      { name: 'AirPods Pro 2', description: 'Auriculares con cancelación de ruido adaptativa, audio espacial, USB-C.', price: 299999, stock: 50 },
      { name: 'AirPods Max', description: 'Auriculares over-ear premium con audio espacial, cancelación de ruido, 20h batería.', price: 659999, stock: 15 },
      { name: 'Sony WH-1000XM5', description: 'Auriculares inalámbricos con la mejor cancelación de ruido, 30h batería.', price: 479999, stock: 25 },
      { name: 'Sony WF-1000XM5', description: 'Earbuds premium con cancelación de ruido líder, audio Hi-Res, IPX4.', price: 359999, stock: 30 },
      { name: 'Bose QuietComfort Ultra', description: 'Auriculares con cancelación de ruido inmersiva, audio espacial, 24h batería.', price: 515999, stock: 20 },
      { name: 'Samsung Galaxy Buds2 Pro', description: 'Earbuds con ANC, audio Hi-Fi 24bit, resistencia IPX7.', price: 275999, stock: 35 },
      { name: 'Beats Studio Pro', description: 'Auriculares con audio espacial personalizado, ANC, USB-C y 3.5mm.', price: 419999, stock: 18 },

      // Smartwatches
      { name: 'Apple Watch Ultra 2', description: 'Smartwatch resistente con GPS de doble frecuencia, 36h batería, titanio.', price: 959999, stock: 12 },
      { name: 'Apple Watch Series 9', description: 'Smartwatch con chip S9, doble toque, pantalla siempre encendida.', price: 479999, stock: 30 },
      { name: 'Samsung Galaxy Watch 6 Classic', description: 'Smartwatch con bisel giratorio, monitoreo de salud avanzado, Wear OS.', price: 479999, stock: 22 },
      { name: 'Garmin Fenix 7X', description: 'Reloj multideporte con GPS, mapas, hasta 28 días de batería.', price: 1079999, stock: 8 },

      // Monitores
      { name: 'LG UltraGear 27GP950', description: 'Monitor gaming 27" 4K 144Hz, Nano IPS, HDMI 2.1, G-Sync/FreeSync.', price: 959999, stock: 15 },
      { name: 'Samsung Odyssey G9', description: 'Monitor curvo ultrawide 49" QHD 240Hz, 1000R, HDR1000.', price: 1559999, stock: 6 },
      { name: 'Dell UltraSharp U2723QE', description: 'Monitor profesional 27" 4K IPS, USB-C 90W, 100% sRGB.', price: 755999, stock: 18 },
      { name: 'ASUS ProArt PA32UCG', description: 'Monitor profesional 32" 4K Mini LED, Dolby Vision, calibrado de fábrica.', price: 3599999, stock: 4 },
      { name: 'BenQ PD2725U', description: 'Monitor diseño 27" 4K IPS, Thunderbolt 3, modo M-Book.', price: 1079999, stock: 10 },

      // Consolas
      { name: 'PlayStation 5', description: 'Consola next-gen con SSD ultrarrápido, ray tracing, control DualSense.', price: 599999, stock: 0 },
      { name: 'PlayStation 5 Digital', description: 'PS5 sin lector de discos, misma potencia, precio reducido.', price: 479999, stock: 5 },
      { name: 'Xbox Series X', description: 'Consola más potente de Xbox con 12 TFLOPs, 1TB SSD, 4K 120fps.', price: 599999, stock: 8 },
      { name: 'Xbox Series S', description: 'Consola compacta next-gen, 100% digital, 512GB SSD.', price: 359999, stock: 20 },
      { name: 'Nintendo Switch OLED', description: 'Consola híbrida con pantalla OLED 7", dock con puerto LAN.', price: 419999, stock: 25 },

      // Accesorios Gaming
      { name: 'DualSense Edge', description: 'Control premium de PS5 con gatillos ajustables, sticks intercambiables.', price: 239999, stock: 15 },
      { name: 'Xbox Elite Controller 2', description: 'Control premium con gatillos ajustables, 40h batería, estuche incluido.', price: 215999, stock: 20 },
      { name: 'Razer BlackWidow V4 Pro', description: 'Teclado mecánico con switches Green, RGB Chroma, reposamuñecas.', price: 275999, stock: 25 },
      { name: 'Logitech G Pro X Superlight', description: 'Mouse gaming ultraligero 63g, sensor HERO 25K, 70h batería.', price: 191999, stock: 30 },
      { name: 'SteelSeries Arctis Nova Pro', description: 'Auriculares gaming con ANC, audio Hi-Fi, base DAC.', price: 419999, stock: 12 },
    ],
  },

  moda: {
    name: 'Moda',
    products: [
      // Camisetas
      { name: 'Camiseta Nike Dri-FIT', description: 'Camiseta deportiva con tecnología de absorción de sudor, ajuste regular.', price: 41999, stock: 100 },
      { name: 'Camiseta Adidas Originals', description: 'Camiseta clásica con logo Trefoil, algodón 100% orgánico.', price: 35999, stock: 120 },
      { name: 'Polo Ralph Lauren Classic', description: 'Polo clásico de algodón piqué con logo bordado.', price: 107999, stock: 60 },
      { name: 'Camiseta Levi\'s Logo', description: 'Camiseta de algodón con el icónico logo batwing.', price: 29999, stock: 80 },
      { name: 'Camiseta Tommy Hilfiger', description: 'Camiseta premium de algodón con logo bordado.', price: 59999, stock: 70 },

      // Pantalones
      { name: 'Jeans Levi\'s 501 Original', description: 'El jean original con corte recto, botones, 100% algodón.', price: 95999, stock: 50 },
      { name: 'Jeans Levi\'s 511 Slim', description: 'Jean slim fit moderno con elastano para mayor comodidad.', price: 83999, stock: 65 },
      { name: 'Pantalón Chino Dockers', description: 'Pantalón chino clásico con corte slim, ideal para oficina.', price: 71999, stock: 55 },
      { name: 'Jogger Nike Tech Fleece', description: 'Pantalón jogger con tejido Tech Fleece, bolsillos con cierre.', price: 131999, stock: 40 },
      { name: 'Pantalón Adidas Tiro', description: 'Pantalón de entrenamiento con las 3 rayas clásicas.', price: 65999, stock: 75 },

      // Zapatillas
      { name: 'Nike Air Max 90', description: 'Zapatillas icónicas con amortiguación Air visible, estilo retro.', price: 155999, stock: 45 },
      { name: 'Nike Air Force 1', description: 'Las clásicas zapatillas de baloncesto convertidas en ícono urbano.', price: 131999, stock: 60 },
      { name: 'Adidas Ultraboost 23', description: 'Zapatillas running con Boost, Primeknit+, Continental.', price: 227999, stock: 35 },
      { name: 'Adidas Stan Smith', description: 'Zapatillas minimalistas de cuero con el clásico trébol verde.', price: 119999, stock: 70 },
      { name: 'New Balance 574', description: 'Zapatillas retro con amortiguación ENCAP, estilo casual.', price: 107999, stock: 55 },
      { name: 'Converse Chuck Taylor All Star', description: 'Las zapatillas de lona más icónicas de la historia.', price: 71999, stock: 90 },
      { name: 'Vans Old Skool', description: 'Zapatillas de skate clásicas con la franja lateral distintiva.', price: 83999, stock: 80 },
      { name: 'Jordan 1 Retro High', description: 'Las legendarias zapatillas de Michael Jordan, estilo OG.', price: 215999, stock: 25 },
      { name: 'Puma RS-X', description: 'Zapatillas chunky con diseño futurista y amortiguación RS.', price: 143999, stock: 40 },
      { name: 'Reebok Classic Leather', description: 'Zapatillas de cuero suave con suela de goma, estilo vintage.', price: 95999, stock: 50 },

      // Sudaderas y Hoodies
      { name: 'Hoodie Nike Sportswear Club', description: 'Sudadera con capucha de tejido French Terry, logo bordado.', price: 71999, stock: 65 },
      { name: 'Hoodie Adidas Essentials', description: 'Sudadera con capucha y las 3 rayas, algodón reciclado.', price: 65999, stock: 70 },
      { name: 'Sudadera Champion Reverse Weave', description: 'Sudadera premium con tejido Reverse Weave anti-encogimiento.', price: 95999, stock: 45 },
      { name: 'Hoodie The North Face', description: 'Sudadera técnica con logo Half Dome, ideal para outdoor.', price: 107999, stock: 40 },
      { name: 'Sudadera Carhartt WIP', description: 'Sudadera de trabajo premium con logo bordado, estilo workwear.', price: 119999, stock: 35 },

      // Chaquetas
      { name: 'Chaqueta The North Face Nuptse', description: 'Chaqueta de plumón 700 fill, resistente al agua, icónica.', price: 359999, stock: 20 },
      { name: 'Chaqueta Nike Windrunner', description: 'Cortavientos clásico con diseño chevron y capucha.', price: 131999, stock: 45 },
      { name: 'Bomber Alpha Industries MA-1', description: 'Chaqueta bomber militar auténtica con forro naranja.', price: 203999, stock: 30 },
      { name: 'Chaqueta Levi\'s Trucker', description: 'Chaqueta de mezclilla clásica con corte tipo camionero.', price: 155999, stock: 40 },
      { name: 'Parka Patagonia Tres 3-in-1', description: 'Parka versátil con chaqueta interior removible, impermeable.', price: 539999, stock: 15 },
    ],
  },

  hogar: {
    name: 'Hogar',
    products: [
      // Aspiradoras
      { name: 'Dyson V15 Detect', description: 'Aspiradora inalámbrica con láser detector de polvo, 60 min batería.', price: 899999, stock: 15 },
      { name: 'Roomba j7+', description: 'Robot aspirador con autovaciado, evita obstáculos con IA.', price: 959999, stock: 12 },
      { name: 'Roborock S8 Pro Ultra', description: 'Robot aspirador y fregona con autovaciado y autolimpieza.', price: 1919999, stock: 8 },
      { name: 'Xiaomi Robot Vacuum X10+', description: 'Robot aspirador con estación de autovaciado, mapeo LDS.', price: 719999, stock: 20 },
      { name: 'Dyson V12 Slim', description: 'Aspiradora inalámbrica ligera con pantalla LCD, 60 min batería.', price: 659999, stock: 18 },

      // Cocina
      { name: 'Ninja Foodi 11-in-1', description: 'Olla multifunción: presión, air fryer, deshidratador, 6.5L.', price: 275999, stock: 25 },
      { name: 'Instant Pot Duo Crisp', description: 'Olla a presión y air fryer 11-en-1, 8 cuartos.', price: 215999, stock: 30 },
      { name: 'KitchenAid Artisan 5KSM185', description: 'Batidora de pie profesional 4.8L, 10 velocidades, metal fundido.', price: 539999, stock: 15 },
      { name: 'Nespresso Vertuo Next', description: 'Cafetera de cápsulas con 5 tamaños de taza, espumador incluido.', price: 239999, stock: 35 },
      { name: 'Philips Airfryer XXL', description: 'Freidora de aire 7.3L, tecnología RapidAir, pantalla digital.', price: 359999, stock: 22 },
      { name: 'Vitamix E310', description: 'Licuadora profesional con motor 2HP, cuchillas de acero inoxidable.', price: 419999, stock: 18 },
      { name: 'Thermomix TM6', description: 'Robot de cocina multifunción con guía de cocina integrada.', price: 1799999, stock: 5 },
      { name: 'Weber Spirit E-310', description: 'Parrilla a gas con 3 quemadores, 529 pulgadas cuadradas.', price: 659999, stock: 10 },

      // Smart Home
      { name: 'Amazon Echo Dot 5', description: 'Altavoz inteligente con Alexa, sonido mejorado, reloj LED.', price: 59999, stock: 80 },
      { name: 'Google Nest Hub 2', description: 'Pantalla inteligente 7" con Google Assistant, sensor de sueño.', price: 119999, stock: 45 },
      { name: 'Philips Hue Starter Kit', description: 'Kit de 4 bombillas inteligentes + Bridge, 16 millones de colores.', price: 239999, stock: 30 },
      { name: 'Ring Video Doorbell Pro 2', description: 'Timbre con video 1536p, detección de movimiento 3D.', price: 299999, stock: 25 },
      { name: 'Nest Learning Thermostat', description: 'Termostato inteligente que aprende tus preferencias.', price: 299999, stock: 20 },
      { name: 'August Wi-Fi Smart Lock', description: 'Cerradura inteligente con Wi-Fi integrado, auto-lock.', price: 275999, stock: 22 },
      { name: 'Ecobee SmartThermostat', description: 'Termostato con Alexa integrada, sensor de habitación incluido.', price: 263999, stock: 18 },

      // Muebles
      { name: 'Silla Ergonómica Herman Miller Aeron', description: 'Silla de oficina premium con soporte lumbar PostureFit.', price: 1674999, stock: 8 },
      { name: 'Escritorio Elevable FlexiSpot E7', description: 'Escritorio de pie motorizado, altura 58-123cm, hasta 125kg.', price: 659999, stock: 15 },
      { name: 'Sofá IKEA Friheten', description: 'Sofá cama de 3 plazas con almacenamiento, tela gris.', price: 719999, stock: 12 },
      { name: 'Mesa de Centro IKEA Lack', description: 'Mesa auxiliar minimalista 90x55cm, fácil montaje.', price: 35999, stock: 50 },
      { name: 'Estantería IKEA Billy', description: 'Estantería clásica 80x202cm, 6 estantes ajustables.', price: 95999, stock: 35 },
    ],
  },

  deportes: {
    name: 'Deportes',
    products: [
      // Fitness
      { name: 'Set de Mancuernas Bowflex SelectTech', description: 'Mancuernas ajustables 2-24kg cada una, sistema de selección rápida.', price: 539999, stock: 15 },
      { name: 'Bicicleta Estática Peloton Bike+', description: 'Bicicleta con pantalla giratoria 24", clases en vivo y bajo demanda.', price: 2994999, stock: 5 },
      { name: 'Cinta de Correr NordicTrack 1750', description: 'Cinta con pantalla 10", inclinación -3% a 15%, iFit incluido.', price: 2159999, stock: 8 },
      { name: 'Banco de Pesas Ajustable', description: 'Banco multiposición para entrenamiento en casa, hasta 300kg.', price: 239999, stock: 25 },
      { name: 'Kettlebell Ajustable Bowflex', description: 'Kettlebell 3.5-18kg en una sola unidad, selector de peso.', price: 215999, stock: 20 },
      { name: 'Banda de Resistencia Set', description: 'Set de 5 bandas con diferentes resistencias, con asas y anclaje.', price: 41999, stock: 60 },
      { name: 'Colchoneta Yoga Premium', description: 'Mat de yoga antideslizante 6mm, TPE ecológico, 183x61cm.', price: 59999, stock: 70 },
      { name: 'TRX Pro 4 System', description: 'Sistema de entrenamiento en suspensión profesional.', price: 299999, stock: 18 },

      // Running
      { name: 'Nike ZoomX Vaporfly Next% 3', description: 'Zapatillas de competición con placa de carbono, las más rápidas.', price: 311999, stock: 20 },
      { name: 'Adidas Adizero Adios Pro 3', description: 'Zapatillas de maratón con doble placa de carbono.', price: 299999, stock: 15 },
      { name: 'ASICS Gel-Kayano 30', description: 'Zapatillas de estabilidad premium con gel en talón y antepié.', price: 215999, stock: 35 },
      { name: 'Garmin Forerunner 965', description: 'Reloj GPS running con pantalla AMOLED, mapas, música.', price: 719999, stock: 12 },
      { name: 'Coros Pace 3', description: 'Reloj GPS ultraligero con 24 días de batería, modo multideporte.', price: 275999, stock: 25 },

      // Ciclismo
      { name: 'Bicicleta Trek Domane SL 5', description: 'Bicicleta de ruta con cuadro carbono OCLV, Shimano 105.', price: 3959999, stock: 4 },
      { name: 'Bicicleta Specialized Roubaix', description: 'Bicicleta endurance con Future Shock 2.0, Shimano Ultegra.', price: 5399999, stock: 3 },
      { name: 'Casco Giro Aether MIPS', description: 'Casco aerodinámico con MIPS Spherical, ventilación superior.', price: 359999, stock: 15 },
      { name: 'Ciclocomputador Garmin Edge 840', description: 'GPS con pantalla táctil, mapas, entrenamiento guiado.', price: 539999, stock: 18 },
      { name: 'Zapatillas Ciclismo Shimano RC9', description: 'Zapatillas de carretera con suela de carbono, BOA Li2.', price: 479999, stock: 12 },

      // Outdoor
      { name: 'Tienda de Campaña MSR Hubba Hubba', description: 'Tienda ultraligera 2 personas, 1.5kg, resistente al agua.', price: 599999, stock: 10 },
      { name: 'Saco de Dormir Marmot Trestles', description: 'Saco sintético -9°C, compresible, ideal para montaña.', price: 191999, stock: 20 },
      { name: 'Mochila Osprey Atmos AG 65', description: 'Mochila de senderismo con suspensión Anti-Gravity, 65L.', price: 359999, stock: 15 },
      { name: 'Bastones Trekking Black Diamond', description: 'Bastones telescópicos de aluminio con empuñaduras de corcho.', price: 155999, stock: 30 },
      { name: 'Botas Salomon X Ultra 4', description: 'Botas de senderismo ligeras con Advanced Chassis, Gore-Tex.', price: 215999, stock: 25 },
    ],
  },

  belleza: {
    name: 'Belleza',
    products: [
      // Skincare
      { name: 'Serum La Roche-Posay Hyalu B5', description: 'Serum con ácido hialurónico y vitamina B5, hidratación intensa.', price: 47999, stock: 45 },
      { name: 'Crema CeraVe Moisturizing', description: 'Crema hidratante con ceramidas y ácido hialurónico, sin fragancia.', price: 22999, stock: 80 },
      { name: 'Protector Solar La Roche-Posay Anthelios', description: 'Protector SPF 50+ textura invisible, resistente al agua.', price: 41999, stock: 60 },
      { name: 'Retinol Paula\'s Choice 1%', description: 'Tratamiento de retinol puro para arrugas y textura.', price: 70999, stock: 35 },
      { name: 'Vitamina C Drunk Elephant C-Firma', description: 'Serum de vitamina C 15% con ácido ferúlico, antioxidante.', price: 94999, stock: 25 },
      { name: 'Limpiador Cetaphil Gentle', description: 'Limpiador suave para piel sensible, sin jabón, pH balanceado.', price: 17999, stock: 90 },
      { name: 'Tónico Pixi Glow Tonic', description: 'Tónico exfoliante con 5% ácido glicólico, ilumina la piel.', price: 35999, stock: 50 },
      { name: 'Mascarilla Aztec Secret', description: 'Mascarilla de arcilla bentonita 100% natural, limpieza profunda.', price: 15999, stock: 70 },

      // Maquillaje
      { name: 'Base Maybelline Fit Me', description: 'Base mate y sin poros, cobertura natural, 40 tonos.', price: 15999, stock: 100 },
      { name: 'Corrector NARS Radiant Creamy', description: 'Corrector cremoso de cobertura media a completa.', price: 39999, stock: 55 },
      { name: 'Paleta Urban Decay Naked 3', description: 'Paleta de 12 sombras tonos rosados y neutros.', price: 65999, stock: 40 },
      { name: 'Máscara Benefit BADgal BANG!', description: 'Máscara de pestañas volumen extremo, 36h duración.', price: 33999, stock: 65 },
      { name: 'Labial MAC Ruby Woo', description: 'Labial mate retro rojo icónico, larga duración.', price: 25999, stock: 75 },
      { name: 'Iluminador Fenty Beauty Killawatt', description: 'Iluminador en dúo con acabado luminoso, buildable.', price: 43999, stock: 45 },

      // Cabello
      { name: 'Shampoo Olaplex No.4', description: 'Shampoo reparador de enlaces, para cabello dañado.', price: 34999, stock: 55 },
      { name: 'Acondicionador Olaplex No.5', description: 'Acondicionador reparador, hidrata y fortalece.', price: 34999, stock: 55 },
      { name: 'Tratamiento Olaplex No.3', description: 'Tratamiento semanal para reparar enlaces del cabello.', price: 34999, stock: 50 },
      { name: 'Aceite Moroccanoil Treatment', description: 'Aceite de argán para brillo y suavidad instantánea.', price: 55999, stock: 40 },
      { name: 'Secador Dyson Supersonic', description: 'Secador con motor digital V9, previene daño por calor.', price: 515999, stock: 12 },
      { name: 'Plancha ghd Platinum+', description: 'Plancha inteligente que predice necesidades del cabello.', price: 335999, stock: 18 },

      // Fragancias
      { name: 'Perfume Chanel No.5 EDP', description: 'Fragancia icónica floral aldehydic, 100ml.', price: 191999, stock: 20 },
      { name: 'Perfume Dior Sauvage EDT', description: 'Fragancia masculina amaderada especiada, 100ml.', price: 143999, stock: 25 },
      { name: 'Perfume YSL Black Opium EDP', description: 'Fragancia adictiva con café y vainilla, 90ml.', price: 161999, stock: 22 },
      { name: 'Perfume Bleu de Chanel EDP', description: 'Fragancia masculina amaderada aromática, 100ml.', price: 179999, stock: 18 },
    ],
  },
};

// ============================================
// USUARIOS
// ============================================

// ============================================
// CATEGORÍAS PARA LA BASE DE DATOS
// ============================================

const categoryDefinitions = [
  {
    key: 'electronica',
    name: 'Electrónica',
    slug: 'electronica',
    description: 'Dispositivos electrónicos, gadgets, computadoras, smartphones y más',
    displayOrder: 1,
  },
  {
    key: 'moda',
    name: 'Moda',
    slug: 'moda',
    description: 'Ropa, calzado y accesorios para hombre y mujer',
    displayOrder: 2,
  },
  {
    key: 'hogar',
    name: 'Hogar',
    slug: 'hogar',
    description: 'Electrodomésticos, muebles y artículos para el hogar',
    displayOrder: 3,
  },
  {
    key: 'deportes',
    name: 'Deportes',
    slug: 'deportes',
    description: 'Equipamiento deportivo, fitness y outdoor',
    displayOrder: 4,
  },
  {
    key: 'belleza',
    name: 'Belleza',
    slug: 'belleza',
    description: 'Skincare, maquillaje, cuidado del cabello y fragancias',
    displayOrder: 5,
  },
];

// ============================================
// CONFIGURACIONES DEL SITIO
// ============================================

const siteConfigurations = [
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
      title: 'Descubre lo Mejor en Tecnología y Moda',
      subtitle: 'Encuentra productos de las mejores marcas con envío gratis y garantía de satisfacción',
      primaryButtonText: 'Ver Productos',
      primaryButtonLink: '/productos',
      secondaryButtonText: 'Ofertas Especiales',
      secondaryButtonLink: '/ofertas',
      backgroundImage: null,
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
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
      isVisible: true,
      backgroundColor: '#f8f9fa',
    },
  },
];

// ============================================
// USUARIOS
// ============================================

const users = [
  { email: 'admin@example.com', name: 'Administrador', password: 'Admin123!', role: 'ADMIN' as Role },
  { email: 'manager@example.com', name: 'Manager', password: 'Manager123!', role: 'ADMIN' as Role },
  { email: 'user@example.com', name: 'Usuario Demo', password: 'User123!', role: 'USER' as Role },
  { email: 'maria.garcia@email.com', name: 'María García', password: 'User123!', role: 'USER' as Role },
  { email: 'carlos.lopez@email.com', name: 'Carlos López', password: 'User123!', role: 'USER' as Role },
  { email: 'ana.martinez@email.com', name: 'Ana Martínez', password: 'User123!', role: 'USER' as Role },
  { email: 'juan.rodriguez@email.com', name: 'Juan Rodríguez', password: 'User123!', role: 'USER' as Role },
  { email: 'laura.sanchez@email.com', name: 'Laura Sánchez', password: 'User123!', role: 'USER' as Role },
  { email: 'pedro.gomez@email.com', name: 'Pedro Gómez', password: 'User123!', role: 'USER' as Role },
  { email: 'sofia.fernandez@email.com', name: 'Sofía Fernández', password: 'User123!', role: 'USER' as Role },
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgo));
  return date;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Datos limpiados\n');

  // Crear categorías
  console.log('📂 Creando categorías...');
  const createdCategories: Record<string, any> = {};
  for (const catDef of categoryDefinitions) {
    const category = await prisma.category.create({
      data: {
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        displayOrder: catDef.displayOrder,
        isActive: true,
      },
    });
    createdCategories[catDef.key] = category;
    console.log(`  ✓ ${category.name}`);
  }
  console.log(`✓ ${categoryDefinitions.length} categorías creadas\n`);

  // Crear configuraciones del sitio
  console.log('⚙️ Creando configuraciones del sitio...');
  for (const config of siteConfigurations) {
    await prisma.siteConfig.create({
      data: {
        key: config.key,
        value: config.value,
        isActive: true,
      },
    });
    console.log(`  ✓ ${config.key}`);
  }
  console.log(`✓ ${siteConfigurations.length} configuraciones creadas\n`);

  // Crear usuarios
  console.log('👥 Creando usuarios...');
  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ ${user.role}: ${user.email}`);
  }
  console.log(`✓ ${createdUsers.length} usuarios creados\n`);

  // Crear productos
  console.log('📦 Creando productos...');
  const createdProducts = [];
  let productCount = 0;

  for (const [categoryKey, category] of Object.entries(categories)) {
    console.log(`\n  📁 Categoría: ${category.name}`);
    const categoryId = createdCategories[categoryKey]?.id;

    for (const productData of category.products) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          imageUrl: getProductImage(productData.name, categoryKey),
          isActive: productData.stock > 0 || Math.random() > 0.3, // Algunos inactivos
          categoryId: categoryId,
        },
      });
      createdProducts.push(product);
      productCount++;
    }
    console.log(`    ✓ ${category.products.length} productos creados`);
  }
  console.log(`\n✓ Total: ${productCount} productos creados\n`);

  // Crear órdenes para generar datos en el dashboard
  console.log('🛒 Creando órdenes de ejemplo...');
  const regularUsers = createdUsers.filter(u => u.role === 'USER');
  const orderStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  let orderCount = 0;

  for (const user of regularUsers) {
    // Cada usuario tiene entre 1 y 5 órdenes
    const numOrders = getRandomInt(1, 5);

    for (let i = 0; i < numOrders; i++) {
      // Seleccionar productos aleatorios para la orden
      const orderProducts = getRandomItems(createdProducts, getRandomInt(1, 5));

      // Calcular items y total
      const orderItems = orderProducts.map(product => ({
        productId: product.id,
        quantity: getRandomInt(1, 3),
        price: product.price,
      }));

      const total = orderItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );

      // Crear la orden con fecha aleatoria en los últimos 90 días
      const createdAt = getRandomDate(90);
      const status = orderStatuses[getRandomInt(0, orderStatuses.length - 1)];

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status,
          total,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: orderItems,
          },
        },
      });

      orderCount++;
    }
  }
  console.log(`✓ ${orderCount} órdenes creadas\n`);

  // Resumen final
  console.log('═══════════════════════════════════════════');
  console.log('           SEED COMPLETADO');
  console.log('═══════════════════════════════════════════');
  console.log(`
  📊 Resumen:
  ─────────────────────────────
  👥 Usuarios:    ${createdUsers.length}
     - Admins:    ${createdUsers.filter(u => u.role === 'ADMIN').length}
     - Users:     ${createdUsers.filter(u => u.role === 'USER').length}

  📂 Categorías:  ${categoryDefinitions.length}

  📦 Productos:   ${productCount}
     - Electrónica: ${categories.electronica.products.length}
     - Moda:        ${categories.moda.products.length}
     - Hogar:       ${categories.hogar.products.length}
     - Deportes:    ${categories.deportes.products.length}
     - Belleza:     ${categories.belleza.products.length}

  ⚙️ Configs:     ${siteConfigurations.length}

  🛒 Órdenes:     ${orderCount}
  ─────────────────────────────

  🔑 Credenciales de prueba:
  ─────────────────────────────
  Admin:  admin@example.com / Admin123!
  User:   user@example.com / User123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
