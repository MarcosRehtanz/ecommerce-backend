import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

/**
 * SiteConfig - Configuraciones dinámicas del sitio
 *
 * Este módulo permite almacenar configuraciones del frontend en la base de datos
 * como JSON, permitiendo que el admin modifique el contenido sin tocar código.
 *
 * FLUJO:
 * 1. Admin crea/actualiza config → POST/PUT /site-config
 * 2. Se guarda en DB como JSON (tabla site_configurations)
 * 3. Frontend consume → GET /site-config/homepage
 * 4. Componentes (TopBar, HeroSection, SpecialOffer) renderizan dinámicamente
 *
 * KEYS UTILIZADAS:
 * - "topbar": Barra superior con mensaje promocional
 *   { message: string, isVisible: boolean, backgroundColor?: string, textColor?: string }
 *
 * - "hero": Sección principal del homepage
 *   { title: string, subtitle: string, primaryButtonText: string, primaryButtonLink: string,
 *     secondaryButtonText?: string, secondaryButtonLink?: string, backgroundImage?: string, isVisible: boolean }
 *
 * - "special-offer": Banner de oferta especial
 *   { title: string, subtitle: string, description: string, buttonText: string,
 *     buttonLink: string, endDate?: string, isVisible: boolean, backgroundColor?: string }
 */

// El campo 'value' acepta cualquier estructura JSON válida
const jsonValue = z.union([
  z.record(z.unknown()),  // Objeto: { key: value }
  z.array(z.unknown()),   // Array: [item1, item2]
  z.string(),             // String: "texto"
  z.number(),             // Número: 123
  z.boolean(),            // Booleano: true/false
  z.null(),               // Null
]);

export const createSiteConfigSchema = z.object({
  key: z
    .string()
    .min(2, 'La clave debe tener al menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'La clave solo puede contener letras minúsculas, números y guiones'),
  value: jsonValue,
  isActive: z.boolean().default(true),
});

export type CreateSiteConfigDto = z.infer<typeof createSiteConfigSchema>;

export class CreateSiteConfigDtoSwagger {
  @ApiProperty({
    example: 'hero',
    description: 'Clave única para identificar la configuración (ej: topbar, hero, special-offer)',
  })
  key: string;

  @ApiProperty({
    example: {
      title: 'Bienvenido a Mi Tienda',
      subtitle: 'Tu tienda online favorita',
      imageUrl: 'https://example.com/hero.jpg',
      isVisible: true,
    },
    description: 'Valor JSON con la configuración. La estructura depende del key utilizado.',
  })
  value: unknown;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Si está activa, el frontend la mostrará',
  })
  isActive?: boolean;
}
