import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const RoleEnum = z.enum(['ADMIN', 'USER']);

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  search: z.string().optional(),
  role: RoleEnum.optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryUsersDto = z.infer<typeof queryUsersSchema>;

export class QueryUsersDtoSwagger {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;

  @ApiProperty({ required: false })
  search?: string;

  @ApiProperty({ required: false, enum: ['ADMIN', 'USER'] })
  role?: string;

  @ApiProperty({ required: false, default: 'createdAt' })
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc';
}
