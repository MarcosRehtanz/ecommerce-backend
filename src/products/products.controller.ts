import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateProductDtoSwagger,
  createProductSchema,
} from './dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductDtoSwagger,
  updateProductSchema,
} from './dto/update-product.dto';
import {
  QueryProductsDto,
  QueryProductsDtoSwagger,
  queryProductsSchema,
} from './dto/query-products.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ZodValidationPipe,
  ZodQueryValidationPipe,
} from '../common/pipes/zod-validation.pipe';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== ADMIN ENDPOINTS ====================
  // IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con :id

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos los productos (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de productos paginada' })
  findAllAdmin(
    @Query(new ZodQueryValidationPipe(queryProductsSchema))
    query: QueryProductsDto,
  ) {
    return this.productsService.findAll(query);
  }

  @Get('admin/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener producto por ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOneAdmin(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(createProductSchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear producto (Admin)' })
  @ApiBody({ type: CreateProductDtoSwagger })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateProductSchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar producto (Admin)' })
  @ApiBody({ type: UpdateProductDtoSwagger })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar producto (Admin)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar productos (público)' })
  @ApiResponse({ status: 200, description: 'Lista de productos paginada' })
  findAllPublic(
    @Query(new ZodQueryValidationPipe(queryProductsSchema))
    query: QueryProductsDto,
  ) {
    return this.productsService.findAllPublic(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID (público)' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOnePublic(@Param('id') id: string) {
    return this.productsService.findOnePublic(id);
  }
}
