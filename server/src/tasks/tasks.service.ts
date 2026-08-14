import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, CreateSubtaskDto, UpdateSubtaskDto, CreateCommentDto } from './dto/task.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      include: {
        subtasks: true,
        comments: true,
        updates: true,
        assignees: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        comments: { orderBy: { createdAt: 'desc' } },
        updates: { orderBy: { createdAt: 'desc' } },
        assignees: true,
        project: true,
      },
    });

    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority,
        role: dto.role || 'Admin',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        labels: dto.labels || [],
        projectId: dto.projectId,
      },
      include: { subtasks: true, comments: true, updates: true },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);

    // Track priority update in task activity log
    if (dto.priority && dto.priority !== existing.priority) {
      await this.prisma.taskUpdate.create({
        data: {
          taskId: id,
          author: 'You',
          action: `changed priority from ${existing.priority} to ${dto.priority}`,
        },
      });
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { subtasks: true, comments: true, updates: true },
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  // Subtasks
  async addSubtask(taskId: string, dto: CreateSubtaskDto) {
    return this.prisma.subtask.create({
      data: {
        title: dto.title,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        taskId,
      },
    });
  }

  async updateSubtask(subtaskId: string, dto: UpdateSubtaskDto) {
    return this.prisma.subtask.update({
      where: { id: subtaskId },
      data: dto,
    });
  }

  // Comments
  async addComment(taskId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        author: dto.author || 'Dexter',
        taskId,
      },
    });
  }
}