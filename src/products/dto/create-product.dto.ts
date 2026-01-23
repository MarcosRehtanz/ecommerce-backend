import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  originalPrice: z.number().min(0, 'El precio original debe ser mayor o igual a 0').nullable().optional(),
  featured: z.boolean().optional(),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
  imageUrl: z.string().url('La URL de imagen no es válida').optional(),
  imageData: z
    .string()
    .regex(
      /^data:image\/(jpeg|jpg|png|gif|webp);base64,/,
      'El formato de imagen debe ser base64 válido (jpeg, png, gif, webp)',
    )
    .max(3000000, 'La imagen no debe superar 2MB')
    .optional(),
  categoryId: z.string().uuid('El ID de categoría debe ser un UUID válido').optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export class CreateProductDtoSwagger {
  @ApiProperty({ example: 'Laptop HP Pavilion' })
  name: string;

  @ApiProperty({ example: 'Laptop de alto rendimiento con procesador Intel i7' })
  description: string;

  @ApiProperty({ example: 999.99 })
  price: number;

  @ApiProperty({ example: 1299.99, required: false })
  originalPrice?: number | null;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  imageUrl?: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,...', required: false })
  imageData?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
  categoryId?: string;
}
