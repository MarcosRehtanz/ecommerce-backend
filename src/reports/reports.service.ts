import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReportsDto, ReportPeriodEnum } from './dto';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

type ReportPeriodType = z.infer<typeof ReportPeriodEnum>;

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard overview stats
   */
  async getDashboardStats() {
    const [
      totalProducts,
      activeProducts,
      totalUsers,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
      lowStockProducts,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { total: true },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: 5 },
        },
      }),
    ]);

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
      },
      users: {
        total: totalUsers,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        inProgress: confirmedOrders + shippedOrders,
      },
      revenue: {
        total: Number(revenueResult._sum.total) || 0,
      },
    };
  }

  /**
   * Get sales report with trends
   */
  async getSalesReport(query: QueryReportsDto) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    // Get orders in date range (excluding cancelled)
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by period
    const period: ReportPeriodType = query.period || 'daily';
    const groupedData = this.groupOrdersByPeriod(orders, period);

    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalSales,
        totalOrders,
        averageOrderValue,
      },
      data: groupedData,
    };
  }

  /**
   * Get top selling products
   */
  async getTopProducts(limit: number = 10) {
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        imageData: true,
      },
    });

    // Merge data
    return topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Producto eliminado',
        price: Number(product?.price) || 0,
        imageUrl: product?.imageUrl,
        imageData: product?.imageData,
        totalSold: item._sum.quantity || 0,
        totalRevenue: (item._sum.quantity || 0) * (Number(product?.price) || 0),
      };
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 5) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: threshold },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        imageUrl: true,
        imageData: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }

  /**
   * Get recent orders for dashboard
   */
  async getRecentOrders(limit: number = 5) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });
  }

  /**
   * Export orders to CSV format
   */
  async exportOrders(query: QueryReportsDto) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'ID',
      'Fecha',
      'Cliente',
      'Email',
      'Estado',
      'Productos',
      'Cantidad Items',
      'Total',
    ];

    const rows = orders.map((order) => [
      order.id,
      order.createdAt.toISOString(),
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.status,
      order.items.map((i) => i.product.name).join('; '),
      order.items.reduce((sum, i) => sum + i.quantity, 0),
      Number(order.total).toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return {
      filename: `orders-${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  /**
   * Export sales report to CSV
   */
  async exportSalesReport(query: QueryReportsDto) {
    const salesReport = await this.getSalesReport(query);

    const headers = ['Fecha', 'Pedidos', 'Ventas'];
    const rows = salesReport.data.map((item) => [
      item.date,
      item.orders,
      item.sales.toFixed(2),
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['Resumen', '', '']);
    rows.push(['Total Pedidos', salesReport.summary.totalOrders, '']);
    rows.push(['Total Ventas', '', salesReport.summary.totalSales.toFixed(2)]);
    rows.push([
      'Promedio por Pedido',
      '',
      salesReport.summary.averageOrderValue.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return {
      filename: `sales-report-${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      mimeType: 'text/csv',
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private groupOrdersByPeriod(
    orders: Array<{ id: string; total: any; createdAt: Date; status: OrderStatus }>,
    period: ReportPeriodType
  ) {
    const grouped = new Map<string, { orders: number; sales: number }>();

    orders.forEach((order) => {
      const key = this.getDateKey(order.createdAt, period);
      const existing = grouped.get(key) || { orders: 0, sales: 0 };
      grouped.set(key, {
        orders: existing.orders + 1,
        sales: existing.sales + Number(order.total),
      });
    });

    // Convert to array and sort
    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        sales: data.sales,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getDateKey(date: Date, period: ReportPeriodType): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
      case 'daily':
        return `${year}-${month}-${day}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      case 'monthly':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }
}
