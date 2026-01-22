import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Recreate OrderStatus enum to match Prisma
export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const updateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export class UpdateOrderStatusDtoSwagger {
  @ApiProperty({
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    example: 'CONFIRMED',
    description: 'Nuevo estado del pedido',
  })
  status: string;
}
