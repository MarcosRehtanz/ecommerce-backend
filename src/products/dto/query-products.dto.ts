import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Helper to transform string booleans from query params
const stringToBoolean = z
  .string()
  .optional()
  .transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  });

// Helper to transform string numbers from query params
const stringToNumber = z
  .string()
  .optional()
  .transform((val) => (val ? Number(val) : undefined))
  .pipe(z.number().optional());

export const queryProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional(),
  ),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional(),
  ),
  featured: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional(),
  ),
  categoryId: z.string().uuid().optional(),
  category: z.string().optional(), // slug de la categoría
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryProductsDto = z.infer<typeof queryProductsSchema>;

export class QueryProductsDtoSwagger {
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  limit?: number;

  @ApiProperty({ required: false })
  search?: string;

  @ApiProperty({ required: false })
  minPrice?: number;

  @ApiProperty({ required: false })
  maxPrice?: number;

  @ApiProperty({ required: false })
  inStock?: boolean;

  @ApiProperty({ required: false })
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'UUID de la categoría' })
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Slug de la categoría' })
  category?: string;

  @ApiProperty({ required: false, default: 'createdAt' })
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc';
}
