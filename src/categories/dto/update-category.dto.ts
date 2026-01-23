import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url('La URL de imagen no es válida').optional().nullable(),
  imageData: z
    .string()
    .regex(
      /^data:image\/(jpeg|jpg|png|gif|webp);base64,/,
      'El formato de imagen debe ser base64 válido (jpeg, png, gif, webp)',
    )
    .max(3000000, 'La imagen no debe superar 2MB')
    .optional()
    .nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export class UpdateCategoryDtoSwagger {
  @ApiProperty({ example: 'Electrónica', required: false })
  name?: string;

  @ApiProperty({ example: 'electronica', required: false })
  slug?: string;

  @ApiProperty({ example: 'Dispositivos electrónicos y gadgets', required: false })
  description?: string;

  @ApiProperty({ example: 'https://example.com/category.jpg', required: false })
  imageUrl?: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,...', required: false })
  imageData?: string;

  @ApiProperty({ example: 0, required: false })
  displayOrder?: number;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;
}
