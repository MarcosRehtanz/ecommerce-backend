import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const queryCategoriesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  search: z.string().optional(),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional(),
  ),
  sortBy: z.string().default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type QueryCategoriesDto = z.infer<typeof queryCategoriesSchema>;

export class QueryCategoriesDtoSwagger {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;

  @ApiProperty({ required: false })
  search?: string;

  @ApiProperty({ required: false })
  isActive?: boolean;

  @ApiProperty({ required: false, default: 'displayOrder' })
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'asc' })
  sortOrder?: 'asc' | 'desc';
}
