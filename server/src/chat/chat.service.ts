import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { MessageType } from '@prisma/client';

export interface MessageVisibility {
  canSee: boolean;
  displaySenderId: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: {
    relationshipId: string;
    senderId: string;
    content: string;
    type: MessageType;
    targetUserId?: string;
    isSystem?: boolean;
    requireConfirm?: boolean;
  }) {
    return this.prisma.message.create({
      data: {
        relationshipId: data.relationshipId,
        senderId: data.senderId,
        content: data.content,
        type: data.type,
        targetUserId: data.targetUserId ?? null,
        isSystem: data.isSystem ?? false,
        requireConfirm: data.requireConfirm ?? false,
        confirmed: false,
      },
      include: {
        sender: {
          select: { id: true, nickname: true, avatar: true },
        },
      },
    });
  }

  async getMessages(
    relationshipId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    const where: any = {
      relationshipId,
      OR: [
        { type: 'MAIN' },
        { type: 'SYSTEM' },
        {
          type: 'PRIVATE',
          OR: [{ senderId: userId }, { targetUserId: userId }],
        },
        {
          type: 'PENDING',
          OR: [{ senderId: userId }, { targetUserId: userId }],
        },
      ],
    };

    if (cursor) {
      const cursorMsg = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        where.createdAt = { lt: cursorMsg.createdAt };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: { id: true, nickname: true, avatar: true },
        },
      },
    });

    return messages.reverse();
  }

  async confirmMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.type !== 'PENDING') {
      return null;
    }

    if (message.targetUserId !== userId) {
      return null;
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        type: 'MAIN',
        confirmed: true,
        requireConfirm: false,
        senderId: message.targetUserId ?? message.senderId,
      },
      include: {
        sender: {
          select: { id: true, nickname: true, avatar: true },
        },
      },
    });

    return updated;
  }

  async rejectMessage(messageId: string) {
    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }

  async createSystemMessage(relationshipId: string, content: string) {
    return this.createMessage({
      relationshipId,
      senderId: 'system',
      content,
      type: 'SYSTEM' as MessageType,
      isSystem: true,
    });
  }

  async findMessageById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
    });
  }

  async findRelationshipById(relationshipId: string) {
    return this.prisma.relationship.findUnique({
      where: { id: relationshipId },
    });
  }

  async findWingmanAssignment(relationshipId: string, userId: string) {
    return this.prisma.wingmanAssignment.findFirst({
      where: { relationshipId, userId, leftAt: null },
    });
  }

  async updateWingmanMode(assignmentId: string, mode: string) {
    return this.prisma.wingmanAssignment.update({
      where: { id: assignmentId },
      data: { mode: mode as any },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Compute whether a user can see a message based on their role and wingman mode.
   */
  computeVisibility(
    message: { type: string; senderId: string; targetUserId: string | null },
    viewerId: string,
    viewerRole: 'client1' | 'client2' | 'wingman1' | 'wingman2',
    wingmanMode1: string | null,
    wingmanMode2: string | null,
  ): MessageVisibility {
    if (message.type === 'SYSTEM') {
      return { canSee: true, displaySenderId: message.senderId };
    }

    if (message.type === 'MAIN') {
      if (viewerRole === 'client1' || viewerRole === 'client2') {
        return { canSee: true, displaySenderId: message.senderId };
      }

      const mode = viewerRole === 'wingman1' ? wingmanMode1 : wingmanMode2;
      if (mode === 'SOLO' || mode === 'ASSIST') {
        return { canSee: true, displaySenderId: message.senderId };
      }
      return { canSee: false, displaySenderId: message.senderId };
    }

    if (message.type === 'PRIVATE') {
      if (message.senderId === viewerId || message.targetUserId === viewerId) {
        return { canSee: true, displaySenderId: message.senderId };
      }
      return { canSee: false, displaySenderId: message.senderId };
    }

    if (message.type === 'PENDING') {
      if (message.senderId === viewerId || message.targetUserId === viewerId) {
        return { canSee: true, displaySenderId: message.senderId };
      }
      return { canSee: false, displaySenderId: message.senderId };
    }

    return { canSee: false, displaySenderId: message.senderId };
  }
}
