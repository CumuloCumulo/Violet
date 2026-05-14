import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '@prisma/client';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string | null;
  data: Prisma.JsonValue | null;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    content?: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationPayload> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content ?? null,
        data: params.data ? (params.data as Prisma.InputJsonValue) : undefined,
      },
    });

    // Emit decoupled event — ChatGateway listens and pushes via WebSocket
    this.eventEmitter.emit('notification.created', notification);

    return notification;
  }

  async getNotifications(
    userId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const where: any = { userId };
    if (cursor) {
      const cursorNotification = await this.prisma.notification.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorNotification) {
        where.createdAt = { lt: cursorNotification.createdAt };
      }
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, -1) : notifications;

    return { notifications: items, hasMore };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      return null;
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }
}
