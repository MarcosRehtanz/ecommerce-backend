import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const RoleEnum = z.enum(['ADMIN', 'USER']);

export const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: RoleEnum.optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export class UpdateUserDtoSwagger {
  @ApiProperty({ example: 'Juan Pérez', required: false })
  name?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  password?: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'], required: false })
  role?: string;
}
