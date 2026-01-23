import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SiteConfigService } from './site-config.service';
import {
  CreateSiteConfigDto,
  CreateSiteConfigDtoSwagger,
  createSiteConfigSchema,
} from './dto/create-site-config.dto';
import {
  UpdateSiteConfigDto,
  UpdateSiteConfigDtoSwagger,
  updateSiteConfigSchema,
} from './dto/update-site-config.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Site Config')
@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas las configuraciones (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones' })
  findAllAdmin() {
    return this.siteConfigService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(createSiteConfigSchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear configuración (Admin)' })
  @ApiBody({ type: CreateSiteConfigDtoSwagger })
  @ApiResponse({ status: 201, description: 'Configuración creada' })
  create(@Body() dto: CreateSiteConfigDto) {
    return this.siteConfigService.create(dto);
  }

  @Put(':key')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateSiteConfigSchema))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar configuración (Admin)' })
  @ApiBody({ type: UpdateSiteConfigDtoSwagger })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  update(@Param('key') key: string, @Body() dto: UpdateSiteConfigDto) {
    return this.siteConfigService.update(key, dto);
  }

  @Delete(':key')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar configuración (Admin)' })
  @ApiResponse({ status: 200, description: 'Configuración eliminada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  remove(@Param('key') key: string) {
    return this.siteConfigService.remove(key);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Get('homepage')
  @ApiOperation({ summary: 'Obtener configuraciones del homepage (público)' })
  @ApiResponse({ status: 200, description: 'Configuraciones del homepage' })
  getHomepageConfig() {
    return this.siteConfigService.getHomepageConfig();
  }

  @Public()
  @Get(':key')
  @ApiOperation({ summary: 'Obtener configuración por clave (público)' })
  @ApiResponse({ status: 200, description: 'Configuración encontrada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  findByKey(@Param('key') key: string) {
    return this.siteConfigService.findByKeyPublic(key);
  }
}
