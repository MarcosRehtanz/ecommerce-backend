import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid('El ID del producto debe ser un UUID válido'),
  quantity: z.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima es 1'),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;

export class AddToCartDtoSwagger {
  @ApiProperty({ example: 'uuid-del-producto' })
  productId: string;

  @ApiProperty({ example: 1 })
  quantity: number;
}
