import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Delete notifications marked as read that are older than 24 hours
  async cleanupOldReadNotifications() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: twentyFourHoursAgo },
        },
      });
    } catch (err) {
      console.error('Error during 24h notification cleanup:', err);
    }
  }

  async findAll(recipient?: string) {
    try {
      // Purge read notifications older than 24h before returning
      await this.cleanupOldReadNotifications();

      if (!recipient) {
        return this.prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
      }

      const isObjectId = OBJECT_ID_REGEX.test(recipient);

      const userOrConditions: any[] = [
        { email: { equals: recipient, mode: 'insensitive' } },
        { fullName: { equals: recipient, mode: 'insensitive' } },
        { username: { equals: recipient, mode: 'insensitive' } },
      ];
      if (isObjectId) {
        userOrConditions.push({ id: recipient });
      }

      // Find recipient user profile safely
      const recipientUser = await this.prisma.user.findFirst({
        where: { OR: userOrConditions },
      });

      const matchConditions: any[] = [
        { recipient: { equals: recipient, mode: 'insensitive' } },
      ];

      if (recipientUser) {
        if (recipientUser.email) {
          matchConditions.push({ recipient: { equals: recipientUser.email, mode: 'insensitive' } });
        }
        if (recipientUser.fullName) {
          matchConditions.push({ recipient: { equals: recipientUser.fullName, mode: 'insensitive' } });
        }
        if (recipientUser.id) {
          matchConditions.push({ recipient: recipientUser.id });
        }
      }

      return this.prisma.notification.findMany({
        where: {
          OR: matchConditions,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    } catch (err) {
      console.error('Error in NotificationsService.findAll:', err);
      return [];
    }
  }

  async markAsRead(id: string) {
    if (!OBJECT_ID_REGEX.test(id)) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(recipient?: string) {
    return this.prisma.notification.updateMany({
      where: recipient ? { recipient, isRead: false } : { isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(data: {
    recipient: string;
    author: string;
    title: string;
    message: string;
    taskId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        recipient: data.recipient,
        author: data.author,
        title: data.title,
        message: data.message,
        taskId: data.taskId && OBJECT_ID_REGEX.test(data.taskId) ? data.taskId : null,
      },
    });
  }

  async notifyTaskMembers(
    taskId: string,
    author: string,
    title: string,
    message: string,
    recipientList?: string[],
  ) {
    if (!OBJECT_ID_REGEX.test(taskId)) return;

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) return;

    const isAuthorObjectId = OBJECT_ID_REGEX.test(author);
    const authorOrConditions: any[] = [
      { email: { equals: author, mode: 'insensitive' } },
      { fullName: { equals: author, mode: 'insensitive' } },
      { username: { equals: author, mode: 'insensitive' } },
    ];
    if (isAuthorObjectId) {
      authorOrConditions.push({ id: author });
    }

    // Resolve author user profile safely
    const authorUser = await this.prisma.user.findFirst({
      where: { OR: authorOrConditions },
    });

    const authorKeys = new Set<string>();
    authorKeys.add(author.trim().toLowerCase());
    if (authorUser) {
      if (authorUser.id) authorKeys.add(authorUser.id.toLowerCase());
      if (authorUser.email) authorKeys.add(authorUser.email.toLowerCase());
      if (authorUser.fullName) authorKeys.add(authorUser.fullName.toLowerCase());
    }

    // Collect candidate recipients
    const candidateRecipients = new Set<string>();

    if (task.reporter) candidateRecipients.add(task.reporter);

    task.assignees.forEach((user) => {
      if (user.email) candidateRecipients.add(user.email);
      if (user.fullName) candidateRecipients.add(user.fullName);
    });

    if (recipientList && Array.isArray(recipientList)) {
      recipientList.forEach((r) => candidateRecipients.add(r));
    }

    // If task has no specific members assigned, notify all workspace users except author
    if (candidateRecipients.size === 0) {
      const allUsers = await this.prisma.user.findMany();
      allUsers.forEach((u) => {
        if (u.email) candidateRecipients.add(u.email);
        if (u.fullName) candidateRecipients.add(u.fullName);
      });
    }

    const displayAuthor = authorUser?.fullName || authorUser?.email || author;

    for (const recipient of Array.from(candidateRecipients)) {
      const recLower = recipient.trim().toLowerCase();

      // STRICT EXCLUSION: Never send notification to the author who made the change or sent the message
      let isAuthor = authorKeys.has(recLower);
      if (!isAuthor && authorUser && authorUser.fullName) {
        const fnLower = authorUser.fullName.toLowerCase();
        if (recLower.includes(fnLower) || fnLower.includes(recLower)) {
          isAuthor = true;
        }
      }

      if (!isAuthor) {
        await this.createNotification({
          recipient,
          author: displayAuthor,
          title,
          message,
          taskId,
        });
      }
    }
  }
}
