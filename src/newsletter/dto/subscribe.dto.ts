import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

export type SubscribeDto = z.infer<typeof subscribeSchema>;

export class SubscribeDtoSwagger {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  email: string;
}
