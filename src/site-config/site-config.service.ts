import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteConfigDto } from './dto/create-site-config.dto';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.siteConfig.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const config = await this.prisma.siteConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración '${key}' no encontrada`);
    }

    return config;
  }

  async findByKeyPublic(key: string) {
    const config = await this.prisma.siteConfig.findUnique({
      where: { key, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(`Configuración '${key}' no encontrada`);
    }

    return config;
  }

  async getHomepageConfig() {
    const keys = ['topbar', 'hero', 'special-offer'];

    const configs = await this.prisma.siteConfig.findMany({
      where: {
        key: { in: keys },
        isActive: true,
      },
    });

    const result: Record<string, any> = {};
    for (const config of configs) {
      result[config.key] = config.value;
    }

    return result;
  }

  async create(dto: CreateSiteConfigDto) {
    const existing = await this.prisma.siteConfig.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una configuración con la clave '${dto.key}'`);
    }

    return this.prisma.siteConfig.create({
      data: {
        ...dto,
        value: (dto.value ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  async update(key: string, dto: UpdateSiteConfigDto) {
    await this.findByKey(key);

    return this.prisma.siteConfig.update({
      where: { key },
      data: dto,
    });
  }

  async remove(key: string) {
    await this.findByKey(key);

    await this.prisma.siteConfig.delete({
      where: { key },
    });

    return { message: 'Configuración eliminada correctamente' };
  }
}
