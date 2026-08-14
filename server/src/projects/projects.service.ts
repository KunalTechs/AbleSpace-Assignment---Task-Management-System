import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { title: string; priority?: Priority; leadName?: string; dueDate?: string }) {
    return this.prisma.project.create({
      data: {
        title: data.title,
        priority: data.priority || Priority.MEDIUM,
        leadName: data.leadName || 'Dexter',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }
}