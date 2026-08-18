import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          include: { assignees: true, subtasks: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid project ID format`);
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { assignees: true, subtasks: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(data: any) {
    return this.prisma.project.create({
      data,
      include: {
        tasks: {
          include: { assignees: true, subtasks: true },
        },
      },
    });
  }

  async update(id: string, data: any) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid project ID format`);
    }

    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        tasks: {
          include: { assignees: true, subtasks: true },
        },
      },
    });
  }

  async delete(id: string) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid project ID format`);
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }
}