import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const ReportPeriodEnum = z.enum(['daily', 'weekly', 'monthly']);

export const queryReportsSchema = z.object({
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  period: ReportPeriodEnum.optional(),
});

export type QueryReportsDto = z.infer<typeof queryReportsSchema>;

// Keep enum for backwards compatibility if needed elsewhere
export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class QueryReportsDtoSwagger {
  @ApiPropertyOptional({ description: 'Fecha de inicio' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin' })
  endDate?: string;

  @ApiPropertyOptional({
    enum: ReportPeriod,
    description: 'Periodo de agrupacion',
  })
  period?: ReportPeriod;
}
