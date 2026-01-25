import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePreferenceDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-preference')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear preferencia de pago en Mercado Pago' })
  @ApiResponse({ status: 201, description: 'Preferencia creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al crear la preferencia' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async createPreference(
    @Body() dto: CreatePreferenceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createPreference(dto.orderId, userId);
  }

  @Post('webhook')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para notificaciones de Mercado Pago' })
  @ApiResponse({ status: 200, description: 'Notificación procesada' })
  @ApiResponse({ status: 401, description: 'Firma de webhook inválida' })
  async handleWebhook(
    @Body() body: any,
    @Query('data.id') dataId?: string,
    @Query('id') queryId?: string,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    // MercadoPago sends data.id in query params for signature validation
    const signatureDataId = dataId || queryId;
    return this.paymentsService.handleWebhook(body, xSignature, xRequestId, signatureDataId);
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estado de pago de una orden' })
  @ApiResponse({ status: 200, description: 'Estado del pago' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, userId);
  }

  @Post('admin/sync/:orderId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Sincronizar pago desde MercadoPago' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', description: 'ID del pago en MercadoPago' },
      },
      required: ['paymentId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Pago sincronizado' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async adminSyncPayment(
    @Param('orderId') orderId: string,
    @Body('paymentId') paymentId: string,
  ) {
    return this.paymentsService.adminSyncPayment(orderId, paymentId);
  }

  @Post('admin/mark-paid/:orderId')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Marcar orden como pagada manualmente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', description: 'ID del pago (opcional)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Orden marcada como pagada' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async adminMarkAsPaid(
    @Param('orderId') orderId: string,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.paymentsService.adminMarkAsPaid(orderId, paymentId);
  }
}
