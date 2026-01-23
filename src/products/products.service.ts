import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const { search, minPrice, maxPrice, inStock, isActive, featured, categoryId, category } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Stock filter
    if (inStock !== undefined) {
      where.stock = inStock ? { gt: 0 } : { equals: 0 };
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Category filter by ID
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Category filter by slug
    if (category) {
      where.category = { slug: category };
    }

    // Featured filter
    if (featured !== undefined) {
      where.featured = featured;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllPublic(query: QueryProductsDto) {
    // For public endpoint, only show active products
    return this.findAll({ ...query, isActive: true });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: dto,
    });

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    return product;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Producto eliminado correctamente' };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    if (product.stock + quantity < 0) {
      throw new Error('Stock insuficiente');
    }

    return this.prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity },
    });
  }
}
