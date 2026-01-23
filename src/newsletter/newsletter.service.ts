import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto) {
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Este correo ya está suscrito al newsletter');
      }

      // Reactivate subscription
      return this.prisma.newsletterSubscription.update({
        where: { email: dto.email },
        data: { isActive: true, subscribedAt: new Date() },
      });
    }

    return this.prisma.newsletterSubscription.create({
      data: {
        email: dto.email,
      },
    });
  }

  async unsubscribe(email: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return this.prisma.newsletterSubscription.update({
      where: { email },
      data: { isActive: false },
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
      }),
      this.prisma.newsletterSubscription.count(),
    ]);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    await this.prisma.newsletterSubscription.delete({
      where: { id },
    });

    return { message: 'Suscripción eliminada correctamente' };
  }
}
