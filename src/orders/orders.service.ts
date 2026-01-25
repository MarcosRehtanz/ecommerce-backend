import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Create order from user's cart
   */
  async createFromCart(userId: string, dto: CreateOrderDto) {
    // Check if user already has a pending unpaid order
    const existingPendingOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    if (existingPendingOrder) {
      throw new BadRequestException(
        `Ya tienes un pedido pendiente de pago (#${existingPendingOrder.id.slice(0, 8)}). ` +
        'Debes pagarlo o cancelarlo antes de crear otro pedido.'
      );
    }

    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Validate all products are available and have enough stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(
          `El producto "${item.product.name}" ya no está disponible`
        );
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${item.product.name}". Disponible: ${item.product.stock}`
        );
      }
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    // Create order with items in a transaction
    // Note: Stock is NOT decremented here. It will be decremented when payment is confirmed.
    // Note: Cart is NOT cleared here. It will be cleared when payment is confirmed.
    // Email is NOT sent here. It will be sent when payment is confirmed.
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order with paymentStatus PENDING
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  imageData: true,
                },
              },
            },
          },
        },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * Get orders for a specific user
   */
  async findUserOrders(userId: string, query: QueryOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.status && { status: query.status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  imageData: true,
                },
              },
            },
          },
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single order for user
   */
  async findUserOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                imageData: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  /**
   * Cancel order (user can only cancel PENDING orders)
   */
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar pedidos pendientes'
      );
    }

    // Cancel order and restore stock only if payment was approved
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Only restore stock if payment was approved (stock was decremented)
      if (order.paymentStatus === PaymentStatus.APPROVED) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Update order status
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  imageData: true,
                },
              },
            },
          },
        },
      });
    });

    return updatedOrder;
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all orders (admin)
   */
  async findAllAdmin(query: QueryOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.userId && { userId: query.userId }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  imageData: true,
                },
              },
            },
          },
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single order (admin)
   */
  async findOneAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                imageData: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  /**
   * Update order status (admin)
   */
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      SHIPPED: [OrderStatus.DELIVERED],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.status} a ${dto.status}`
      );
    }

    // Block confirmation if payment is not approved
    if (dto.status === OrderStatus.CONFIRMED && order.paymentStatus !== PaymentStatus.APPROVED) {
      throw new BadRequestException(
        'No se puede confirmar un pedido que no ha sido pagado. ' +
        'El pago debe estar aprobado antes de confirmar el pedido.'
      );
    }

    let updatedOrder;

    // If cancelling, restore stock only if payment was approved
    if (dto.status === OrderStatus.CANCELLED) {
      updatedOrder = await this.prisma.$transaction(async (tx) => {
        // Only restore stock if payment was approved (stock was decremented)
        if (order.paymentStatus === PaymentStatus.APPROVED) {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: {
            status: dto.status,
            paymentStatus: PaymentStatus.CANCELLED,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    imageData: true,
                  },
                },
              },
            },
          },
        });
      });
    } else {
      updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: dto.status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  imageData: true,
                },
              },
            },
          },
        },
      });
    }

    // Send status update notification
    if (updatedOrder.user) {
      this.notifications.sendOrderStatusUpdate({
        orderId: updatedOrder.id,
        customerName: updatedOrder.user.name,
        customerEmail: updatedOrder.user.email,
        total: Number(updatedOrder.total),
        status: updatedOrder.status,
        statusLabel: statusLabels[updatedOrder.status],
        items: updatedOrder.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
      });
    }

    return updatedOrder;
  }

  /**
   * Get order statistics (admin)
   */
  async getStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      pendingPayment,
      approvedPayment,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({
        where: {
          paymentStatus: PaymentStatus.PENDING,
          status: { not: OrderStatus.CANCELLED },
        }
      }),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.APPROVED } }),
      this.prisma.order.aggregate({
        where: {
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      totalOrders,
      byStatus: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      byPayment: {
        pending: pendingPayment,
        approved: approvedPayment,
      },
      totalRevenue: Number(totalRevenue._sum.total) || 0,
    };
  }
}
