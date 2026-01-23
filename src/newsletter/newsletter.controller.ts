import {
  Controller,
  Get,
  Post,
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
import { NewsletterService } from './newsletter.service';
import {
  SubscribeDto,
  SubscribeDtoSwagger,
  subscribeSchema,
} from './dto/subscribe.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Public()
  @Post('subscribe')
  @UsePipes(new ZodValidationPipe(subscribeSchema))
  @ApiOperation({ summary: 'Suscribirse al newsletter' })
  @ApiBody({ type: SubscribeDtoSwagger })
  @ApiResponse({ status: 201, description: 'Suscripción exitosa' })
  @ApiResponse({ status: 409, description: 'El correo ya está suscrito' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Public()
  @Post('unsubscribe')
  @UsePipes(new ZodValidationPipe(subscribeSchema))
  @ApiOperation({ summary: 'Cancelar suscripción al newsletter' })
  @ApiBody({ type: SubscribeDtoSwagger })
  @ApiResponse({ status: 200, description: 'Suscripción cancelada' })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  unsubscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.unsubscribe(dto.email);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar suscripciones (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de suscripciones' })
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsletterService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Delete('admin/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar suscripción (Admin)' })
  @ApiResponse({ status: 200, description: 'Suscripción eliminada' })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  remove(@Param('id') id: string) {
    return this.newsletterService.remove(id);
  }
}
