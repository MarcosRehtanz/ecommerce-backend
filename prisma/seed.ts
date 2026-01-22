import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'user@ecommerce.com' },
    update: {},
    create: {
      email: 'user@ecommerce.com',
      name: 'Usuario Test',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('Test user created:', user.email);

  // Create sample products
  const products = [
    {
      name: 'Laptop HP Pavilion',
      description: 'Laptop de alto rendimiento con procesador Intel Core i7, 16GB RAM, 512GB SSD. Perfecta para trabajo y entretenimiento.',
      price: 999.99,
      stock: 15,
      imageUrl: 'https://placehold.co/400x300?text=Laptop+HP',
    },
    {
      name: 'iPhone 15 Pro',
      description: 'Último modelo de Apple con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR de 6.1 pulgadas.',
      price: 1199.99,
      stock: 25,
      imageUrl: 'https://placehold.co/400x300?text=iPhone+15',
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Smartphone Android premium con pantalla AMOLED de 6.2 pulgadas, cámara de 50MP y batería de larga duración.',
      price: 899.99,
      stock: 30,
      imageUrl: 'https://placehold.co/400x300?text=Samsung+S24',
    },
    {
      name: 'AirPods Pro 2',
      description: 'Auriculares inalámbricos con cancelación de ruido activa, audio espacial y estuche con carga MagSafe.',
      price: 249.99,
      stock: 50,
      imageUrl: 'https://placehold.co/400x300?text=AirPods+Pro',
    },
    {
      name: 'Monitor LG UltraWide',
      description: 'Monitor curvo de 34 pulgadas con resolución QHD, ideal para productividad y gaming.',
      price: 449.99,
      stock: 10,
      imageUrl: 'https://placehold.co/400x300?text=Monitor+LG',
    },
    {
      name: 'Teclado Mecánico Logitech',
      description: 'Teclado gaming mecánico RGB con switches táctiles y reposamuñecas ergonómico.',
      price: 149.99,
      stock: 40,
      imageUrl: 'https://placehold.co/400x300?text=Teclado+Logitech',
    },
    {
      name: 'Mouse Razer DeathAdder',
      description: 'Mouse gaming con sensor óptico de 20,000 DPI y diseño ergonómico para diestros.',
      price: 69.99,
      stock: 60,
      imageUrl: 'https://placehold.co/400x300?text=Mouse+Razer',
    },
    {
      name: 'Webcam Logitech C920',
      description: 'Webcam HD 1080p con enfoque automático y corrección de luz. Ideal para videollamadas.',
      price: 79.99,
      stock: 35,
      imageUrl: 'https://placehold.co/400x300?text=Webcam+C920',
    },
    {
      name: 'SSD Samsung 1TB',
      description: 'Disco de estado sólido NVMe de alta velocidad con 1TB de capacidad. Hasta 3500MB/s.',
      price: 109.99,
      stock: 45,
      imageUrl: 'https://placehold.co/400x300?text=SSD+Samsung',
    },
    {
      name: 'PlayStation 5',
      description: 'Consola de videojuegos de última generación con SSD ultrarrápido y control DualSense.',
      price: 499.99,
      stock: 0,
      imageUrl: 'https://placehold.co/400x300?text=PS5',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }

  console.log('Products created:', products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
