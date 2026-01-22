import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create cart for a user
   */
  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  /**
   * Get user's cart with items and product details
   */
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                imageUrl: true,
                imageData: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate totals
    const items = cartWithItems?.items || [];
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    return {
      id: cartWithItems?.id,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })),
      totalItems,
      totalPrice,
    };
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!product.isActive) {
      throw new BadRequestException('El producto no está disponible');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${product.stock}`
      );
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${product.stock}, en carrito: ${existingItem.quantity}`
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: { product: true },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${item.product.stock}`
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  /**
   * Sync local cart to server (merge items)
   */
  async syncCart(
    userId: string,
    items: { productId: string; quantity: number }[]
  ) {
    const cart = await this.getOrCreateCart(userId);

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      // Skip if product doesn't exist or is inactive
      if (!product || !product.isActive) continue;

      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId,
          },
        },
      });

      const quantity = Math.min(item.quantity, product.stock);
      if (quantity <= 0) continue;

      if (existingItem) {
        // Take the max quantity between local and server
        const newQuantity = Math.min(
          Math.max(existingItem.quantity, quantity),
          product.stock
        );
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity,
          },
        });
      }
    }

    return this.getCart(userId);
  }
}
