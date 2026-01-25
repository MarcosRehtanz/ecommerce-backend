import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly client: MercadoPagoConfig;
  private readonly frontendUrl: string;
  private readonly backendUrl: string;
  private readonly webhookSecret: string | undefined;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notifications: NotificationsService,
  ) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    this.webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');

    this.logger.log(`PaymentsService initialized with frontendUrl: ${this.frontendUrl}, backendUrl: ${this.backendUrl}`);

    if (!accessToken || accessToken === 'APP_USR-xxx') {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN not configured. Payment features will not work.');
    }

    if (!this.webhookSecret) {
      this.logger.warn('MERCADOPAGO_WEBHOOK_SECRET not configured. Webhook signature validation will be skipped.');
    }

    this.client = new MercadoPagoConfig({
      accessToken: accessToken || '',
    });
  }

  /**
   * Create a Mercado Pago preference for an order
   * Implements idempotency: reuses existing preference if available
   */
  async createPreference(orderId: string, userId: string) {
    // Get order with items
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.paymentStatus === PaymentStatus.APPROVED) {
      throw new BadRequestException('Esta orden ya fue pagada');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Esta orden fue cancelada');
    }

    // Idempotency: If preference already exists, fetch and return it
    if (order.mercadoPagoId) {
      this.logger.log(`Reusing existing preference ${order.mercadoPagoId} for order ${orderId}`);
      try {
        const preference = new Preference(this.client);
        const existingPreference = await preference.get({ preferenceId: order.mercadoPagoId });
        return {
          preferenceId: existingPreference.id,
          initPoint: existingPreference.init_point,
          sandboxInitPoint: existingPreference.sandbox_init_point,
        };
      } catch (error) {
        // Preference expired or invalid, create a new one
        this.logger.warn(`Existing preference ${order.mercadoPagoId} invalid, creating new one`);
      }
    }

    // Build preference items
    const items = order.items.map((item) => ({
      id: item.productId,
      title: item.product.name,
      description: item.product.description?.substring(0, 256) || item.product.name,
      quantity: item.quantity,
      unit_price: Number(item.price),
      currency_id: 'ARS',
    }));

    // Create preference
    const preference = new Preference(this.client);

    try {
      const successUrl = `${this.frontendUrl}/checkout/success?order_id=${orderId}`;
      const failureUrl = `${this.frontendUrl}/checkout/failure?order_id=${orderId}`;
      const pendingUrl = `${this.frontendUrl}/checkout/pending?order_id=${orderId}`;
      const notificationUrl = `${this.backendUrl}/api/payments/webhook`;

      this.logger.log(`Creating preference with back_urls: success=${successUrl}, notification_url=${notificationUrl}`);

      const response = await preference.create({
        body: {
          items,
          payer: {
            email: order.user.email,
            name: order.user.name,
          },
          back_urls: {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
          },
          notification_url: notificationUrl,
          auto_return: 'approved' as const,
          external_reference: orderId,
          statement_descriptor: 'DYNNAMO',
        },
      });

      // Update order with Mercado Pago preference ID
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          mercadoPagoId: response.id,
        },
      });

      this.logger.log(`Created preference ${response.id} for order ${orderId}`);

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
      };
    } catch (error) {
      this.logger.error(`Failed to create preference for order ${orderId}`, error);
      throw new BadRequestException('Error al crear la preferencia de pago');
    }
  }

  /**
   * Validate Mercado Pago webhook signature
   * @see https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
   */
  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping signature validation');
      return true; // Skip validation if secret not configured
    }

    if (!xSignature || !xRequestId) {
      this.logger.warn('Missing x-signature or x-request-id headers');
      return false;
    }

    try {
      // Parse x-signature: ts=...,v1=...
      const parts = xSignature.split(',');
      const tsMatch = parts.find((p) => p.startsWith('ts='));
      const v1Match = parts.find((p) => p.startsWith('v1='));

      if (!tsMatch || !v1Match) {
        this.logger.warn('Invalid x-signature format');
        return false;
      }

      const ts = tsMatch.substring(3);
      const v1 = v1Match.substring(3);

      // Build manifest string according to MercadoPago docs
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Generate HMAC SHA256
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(manifest);
      const generatedSignature = hmac.digest('hex');

      const isValid = generatedSignature === v1;

      if (!isValid) {
        this.logger.warn(`Signature mismatch. Expected: ${v1}, Got: ${generatedSignature}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validating webhook signature', error);
      return false;
    }
  }

  /**
   * Extract the notification ID from various webhook formats
   * MercadoPago sends different formats for different notification types
   */
  private extractWebhookId(body: any): string | undefined {
    // New webhook format: { data: { id: "123" }, type: "payment" }
    if (body.data?.id) {
      return String(body.data.id);
    }
    // Alternative format: { id: "123", type: "topic_merchant_order_wh" }
    if (body.id) {
      return String(body.id);
    }
    // IPN format: { resource: "https://api.../payments/123", topic: "payment" }
    if (body.resource) {
      const match = body.resource.match(/\/(\d+)$/);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  /**
   * Handle Mercado Pago webhook notifications
   */
  async handleWebhook(
    body: any,
    xSignature?: string,
    xRequestId?: string,
    queryDataId?: string,
  ) {
    this.logger.log(`Received webhook: ${JSON.stringify(body)}`);

    // Determine the notification type
    const notificationType = body.type || body.topic;

    // Only validate and process payment notifications
    // Ignore merchant_order and other types
    if (notificationType !== 'payment') {
      this.logger.log(`Ignoring webhook type: ${notificationType}`);
      return { received: true };
    }

    // Extract the ID - prefer query param (used for signature), fallback to body
    const webhookId = queryDataId || this.extractWebhookId(body);

    if (!webhookId) {
      this.logger.warn('Could not extract ID from webhook');
      return { received: true };
    }

    this.logger.log(`Processing payment webhook for ID: ${webhookId}`);

    // Validate webhook signature for payment notifications
    if (!this.validateWebhookSignature(xSignature, xRequestId, webhookId)) {
      this.logger.error('Invalid webhook signature - rejecting request');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const paymentId = webhookId;

    try {
      // Get payment details from Mercado Pago
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

      this.logger.log(`Payment ${paymentId} status: ${paymentData.status}`);

      const orderId = paymentData.external_reference;

      if (!orderId) {
        this.logger.warn(`Payment ${paymentId} has no external_reference`);
        return { received: true };
      }

      // Find order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for payment ${paymentId}`);
        return { received: true };
      }

      // Update order based on payment status
      switch (paymentData.status) {
        case 'approved':
          await this.handleApprovedPayment(order, paymentId);
          break;

        case 'rejected':
          await this.handleRejectedPayment(order, paymentId);
          break;

        case 'pending':
        case 'in_process':
          await this.handlePendingPayment(order, paymentId);
          break;

        case 'cancelled':
        case 'refunded':
        case 'charged_back':
          await this.handleCancelledPayment(order, paymentId);
          break;

        default:
          this.logger.log(`Unhandled payment status: ${paymentData.status}`);
      }

      return { received: true };
    } catch (error: any) {
      // Handle "Payment not found" gracefully (common with test notifications)
      if (error?.cause?.[0]?.code === 2000 || error?.message === 'Payment not found') {
        this.logger.warn(`Payment ${paymentId} not found in MercadoPago (possibly a test notification)`);
        return { received: true, warning: 'Payment not found - possibly a test notification' };
      }

      this.logger.error(`Failed to process webhook for payment ${paymentId}`, error);
      throw error;
    }
  }

  /**
   * Handle approved payment - confirm order, decrement stock, and clear cart
   */
  private async handleApprovedPayment(
    order: {
      id: string;
      userId: string;
      items: { productId: string; quantity: number }[];
      user: { name: string; email: string };
      total: any;
    },
    paymentId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.APPROVED,
          paymentId: paymentId,
          status: OrderStatus.CONFIRMED,
        },
      });

      // Decrement stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear user's cart
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
      });
      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }
    });

    // Get full order for notification
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Send confirmation email
    if (fullOrder) {
      this.notifications.sendOrderStatusUpdate({
        orderId: order.id,
        customerName: order.user.name,
        customerEmail: order.user.email,
        total: Number(order.total),
        status: OrderStatus.CONFIRMED,
        statusLabel: statusLabels[OrderStatus.CONFIRMED],
        items: fullOrder.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
      });
    }

    this.logger.log(`Order ${order.id} confirmed after payment ${paymentId}`);
  }

  /**
   * Handle rejected payment
   */
  private async handleRejectedPayment(
    order: { id: string },
    paymentId: string,
  ) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.REJECTED,
        paymentId: paymentId,
      },
    });

    this.logger.log(`Order ${order.id} payment rejected: ${paymentId}`);
  }

  /**
   * Handle pending payment
   */
  private async handlePendingPayment(
    order: { id: string },
    paymentId: string,
  ) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: paymentId,
      },
    });

    this.logger.log(`Order ${order.id} payment pending: ${paymentId}`);
  }

  /**
   * Handle cancelled/refunded payment
   */
  private async handleCancelledPayment(
    order: { id: string },
    paymentId: string,
  ) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.CANCELLED,
        paymentId: paymentId,
      },
    });

    this.logger.log(`Order ${order.id} payment cancelled: ${paymentId}`);
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentId: true,
        mercadoPagoId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  /**
   * Admin: Manually sync payment status from MercadoPago
   * Useful when webhook failed to arrive
   */
  async adminSyncPayment(orderId: string, paymentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    try {
      // Fetch payment from MercadoPago
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

      this.logger.log(`Admin sync: Payment ${paymentId} status: ${paymentData.status}`);

      // Verify external_reference matches
      if (paymentData.external_reference && paymentData.external_reference !== orderId) {
        throw new BadRequestException(
          `Payment ${paymentId} belongs to order ${paymentData.external_reference}, not ${orderId}`,
        );
      }

      // Process based on status
      switch (paymentData.status) {
        case 'approved':
          await this.handleApprovedPayment(order, paymentId);
          return {
            success: true,
            message: 'Pago sincronizado - Orden confirmada',
            paymentStatus: 'APPROVED',
            orderStatus: 'CONFIRMED',
          };

        case 'rejected':
          await this.handleRejectedPayment(order, paymentId);
          return {
            success: true,
            message: 'Pago sincronizado - Pago rechazado',
            paymentStatus: 'REJECTED',
          };

        case 'pending':
        case 'in_process':
          await this.handlePendingPayment(order, paymentId);
          return {
            success: true,
            message: 'Pago sincronizado - Pago pendiente',
            paymentStatus: 'PENDING',
          };

        default:
          return {
            success: false,
            message: `Estado de pago no procesable: ${paymentData.status}`,
          };
      }
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to sync payment ${paymentId}`, error);
      throw new BadRequestException(`Error al sincronizar pago: ${error.message}`);
    }
  }

  /**
   * Admin: Manually mark order as paid (without MercadoPago verification)
   * Use only when you have external confirmation of payment
   */
  async adminMarkAsPaid(orderId: string, paymentId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.paymentStatus === PaymentStatus.APPROVED) {
      throw new BadRequestException('Esta orden ya está marcada como pagada');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede marcar como pagada una orden cancelada');
    }

    await this.handleApprovedPayment(order, paymentId || `manual-${Date.now()}`);

    this.logger.log(`Admin manually marked order ${orderId} as paid`);

    return {
      success: true,
      message: 'Orden marcada como pagada',
      paymentStatus: 'APPROVED',
      orderStatus: 'CONFIRMED',
    };
  }
}
