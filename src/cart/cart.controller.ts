import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { CartService } from './cart.service';
import {
  AddToCartDto,
  AddToCartDtoSwagger,
  addToCartSchema,
  UpdateCartItemDto,
  UpdateCartItemDtoSwagger,
  updateCartItemSchema,
} from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito del usuario' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido' })
  getCart(@Request() req: { user: { id: string } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @UsePipes(new ZodValidationPipe(addToCartSchema))
  @ApiOperation({ summary: 'Agregar item al carrito' })
  @ApiBody({ type: AddToCartDtoSwagger })
  @ApiResponse({ status: 201, description: 'Item agregado al carrito' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  addItem(
    @Request() req: { user: { id: string } },
    @Body() dto: AddToCartDto,
  ) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Put('items/:itemId')
  @UsePipes(new ZodValidationPipe(updateCartItemSchema))
  @ApiOperation({ summary: 'Actualizar cantidad de item' })
  @ApiBody({ type: UpdateCartItemDtoSwagger })
  @ApiResponse({ status: 200, description: 'Item actualizado' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  updateItem(
    @Request() req: { user: { id: string } },
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  @ApiResponse({ status: 200, description: 'Item eliminado' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  removeItem(
    @Request() req: { user: { id: string } },
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar carrito' })
  @ApiResponse({ status: 200, description: 'Carrito vaciado' })
  clearCart(@Request() req: { user: { id: string } }) {
    return this.cartService.clearCart(req.user.id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar carrito local con servidor' })
  @ApiResponse({ status: 200, description: 'Carrito sincronizado' })
  syncCart(
    @Request() req: { user: { id: string } },
    @Body() items: { productId: string; quantity: number }[],
  ) {
    return this.cartService.syncCart(req.user.id, items);
  }
}
