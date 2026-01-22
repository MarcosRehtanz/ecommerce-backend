import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { OrderStatusEnum } from './update-order-status.dto';

export const queryOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  status: OrderStatusEnum.optional(),
  userId: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryOrdersDto = z.infer<typeof queryOrdersSchema>;

export class QueryOrdersDtoSwagger {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;

  @ApiProperty({
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
  status?: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false, default: 'createdAt' })
  sortBy?: string;

  @ApiProperty({ required: false, default: 'desc' })
  sortOrder?: 'asc' | 'desc';
}
