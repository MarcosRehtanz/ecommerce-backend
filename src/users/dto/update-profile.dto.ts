import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export class UpdateProfileDtoSwagger {
  @ApiProperty({ example: 'Juan Pérez', required: false })
  name?: string;

  @ApiProperty({ example: 'currentPassword123', required: false })
  currentPassword?: string;

  @ApiProperty({ example: 'newPassword123', required: false })
  newPassword?: string;
}
