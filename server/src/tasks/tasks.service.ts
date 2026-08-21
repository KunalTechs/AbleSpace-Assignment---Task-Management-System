import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(params: { search?: string; projectId?: string; userId?: string }) {
    const { search, projectId, userId } = params;
    return this.prisma.task.findMany({
      where: {
        ...(projectId && OBJECT_ID_REGEX.test(projectId) ? { projectId } : {}),
        ...(userId && OBJECT_ID_REGEX.test(userId) ? { userIds: { has: userId } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        project: true,
        assignees: true,
        subtasks: true,
        comments: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid task ID format`);
    }

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignees: true,
        subtasks: true,
        comments: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(data: any, userHeader?: string) {
    const { projectId, ...rest } = data;
    const reporter = data.reporter || userHeader || 'Dexter';
    return this.prisma.task.create({
      data: {
        ...rest,
        reporter,
        ...(projectId && OBJECT_ID_REGEX.test(projectId)
          ? { project: { connect: { id: projectId } } }
          : {}),
        updates: {
          create: {
            action: 'created this task',
            author: reporter,
          },
        },
      },
      include: {
        project: true,
        assignees: true,
        subtasks: true,
        comments: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async update(id: string, data: any, userHeader?: string) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid task ID format`);
    }

    const existing = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true, project: true },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Fine-grained permission model:
    // 1. Status changes (dragging task cards) allowed for all workspace members & guest users
    // 2. Critical edits require user to be reporter, assignee, workspace member, or guest user
    if (userHeader) {
      const uLower = userHeader.trim().toLowerCase();
      const isGuestOrSeeded =
        uLower.includes('guest') ||
        uLower.includes('dexter') ||
        uLower.includes('dexuser') ||
        uLower.includes('ankit');

      const reporterLower = (existing.reporter || '').trim().toLowerCase();
      const isReporter = reporterLower && (reporterLower === uLower || reporterLower.includes(uLower));

      const isAssignee = existing.assignees?.some(
        (a) =>
          (a.email && a.email.trim().toLowerCase() === uLower) ||
          (a.fullName && a.fullName.trim().toLowerCase() === uLower) ||
          a.id === userHeader,
      );

      const isUserId = (existing as any).userIds?.includes(userHeader);
      const isStatusOnlyUpdate = Object.keys(data).length === 1 && typeof data.status !== 'undefined';

      // Lock protection: if task is locked, only reporter, assignee, or guest/admin can modify
      if (existing.isLocked && !isGuestOrSeeded && !isReporter && !isAssignee) {
        throw new ForbiddenException('Task is locked. Only task members or admins can modify this task.');
      }

      // Restrict unauthorized edits for non-status property changes
      if (!isStatusOnlyUpdate && !isGuestOrSeeded && !isReporter && !isAssignee && !isUserId) {
        throw new ForbiddenException(
          'Read-only access: Only task members can modify full task details.',
        );
      }
    }

    let updateAction = '';

    if (data.priority && existing && data.priority !== existing.priority) {
      updateAction = `changed priority from ${existing.priority.replace('_', ' ')} to ${data.priority.replace('_', ' ')}`;
    } else if (data.status && existing && data.status !== existing.status) {
      updateAction = `changed status to ${data.status}`;
    } else if (data.dueDate && existing && String(data.dueDate) !== String(existing.dueDate)) {
      updateAction = `updated due date`;
    } else if (data.role && existing && data.role !== existing.role) {
      updateAction = `changed role to ${data.role}`;
    } else if (data.reporter && existing && data.reporter !== existing.reporter) {
      updateAction = `changed reporter to ${data.reporter}`;
    } else if (typeof data.isLocked !== 'undefined' && existing && data.isLocked !== existing.isLocked) {
      updateAction = data.isLocked ? 'locked this task' : 'unlocked this task';
    } else if (typeof data.isPublic !== 'undefined' && existing && data.isPublic !== existing.isPublic) {
      updateAction = data.isPublic ? 'made this task public' : 'made this task private';
    } else if (data.title && existing && data.title !== existing.title) {
      updateAction = `updated title to "${data.title}"`;
    } else if (typeof data.description !== 'undefined' && existing && data.description !== existing.description) {
      updateAction = `updated task description`;
    } else if (data.labels && existing && JSON.stringify(data.labels) !== JSON.stringify(existing.labels)) {
      updateAction = `updated labels`;
    } else if (typeof data.projectId !== 'undefined' && existing && data.projectId !== existing.projectId) {
      updateAction = data.projectId ? `assigned task to project` : `removed task from project`;
    }

    const authorName = userHeader || existing.reporter || 'Dexter';
    const { userIds, projectId, ...scalarData } = data;
    const updatePayload: any = {
      ...scalarData,
      ...(typeof projectId !== 'undefined'
        ? projectId && OBJECT_ID_REGEX.test(projectId)
          ? { project: { connect: { id: projectId } } }
          : { project: { disconnect: true } }
        : {}),
      ...(updateAction
        ? {
            updates: {
              create: {
                action: updateAction,
                author: authorName,
              },
            },
          }
        : {}),
    };

    if (userIds && Array.isArray(userIds)) {
      updatePayload.assignees = {
        set: userIds.map((uid: string) => ({ id: uid })),
      };
    }

    const result = await this.prisma.task.update({
      where: { id },
      data: updatePayload,
      include: {
        project: true,
        assignees: true,
        subtasks: true,
        comments: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (updateAction) {
      await this.notificationsService.notifyTaskMembers(
        id,
        'System',
        `📝 Update on "${result.title}"`,
        updateAction,
      );
    }

    return result;
  }

  async remove(id: string, userHeader?: string) {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new NotFoundException(`Invalid task ID format`);
    }

    const existing = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });
    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (userHeader) {
      const uLower = userHeader.trim().toLowerCase();
      const isGuestOrSeeded =
        uLower.includes('guest') ||
        uLower.includes('dexter') ||
        uLower.includes('dexuser') ||
        uLower.includes('ankit');

      const reporterLower = (existing.reporter || '').trim().toLowerCase();
      const isReporter = reporterLower && (reporterLower === uLower || reporterLower.includes(uLower));
      const isAssignee = existing.assignees?.some(
        (a) =>
          (a.email && a.email.trim().toLowerCase() === uLower) ||
          (a.fullName && a.fullName.trim().toLowerCase() === uLower) ||
          a.id === userHeader,
      );

      if (!isGuestOrSeeded && !isReporter && !isAssignee) {
        throw new ForbiddenException(
          'Read-only access: Only task members or admins can delete this task.',
        );
      }
    }

    // Explicit cleanup for MongoDB child records
    await this.prisma.subtask.deleteMany({ where: { taskId: id } });
    await this.prisma.comment.deleteMany({ where: { taskId: id } });
    await this.prisma.taskUpdate.deleteMany({ where: { taskId: id } });

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userHeader?: string) {
    const original = await this.findOne(id);
    if (!original) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const author = userHeader || original.reporter || 'Dexter';

    return this.prisma.task.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        status: original.status,
        priority: original.priority,
        dueDate: original.dueDate,
        labels: original.labels,
        role: original.role,
        reporter: author,
        projectId: original.projectId,
        isLocked: false,
        isPublic: original.isPublic,
        updates: {
          create: {
            action: `duplicated from "${original.title}"`,
            author,
          },
        },
      },
      include: {
        assignees: true,
        subtasks: true,
        comments: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async addSubtask(taskId: string, data: any) {
    return this.prisma.subtask.create({
      data: {
        title: data.title,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        taskId,
      },
    });
  }

  async deleteSubtask(subtaskId: string) {
    return this.prisma.subtask.delete({
      where: { id: subtaskId },
    });
  }

  async addComment(taskId: string, data: any) {
    if (!OBJECT_ID_REGEX.test(taskId)) {
      throw new NotFoundException(`Invalid task ID format`);
    }

    const content = (data?.content || '').trim();
    if (!content) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const author = data?.author || 'Dexter';
    const type = data?.type || 'COMMENT';
    const comment = await this.prisma.comment.create({
      data: {
        content,
        author,
        type,
        taskId,
      },
    });

    try {
      const task = await this.prisma.task.findUnique({ where: { id: taskId } });
      const mentions = (content.match(/@([\w.-]+)/g) || []).map((m: string) => m.substring(1));

      await this.notificationsService.notifyTaskMembers(
        taskId,
        author,
        mentions.length > 0
          ? `🔔 Tagged in ${type === 'CHAT' ? 'Task Chat' : 'Task Comment'}: "${task?.title || 'Task'}"`
          : type === 'CHAT'
          ? `💬 New Chat Message on "${task?.title || 'Task'}"`
          : `📝 New Comment on "${task?.title || 'Task'}"`,
        content,
        mentions,
      );
    } catch (err) {
      console.error('Failed to dispatch notification for comment:', err);
    }

    return comment;
  }

  async deleteComment(commentId: string) {
    if (!OBJECT_ID_REGEX.test(commentId)) {
      throw new NotFoundException(`Invalid comment ID format`);
    }
    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}