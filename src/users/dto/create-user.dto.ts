import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const RoleEnum = z.enum(['ADMIN', 'USER']);

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: RoleEnum.default('USER').optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export class CreateUserDtoSwagger {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'], default: 'USER' })
  role?: string;
}
