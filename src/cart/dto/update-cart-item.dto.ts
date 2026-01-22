import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateCartItemSchema = z.object({
  quantity: z.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima es 1'),
});

export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

export class UpdateCartItemDtoSwagger {
  @ApiProperty({ example: 2 })
  quantity: number;
}
