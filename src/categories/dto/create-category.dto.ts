import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().optional(),
  imageUrl: z.string().url('La URL de imagen no es válida').optional(),
  imageData: z
    .string()
    .regex(
      /^data:image\/(jpeg|jpg|png|gif|webp);base64,/,
      'El formato de imagen debe ser base64 válido (jpeg, png, gif, webp)',
    )
    .max(3000000, 'La imagen no debe superar 2MB')
    .optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export class CreateCategoryDtoSwagger {
  @ApiProperty({ example: 'Electrónica' })
  name: string;

  @ApiProperty({ example: 'electronica' })
  slug: string;

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
