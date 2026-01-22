import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserDtoSwagger,
  createUserSchema,
} from './dto/create-user.dto';
import {
  UpdateUserDto,
  UpdateUserDtoSwagger,
  updateUserSchema,
} from './dto/update-user.dto';
import {
  UpdateProfileDto,
  UpdateProfileDtoSwagger,
  updateProfileSchema,
} from './dto/update-profile.dto';
import { QueryUsersDto, queryUsersSchema } from './dto/query-users.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  ZodValidationPipe,
  ZodQueryValidationPipe,
} from '../common/pipes/zod-validation.pipe';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios paginada' })
  findAll(
    @Query(new ZodQueryValidationPipe(queryUsersSchema))
    query: QueryUsersDto,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  @ApiOperation({ summary: 'Crear usuario (Admin)' })
  @ApiBody({ type: CreateUserDtoSwagger })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  @ApiOperation({ summary: 'Actualizar usuario (Admin)' })
  @ApiBody({ type: UpdateUserDtoSwagger })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (Admin)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ==================== USER ENDPOINTS ====================

  @Patch('profile')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiBody({ type: UpdateProfileDtoSwagger })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
