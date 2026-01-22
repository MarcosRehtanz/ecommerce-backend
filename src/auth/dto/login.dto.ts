import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export class LoginDtoSwagger {
  @ApiProperty({ example: 'usuario@email.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}
