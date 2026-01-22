import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export class CreateOrderDtoSwagger {
  @ApiProperty({ example: 'Calle 123, Ciudad', required: false })
  shippingAddress?: string;

  @ApiProperty({ example: 'Dejar en portería', required: false })
  notes?: string;
}
