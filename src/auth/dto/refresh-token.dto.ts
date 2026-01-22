import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export class RefreshTokenDtoSwagger {
  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken: string;
}
