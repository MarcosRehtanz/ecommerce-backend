import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const updateSiteConfigSchema = z.object({
  value: z.any().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSiteConfigDto = z.infer<typeof updateSiteConfigSchema>;

export class UpdateSiteConfigDtoSwagger {
  @ApiProperty({
    example: {
      title: 'Bienvenido a Dynnamo',
      subtitle: 'Tu tienda online favorita',
      imageUrl: 'https://example.com/hero.jpg',
    },
    required: false,
  })
  value?: any;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;
}
