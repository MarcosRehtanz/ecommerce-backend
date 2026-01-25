import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersSchedulerService {
  private readonly logger = new Logger(OrdersSchedulerService.name);
  private readonly expirationHours: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Default to 24 hours, can be configured via env
    this.expirationHours = parseInt(
      this.configService.get<string>('ORDER_EXPIRATION_HOURS') || '24',
      10,
    );
    this.logger.log(
      `OrdersSchedulerService initialized. Orders will expire after ${this.expirationHours} hours without payment.`,
    );
  }

  /**
   * Run every hour to check for expired orders
   * Orders with status PENDING and paymentStatus PENDING older than expirationHours will be cancelled
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredOrders() {
    this.logger.log('Checking for expired orders...');

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - this.expirationHours);

    try {
      // Find expired orders
      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: {
            lt: expirationDate,
          },
        },
        include: {
          items: true,
        },
      });

      if (expiredOrders.length === 0) {
        this.logger.log('No expired orders found.');
        return;
      }

      this.logger.log(`Found ${expiredOrders.length} expired order(s). Cancelling...`);

      // Cancel each expired order
      for (const order of expiredOrders) {
        await this.cancelExpiredOrder(order);
      }

      this.logger.log(`Successfully cancelled ${expiredOrders.length} expired order(s).`);
    } catch (error) {
      this.logger.error('Error processing expired orders:', error);
    }
  }

  /**
   * Cancel a single expired order
   * Note: Stock is NOT released because it was never decremented (payment was never approved)
   */
  private async cancelExpiredOrder(
    order: { id: string; items: { productId: string; quantity: number }[] },
  ) {
    try {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
        },
      });

      this.logger.log(`Cancelled expired order ${order.id}`);
    } catch (error) {
      this.logger.error(`Failed to cancel expired order ${order.id}:`, error);
    }
  }

  /**
   * Manual trigger for testing - can be called via admin endpoint if needed
   */
  async cancelExpiredOrdersManually() {
    await this.handleExpiredOrders();
  }
}
