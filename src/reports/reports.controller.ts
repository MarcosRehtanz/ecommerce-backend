import {
  Controller,
  Get,
  Query,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportsDto, queryReportsSchema } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodQueryValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadisticas del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadisticas del dashboard' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Obtener reporte de ventas' })
  @ApiResponse({ status: 200, description: 'Reporte de ventas con tendencias' })
  getSalesReport(
    @Query(new ZodQueryValidationPipe(queryReportsSchema))
    query: QueryReportsDto,
  ) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Obtener productos mas vendidos' })
  @ApiResponse({ status: 200, description: 'Lista de productos mas vendidos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reportsService.getTopProducts(limit);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obtener productos con bajo stock' })
  @ApiResponse({ status: 200, description: 'Lista de productos con stock bajo' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  getLowStockProducts(
    @Query('threshold', new DefaultValuePipe(5), ParseIntPipe)
    threshold: number,
  ) {
    return this.reportsService.getLowStockProducts(threshold);
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Obtener pedidos recientes' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos recientes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentOrders(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.reportsService.getRecentOrders(limit);
  }

  @Get('export/orders')
  @ApiOperation({ summary: 'Exportar pedidos a CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV de pedidos' })
  async exportOrders(
    @Query(new ZodQueryValidationPipe(queryReportsSchema))
    query: QueryReportsDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportOrders(query);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }

  @Get('export/sales')
  @ApiOperation({ summary: 'Exportar reporte de ventas a CSV' })
  @ApiResponse({
    status: 200,
    description: 'Archivo CSV del reporte de ventas',
  })
  async exportSalesReport(
    @Query(new ZodQueryValidationPipe(queryReportsSchema))
    query: QueryReportsDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportSalesReport(query);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }
}
