import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export class RegisterDtoSwagger {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  name: string;
}
