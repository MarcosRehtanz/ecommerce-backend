import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CreateOrderDtoSwagger,
  createOrderSchema,
  UpdateOrderStatusDto,
  UpdateOrderStatusDtoSwagger,
  updateOrderStatusSchema,
  QueryOrdersDto,
  queryOrdersSchema,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ZodValidationPipe,
  ZodQueryValidationPipe,
} from '../common/pipes/zod-validation.pipe';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==================== ADMIN ENDPOINTS ====================
  // IMPORTANTE: Rutas específicas ANTES de rutas con :id

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los pedidos (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos paginada' })
  findAllAdmin(
    @Query(new ZodQueryValidationPipe(queryOrdersSchema))
    query: QueryOrdersDto,
  ) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get('admin/stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de pedidos (Admin)' })
  @ApiResponse({ status: 200, description: 'Estadísticas de pedidos' })
  getStats() {
    return this.ordersService.getStats();
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener pedido por ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findOneAdmin(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Put('admin/:id/status')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateOrderStatusSchema))
  @ApiOperation({ summary: 'Actualizar estado del pedido (Admin)' })
  @ApiBody({ type: UpdateOrderStatusDtoSwagger })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  // ==================== USER ENDPOINTS ====================

  @Post()
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  @ApiOperation({ summary: 'Crear pedido desde carrito' })
  @ApiBody({ type: CreateOrderDtoSwagger })
  @ApiResponse({ status: 201, description: 'Pedido creado' })
  @ApiResponse({
    status: 400,
    description: 'Carrito vacío o stock insuficiente',
  })
  createOrder(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCart(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos del usuario' })
  findMyOrders(
    @Request() req: { user: { id: string } },
    @Query(new ZodQueryValidationPipe(queryOrdersSchema))
    query: QueryOrdersDto,
  ) {
    return this.ordersService.findUserOrders(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener mi pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findMyOrder(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.findUserOrder(req.user.id, id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar mi pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  @ApiResponse({
    status: 400,
    description: 'Solo se pueden cancelar pedidos pendientes',
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  cancelMyOrder(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancelOrder(req.user.id, id);
  }
}
