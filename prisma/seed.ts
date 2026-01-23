import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// DATOS DE PRODUCTOS POR CATEGORÍA
// ============================================

const categories = {
  electronica: {
    name: 'Electrónica',
    products: [
      // Laptops
      { name: 'MacBook Pro 14" M3', description: 'Laptop Apple con chip M3, 16GB RAM, 512GB SSD. Pantalla Liquid Retina XDR.', price: 1999.99, stock: 12 },
      { name: 'MacBook Air 13" M2', description: 'Laptop ultradelgada con chip M2, 8GB RAM, 256GB SSD. Batería de hasta 18 horas.', price: 1099.99, stock: 20 },
      { name: 'Dell XPS 15', description: 'Laptop premium con Intel Core i7-13700H, 16GB RAM, 512GB SSD, pantalla OLED 3.5K.', price: 1549.99, stock: 8 },
      { name: 'HP Spectre x360', description: 'Laptop 2-en-1 convertible con Intel Core i7, 16GB RAM, pantalla táctil 4K OLED.', price: 1399.99, stock: 15 },
      { name: 'Lenovo ThinkPad X1 Carbon', description: 'Laptop empresarial ultraligera con Intel Core i7, 16GB RAM, 512GB SSD.', price: 1649.99, stock: 10 },
      { name: 'ASUS ROG Zephyrus G14', description: 'Laptop gaming con AMD Ryzen 9, RTX 4060, 16GB RAM, pantalla 165Hz.', price: 1599.99, stock: 7 },
      { name: 'Razer Blade 15', description: 'Laptop gaming premium con Intel Core i7, RTX 4070, 16GB RAM, pantalla QHD 240Hz.', price: 2499.99, stock: 5 },
      { name: 'Microsoft Surface Laptop 5', description: 'Laptop elegante con Intel Core i7, 16GB RAM, pantalla táctil PixelSense.', price: 1299.99, stock: 18 },
      { name: 'Acer Swift 5', description: 'Laptop ultraligera de 1kg con Intel Core i7, 16GB RAM, pantalla 2.5K.', price: 1199.99, stock: 22 },
      { name: 'HP Pavilion 15', description: 'Laptop versátil con Intel Core i5, 8GB RAM, 256GB SSD. Ideal para estudiantes.', price: 599.99, stock: 35 },

      // Smartphones
      { name: 'iPhone 15 Pro Max', description: 'El iPhone más avanzado con chip A17 Pro, cámara de 48MP, pantalla 6.7" ProMotion.', price: 1199.99, stock: 30 },
      { name: 'iPhone 15 Pro', description: 'iPhone con chip A17 Pro, titanio, cámara de 48MP, pantalla 6.1" ProMotion.', price: 999.99, stock: 25 },
      { name: 'iPhone 15', description: 'iPhone con Dynamic Island, chip A16, cámara de 48MP, USB-C.', price: 799.99, stock: 40 },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Smartphone premium con S Pen, cámara de 200MP, pantalla 6.8" QHD+ 120Hz.', price: 1299.99, stock: 20 },
      { name: 'Samsung Galaxy S24+', description: 'Smartphone con pantalla 6.7" QHD+, cámara de 50MP, batería de 4900mAh.', price: 999.99, stock: 28 },
      { name: 'Samsung Galaxy S24', description: 'Smartphone compacto con pantalla 6.2" FHD+, cámara de 50MP, chip Exynos 2400.', price: 799.99, stock: 35 },
      { name: 'Google Pixel 8 Pro', description: 'Smartphone con IA avanzada, cámara de 50MP, chip Tensor G3, 7 años de actualizaciones.', price: 999.99, stock: 15 },
      { name: 'Google Pixel 8', description: 'Smartphone con chip Tensor G3, cámara de 50MP, pantalla 6.2" OLED 120Hz.', price: 699.99, stock: 22 },
      { name: 'OnePlus 12', description: 'Flagship killer con Snapdragon 8 Gen 3, cámara Hasselblad, carga 100W.', price: 799.99, stock: 18 },
      { name: 'Xiaomi 14 Pro', description: 'Smartphone con cámara Leica, Snapdragon 8 Gen 3, pantalla LTPO AMOLED.', price: 899.99, stock: 12 },

      // Tablets
      { name: 'iPad Pro 12.9" M2', description: 'Tablet profesional con chip M2, pantalla Liquid Retina XDR, compatible con Apple Pencil.', price: 1099.99, stock: 15 },
      { name: 'iPad Air 5', description: 'Tablet versátil con chip M1, pantalla 10.9", compatible con Magic Keyboard.', price: 599.99, stock: 25 },
      { name: 'iPad 10th Gen', description: 'iPad con chip A14, pantalla 10.9", USB-C, ideal para estudiantes.', price: 449.99, stock: 40 },
      { name: 'Samsung Galaxy Tab S9 Ultra', description: 'Tablet premium con pantalla 14.6" AMOLED, Snapdragon 8 Gen 2, S Pen incluido.', price: 1199.99, stock: 8 },
      { name: 'Samsung Galaxy Tab S9+', description: 'Tablet con pantalla 12.4" AMOLED, Snapdragon 8 Gen 2, S Pen incluido.', price: 999.99, stock: 12 },

      // Auriculares
      { name: 'AirPods Pro 2', description: 'Auriculares con cancelación de ruido adaptativa, audio espacial, USB-C.', price: 249.99, stock: 50 },
      { name: 'AirPods Max', description: 'Auriculares over-ear premium con audio espacial, cancelación de ruido, 20h batería.', price: 549.99, stock: 15 },
      { name: 'Sony WH-1000XM5', description: 'Auriculares inalámbricos con la mejor cancelación de ruido, 30h batería.', price: 399.99, stock: 25 },
      { name: 'Sony WF-1000XM5', description: 'Earbuds premium con cancelación de ruido líder, audio Hi-Res, IPX4.', price: 299.99, stock: 30 },
      { name: 'Bose QuietComfort Ultra', description: 'Auriculares con cancelación de ruido inmersiva, audio espacial, 24h batería.', price: 429.99, stock: 20 },
      { name: 'Samsung Galaxy Buds2 Pro', description: 'Earbuds con ANC, audio Hi-Fi 24bit, resistencia IPX7.', price: 229.99, stock: 35 },
      { name: 'Beats Studio Pro', description: 'Auriculares con audio espacial personalizado, ANC, USB-C y 3.5mm.', price: 349.99, stock: 18 },

      // Smartwatches
      { name: 'Apple Watch Ultra 2', description: 'Smartwatch resistente con GPS de doble frecuencia, 36h batería, titanio.', price: 799.99, stock: 12 },
      { name: 'Apple Watch Series 9', description: 'Smartwatch con chip S9, doble toque, pantalla siempre encendida.', price: 399.99, stock: 30 },
      { name: 'Samsung Galaxy Watch 6 Classic', description: 'Smartwatch con bisel giratorio, monitoreo de salud avanzado, Wear OS.', price: 399.99, stock: 22 },
      { name: 'Garmin Fenix 7X', description: 'Reloj multideporte con GPS, mapas, hasta 28 días de batería.', price: 899.99, stock: 8 },

      // Monitores
      { name: 'LG UltraGear 27GP950', description: 'Monitor gaming 27" 4K 144Hz, Nano IPS, HDMI 2.1, G-Sync/FreeSync.', price: 799.99, stock: 15 },
      { name: 'Samsung Odyssey G9', description: 'Monitor curvo ultrawide 49" QHD 240Hz, 1000R, HDR1000.', price: 1299.99, stock: 6 },
      { name: 'Dell UltraSharp U2723QE', description: 'Monitor profesional 27" 4K IPS, USB-C 90W, 100% sRGB.', price: 629.99, stock: 18 },
      { name: 'ASUS ProArt PA32UCG', description: 'Monitor profesional 32" 4K Mini LED, Dolby Vision, calibrado de fábrica.', price: 2999.99, stock: 4 },
      { name: 'BenQ PD2725U', description: 'Monitor diseño 27" 4K IPS, Thunderbolt 3, modo M-Book.', price: 899.99, stock: 10 },

      // Consolas
      { name: 'PlayStation 5', description: 'Consola next-gen con SSD ultrarrápido, ray tracing, control DualSense.', price: 499.99, stock: 0 },
      { name: 'PlayStation 5 Digital', description: 'PS5 sin lector de discos, misma potencia, precio reducido.', price: 399.99, stock: 5 },
      { name: 'Xbox Series X', description: 'Consola más potente de Xbox con 12 TFLOPs, 1TB SSD, 4K 120fps.', price: 499.99, stock: 8 },
      { name: 'Xbox Series S', description: 'Consola compacta next-gen, 100% digital, 512GB SSD.', price: 299.99, stock: 20 },
      { name: 'Nintendo Switch OLED', description: 'Consola híbrida con pantalla OLED 7", dock con puerto LAN.', price: 349.99, stock: 25 },

      // Accesorios Gaming
      { name: 'DualSense Edge', description: 'Control premium de PS5 con gatillos ajustables, sticks intercambiables.', price: 199.99, stock: 15 },
      { name: 'Xbox Elite Controller 2', description: 'Control premium con gatillos ajustables, 40h batería, estuche incluido.', price: 179.99, stock: 20 },
      { name: 'Razer BlackWidow V4 Pro', description: 'Teclado mecánico con switches Green, RGB Chroma, reposamuñecas.', price: 229.99, stock: 25 },
      { name: 'Logitech G Pro X Superlight', description: 'Mouse gaming ultraligero 63g, sensor HERO 25K, 70h batería.', price: 159.99, stock: 30 },
      { name: 'SteelSeries Arctis Nova Pro', description: 'Auriculares gaming con ANC, audio Hi-Fi, base DAC.', price: 349.99, stock: 12 },
    ],
  },

  moda: {
    name: 'Moda',
    products: [
      // Camisetas
      { name: 'Camiseta Nike Dri-FIT', description: 'Camiseta deportiva con tecnología de absorción de sudor, ajuste regular.', price: 34.99, stock: 100 },
      { name: 'Camiseta Adidas Originals', description: 'Camiseta clásica con logo Trefoil, algodón 100% orgánico.', price: 29.99, stock: 120 },
      { name: 'Polo Ralph Lauren Classic', description: 'Polo clásico de algodón piqué con logo bordado.', price: 89.99, stock: 60 },
      { name: 'Camiseta Levi\'s Logo', description: 'Camiseta de algodón con el icónico logo batwing.', price: 24.99, stock: 80 },
      { name: 'Camiseta Tommy Hilfiger', description: 'Camiseta premium de algodón con logo bordado.', price: 49.99, stock: 70 },

      // Pantalones
      { name: 'Jeans Levi\'s 501 Original', description: 'El jean original con corte recto, botones, 100% algodón.', price: 79.99, stock: 50 },
      { name: 'Jeans Levi\'s 511 Slim', description: 'Jean slim fit moderno con elastano para mayor comodidad.', price: 69.99, stock: 65 },
      { name: 'Pantalón Chino Dockers', description: 'Pantalón chino clásico con corte slim, ideal para oficina.', price: 59.99, stock: 55 },
      { name: 'Jogger Nike Tech Fleece', description: 'Pantalón jogger con tejido Tech Fleece, bolsillos con cierre.', price: 109.99, stock: 40 },
      { name: 'Pantalón Adidas Tiro', description: 'Pantalón de entrenamiento con las 3 rayas clásicas.', price: 54.99, stock: 75 },

      // Zapatillas
      { name: 'Nike Air Max 90', description: 'Zapatillas icónicas con amortiguación Air visible, estilo retro.', price: 129.99, stock: 45 },
      { name: 'Nike Air Force 1', description: 'Las clásicas zapatillas de baloncesto convertidas en ícono urbano.', price: 109.99, stock: 60 },
      { name: 'Adidas Ultraboost 23', description: 'Zapatillas running con Boost, Primeknit+, Continental.', price: 189.99, stock: 35 },
      { name: 'Adidas Stan Smith', description: 'Zapatillas minimalistas de cuero con el clásico trébol verde.', price: 99.99, stock: 70 },
      { name: 'New Balance 574', description: 'Zapatillas retro con amortiguación ENCAP, estilo casual.', price: 89.99, stock: 55 },
      { name: 'Converse Chuck Taylor All Star', description: 'Las zapatillas de lona más icónicas de la historia.', price: 59.99, stock: 90 },
      { name: 'Vans Old Skool', description: 'Zapatillas de skate clásicas con la franja lateral distintiva.', price: 69.99, stock: 80 },
      { name: 'Jordan 1 Retro High', description: 'Las legendarias zapatillas de Michael Jordan, estilo OG.', price: 179.99, stock: 25 },
      { name: 'Puma RS-X', description: 'Zapatillas chunky con diseño futurista y amortiguación RS.', price: 119.99, stock: 40 },
      { name: 'Reebok Classic Leather', description: 'Zapatillas de cuero suave con suela de goma, estilo vintage.', price: 79.99, stock: 50 },

      // Sudaderas y Hoodies
      { name: 'Hoodie Nike Sportswear Club', description: 'Sudadera con capucha de tejido French Terry, logo bordado.', price: 59.99, stock: 65 },
      { name: 'Hoodie Adidas Essentials', description: 'Sudadera con capucha y las 3 rayas, algodón reciclado.', price: 54.99, stock: 70 },
      { name: 'Sudadera Champion Reverse Weave', description: 'Sudadera premium con tejido Reverse Weave anti-encogimiento.', price: 79.99, stock: 45 },
      { name: 'Hoodie The North Face', description: 'Sudadera técnica con logo Half Dome, ideal para outdoor.', price: 89.99, stock: 40 },
      { name: 'Sudadera Carhartt WIP', description: 'Sudadera de trabajo premium con logo bordado, estilo workwear.', price: 99.99, stock: 35 },

      // Chaquetas
      { name: 'Chaqueta The North Face Nuptse', description: 'Chaqueta de plumón 700 fill, resistente al agua, icónica.', price: 299.99, stock: 20 },
      { name: 'Chaqueta Nike Windrunner', description: 'Cortavientos clásico con diseño chevron y capucha.', price: 109.99, stock: 45 },
      { name: 'Bomber Alpha Industries MA-1', description: 'Chaqueta bomber militar auténtica con forro naranja.', price: 169.99, stock: 30 },
      { name: 'Chaqueta Levi\'s Trucker', description: 'Chaqueta de mezclilla clásica con corte tipo camionero.', price: 129.99, stock: 40 },
      { name: 'Parka Patagonia Tres 3-in-1', description: 'Parka versátil con chaqueta interior removible, impermeable.', price: 449.99, stock: 15 },
    ],
  },

  hogar: {
    name: 'Hogar',
    products: [
      // Aspiradoras
      { name: 'Dyson V15 Detect', description: 'Aspiradora inalámbrica con láser detector de polvo, 60 min batería.', price: 749.99, stock: 15 },
      { name: 'Roomba j7+', description: 'Robot aspirador con autovaciado, evita obstáculos con IA.', price: 799.99, stock: 12 },
      { name: 'Roborock S8 Pro Ultra', description: 'Robot aspirador y fregona con autovaciado y autolimpieza.', price: 1599.99, stock: 8 },
      { name: 'Xiaomi Robot Vacuum X10+', description: 'Robot aspirador con estación de autovaciado, mapeo LDS.', price: 599.99, stock: 20 },
      { name: 'Dyson V12 Slim', description: 'Aspiradora inalámbrica ligera con pantalla LCD, 60 min batería.', price: 549.99, stock: 18 },

      // Cocina
      { name: 'Ninja Foodi 11-in-1', description: 'Olla multifunción: presión, air fryer, deshidratador, 6.5L.', price: 229.99, stock: 25 },
      { name: 'Instant Pot Duo Crisp', description: 'Olla a presión y air fryer 11-en-1, 8 cuartos.', price: 179.99, stock: 30 },
      { name: 'KitchenAid Artisan 5KSM185', description: 'Batidora de pie profesional 4.8L, 10 velocidades, metal fundido.', price: 449.99, stock: 15 },
      { name: 'Nespresso Vertuo Next', description: 'Cafetera de cápsulas con 5 tamaños de taza, espumador incluido.', price: 199.99, stock: 35 },
      { name: 'Philips Airfryer XXL', description: 'Freidora de aire 7.3L, tecnología RapidAir, pantalla digital.', price: 299.99, stock: 22 },
      { name: 'Vitamix E310', description: 'Licuadora profesional con motor 2HP, cuchillas de acero inoxidable.', price: 349.99, stock: 18 },
      { name: 'Thermomix TM6', description: 'Robot de cocina multifunción con guía de cocina integrada.', price: 1499.99, stock: 5 },
      { name: 'Weber Spirit E-310', description: 'Parrilla a gas con 3 quemadores, 529 pulgadas cuadradas.', price: 549.99, stock: 10 },

      // Smart Home
      { name: 'Amazon Echo Dot 5', description: 'Altavoz inteligente con Alexa, sonido mejorado, reloj LED.', price: 49.99, stock: 80 },
      { name: 'Google Nest Hub 2', description: 'Pantalla inteligente 7" con Google Assistant, sensor de sueño.', price: 99.99, stock: 45 },
      { name: 'Philips Hue Starter Kit', description: 'Kit de 4 bombillas inteligentes + Bridge, 16 millones de colores.', price: 199.99, stock: 30 },
      { name: 'Ring Video Doorbell Pro 2', description: 'Timbre con video 1536p, detección de movimiento 3D.', price: 249.99, stock: 25 },
      { name: 'Nest Learning Thermostat', description: 'Termostato inteligente que aprende tus preferencias.', price: 249.99, stock: 20 },
      { name: 'August Wi-Fi Smart Lock', description: 'Cerradura inteligente con Wi-Fi integrado, auto-lock.', price: 229.99, stock: 22 },
      { name: 'Ecobee SmartThermostat', description: 'Termostato con Alexa integrada, sensor de habitación incluido.', price: 219.99, stock: 18 },

      // Muebles
      { name: 'Silla Ergonómica Herman Miller Aeron', description: 'Silla de oficina premium con soporte lumbar PostureFit.', price: 1395.99, stock: 8 },
      { name: 'Escritorio Elevable FlexiSpot E7', description: 'Escritorio de pie motorizado, altura 58-123cm, hasta 125kg.', price: 549.99, stock: 15 },
      { name: 'Sofá IKEA Friheten', description: 'Sofá cama de 3 plazas con almacenamiento, tela gris.', price: 599.99, stock: 12 },
      { name: 'Mesa de Centro IKEA Lack', description: 'Mesa auxiliar minimalista 90x55cm, fácil montaje.', price: 29.99, stock: 50 },
      { name: 'Estantería IKEA Billy', description: 'Estantería clásica 80x202cm, 6 estantes ajustables.', price: 79.99, stock: 35 },
    ],
  },

  deportes: {
    name: 'Deportes',
    products: [
      // Fitness
      { name: 'Set de Mancuernas Bowflex SelectTech', description: 'Mancuernas ajustables 2-24kg cada una, sistema de selección rápida.', price: 449.99, stock: 15 },
      { name: 'Bicicleta Estática Peloton Bike+', description: 'Bicicleta con pantalla giratoria 24", clases en vivo y bajo demanda.', price: 2495.99, stock: 5 },
      { name: 'Cinta de Correr NordicTrack 1750', description: 'Cinta con pantalla 10", inclinación -3% a 15%, iFit incluido.', price: 1799.99, stock: 8 },
      { name: 'Banco de Pesas Ajustable', description: 'Banco multiposición para entrenamiento en casa, hasta 300kg.', price: 199.99, stock: 25 },
      { name: 'Kettlebell Ajustable Bowflex', description: 'Kettlebell 3.5-18kg en una sola unidad, selector de peso.', price: 179.99, stock: 20 },
      { name: 'Banda de Resistencia Set', description: 'Set de 5 bandas con diferentes resistencias, con asas y anclaje.', price: 34.99, stock: 60 },
      { name: 'Colchoneta Yoga Premium', description: 'Mat de yoga antideslizante 6mm, TPE ecológico, 183x61cm.', price: 49.99, stock: 70 },
      { name: 'TRX Pro 4 System', description: 'Sistema de entrenamiento en suspensión profesional.', price: 249.99, stock: 18 },

      // Running
      { name: 'Nike ZoomX Vaporfly Next% 3', description: 'Zapatillas de competición con placa de carbono, las más rápidas.', price: 259.99, stock: 20 },
      { name: 'Adidas Adizero Adios Pro 3', description: 'Zapatillas de maratón con doble placa de carbono.', price: 249.99, stock: 15 },
      { name: 'ASICS Gel-Kayano 30', description: 'Zapatillas de estabilidad premium con gel en talón y antepié.', price: 179.99, stock: 35 },
      { name: 'Garmin Forerunner 965', description: 'Reloj GPS running con pantalla AMOLED, mapas, música.', price: 599.99, stock: 12 },
      { name: 'Coros Pace 3', description: 'Reloj GPS ultraligero con 24 días de batería, modo multideporte.', price: 229.99, stock: 25 },

      // Ciclismo
      { name: 'Bicicleta Trek Domane SL 5', description: 'Bicicleta de ruta con cuadro carbono OCLV, Shimano 105.', price: 3299.99, stock: 4 },
      { name: 'Bicicleta Specialized Roubaix', description: 'Bicicleta endurance con Future Shock 2.0, Shimano Ultegra.', price: 4499.99, stock: 3 },
      { name: 'Casco Giro Aether MIPS', description: 'Casco aerodinámico con MIPS Spherical, ventilación superior.', price: 299.99, stock: 15 },
      { name: 'Ciclocomputador Garmin Edge 840', description: 'GPS con pantalla táctil, mapas, entrenamiento guiado.', price: 449.99, stock: 18 },
      { name: 'Zapatillas Ciclismo Shimano RC9', description: 'Zapatillas de carretera con suela de carbono, BOA Li2.', price: 399.99, stock: 12 },

      // Outdoor
      { name: 'Tienda de Campaña MSR Hubba Hubba', description: 'Tienda ultraligera 2 personas, 1.5kg, resistente al agua.', price: 499.99, stock: 10 },
      { name: 'Saco de Dormir Marmot Trestles', description: 'Saco sintético -9°C, compresible, ideal para montaña.', price: 159.99, stock: 20 },
      { name: 'Mochila Osprey Atmos AG 65', description: 'Mochila de senderismo con suspensión Anti-Gravity, 65L.', price: 299.99, stock: 15 },
      { name: 'Bastones Trekking Black Diamond', description: 'Bastones telescópicos de aluminio con empuñaduras de corcho.', price: 129.99, stock: 30 },
      { name: 'Botas Salomon X Ultra 4', description: 'Botas de senderismo ligeras con Advanced Chassis, Gore-Tex.', price: 179.99, stock: 25 },
    ],
  },

  belleza: {
    name: 'Belleza',
    products: [
      // Skincare
      { name: 'Serum La Roche-Posay Hyalu B5', description: 'Serum con ácido hialurónico y vitamina B5, hidratación intensa.', price: 39.99, stock: 45 },
      { name: 'Crema CeraVe Moisturizing', description: 'Crema hidratante con ceramidas y ácido hialurónico, sin fragancia.', price: 18.99, stock: 80 },
      { name: 'Protector Solar La Roche-Posay Anthelios', description: 'Protector SPF 50+ textura invisible, resistente al agua.', price: 34.99, stock: 60 },
      { name: 'Retinol Paula\'s Choice 1%', description: 'Tratamiento de retinol puro para arrugas y textura.', price: 58.99, stock: 35 },
      { name: 'Vitamina C Drunk Elephant C-Firma', description: 'Serum de vitamina C 15% con ácido ferúlico, antioxidante.', price: 78.99, stock: 25 },
      { name: 'Limpiador Cetaphil Gentle', description: 'Limpiador suave para piel sensible, sin jabón, pH balanceado.', price: 14.99, stock: 90 },
      { name: 'Tónico Pixi Glow Tonic', description: 'Tónico exfoliante con 5% ácido glicólico, ilumina la piel.', price: 29.99, stock: 50 },
      { name: 'Mascarilla Aztec Secret', description: 'Mascarilla de arcilla bentonita 100% natural, limpieza profunda.', price: 12.99, stock: 70 },

      // Maquillaje
      { name: 'Base Maybelline Fit Me', description: 'Base mate y sin poros, cobertura natural, 40 tonos.', price: 12.99, stock: 100 },
      { name: 'Corrector NARS Radiant Creamy', description: 'Corrector cremoso de cobertura media a completa.', price: 32.99, stock: 55 },
      { name: 'Paleta Urban Decay Naked 3', description: 'Paleta de 12 sombras tonos rosados y neutros.', price: 54.99, stock: 40 },
      { name: 'Máscara Benefit BADgal BANG!', description: 'Máscara de pestañas volumen extremo, 36h duración.', price: 27.99, stock: 65 },
      { name: 'Labial MAC Ruby Woo', description: 'Labial mate retro rojo icónico, larga duración.', price: 21.99, stock: 75 },
      { name: 'Iluminador Fenty Beauty Killawatt', description: 'Iluminador en dúo con acabado luminoso, buildable.', price: 36.99, stock: 45 },

      // Cabello
      { name: 'Shampoo Olaplex No.4', description: 'Shampoo reparador de enlaces, para cabello dañado.', price: 28.99, stock: 55 },
      { name: 'Acondicionador Olaplex No.5', description: 'Acondicionador reparador, hidrata y fortalece.', price: 28.99, stock: 55 },
      { name: 'Tratamiento Olaplex No.3', description: 'Tratamiento semanal para reparar enlaces del cabello.', price: 28.99, stock: 50 },
      { name: 'Aceite Moroccanoil Treatment', description: 'Aceite de argán para brillo y suavidad instantánea.', price: 46.99, stock: 40 },
      { name: 'Secador Dyson Supersonic', description: 'Secador con motor digital V9, previene daño por calor.', price: 429.99, stock: 12 },
      { name: 'Plancha ghd Platinum+', description: 'Plancha inteligente que predice necesidades del cabello.', price: 279.99, stock: 18 },

      // Fragancias
      { name: 'Perfume Chanel No.5 EDP', description: 'Fragancia icónica floral aldehydic, 100ml.', price: 159.99, stock: 20 },
      { name: 'Perfume Dior Sauvage EDT', description: 'Fragancia masculina amaderada especiada, 100ml.', price: 119.99, stock: 25 },
      { name: 'Perfume YSL Black Opium EDP', description: 'Fragancia adictiva con café y vainilla, 90ml.', price: 134.99, stock: 22 },
      { name: 'Perfume Bleu de Chanel EDP', description: 'Fragancia masculina amaderada aromática, 100ml.', price: 149.99, stock: 18 },
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
      message: '¡Envío gratis en compras mayores a $50! 🚚',
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
          imageUrl: `https://placehold.co/400x400?text=${encodeURIComponent(productData.name.substring(0, 20))}`,
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
