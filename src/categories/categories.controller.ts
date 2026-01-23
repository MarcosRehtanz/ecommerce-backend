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
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  CreateCategoryDtoSwagger,
  createCategorySchema,
} from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryDtoSwagger,
  updateCategorySchema,
} from './dto/update-category.dto';
import {
  QueryCategoriesDto,
  queryCategoriesSchema,
} from './dto/query-categories.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ZodValidationPipe,
  ZodQueryValidationPipe,
} from '../common/pipes/zod-validation.pipe';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas las categorías (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de categorías paginada' })
  findAllAdmin(
    @Query(new ZodQueryValidationPipe(queryCategoriesSchema))
    query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear categoría (Admin)' })
  @ApiBody({ type: CreateCategoryDtoSwagger })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateCategorySchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar categoría (Admin)' })
  @ApiBody({ type: UpdateCategoryDtoSwagger })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar categoría (Admin)' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar categorías activas (público)' })
  @ApiResponse({ status: 200, description: 'Lista de categorías activas' })
  findAllPublic() {
    return this.categoriesService.findAllPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Obtener categoría por slug (público)' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
