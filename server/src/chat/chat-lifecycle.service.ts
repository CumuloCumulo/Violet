import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatService } from './chat.service.js';
import { RoomService } from './room.service.js';
import { PresenceService } from './presence.service.js';
import type { RelationshipStatus } from '@prisma/client';

export interface LifecycleEvent {
  type: 'roomOpened' | 'roomClosed' | 'roomEnded' | 'roomReadOnly';
  relationshipId: string;
  reason?: string;
  message: string;
  disconnectedUserIds?: string[];
}

@Injectable()
export class ChatLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly presenceService: PresenceService,
  ) {}

  /**
   * Transition relationship status and return lifecycle event
   * for the caller to broadcast via Socket.io.
   */
  async transitionStatus(
    relationshipId: string,
    newStatus: RelationshipStatus,
  ): Promise<LifecycleEvent | null> {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    const oldStatus = relationship.status;
    if (oldStatus === newStatus) return null;

    await this.prisma.relationship.update({
      where: { id: relationshipId },
      data: { status: newStatus as any },
    });

    if (oldStatus === 'MATCHING' && newStatus === 'ICEBREAKING') {
      return this.onIcebreaking(relationshipId);
    }

    if (oldStatus === 'ICEBREAKING' && newStatus === 'FLIRTING') {
      return this.onFlirting(relationshipId);
    }

    if (newStatus === 'ENDED') {
      return this.onEnded(relationshipId);
    }

    return null;
  }

  private async onIcebreaking(relationshipId: string): Promise<LifecycleEvent> {
    await this.chatService.createSystemMessage(
      relationshipId,
      '破冰聊天已开启，开始你们的对话吧！',
    );

    return {
      type: 'roomOpened',
      relationshipId,
      message: '破冰聊天已开启',
    };
  }

  private async onFlirting(relationshipId: string): Promise<LifecycleEvent> {
    await this.prisma.wingmanAssignment.updateMany({
      where: { relationshipId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await this.chatService.createSystemMessage(
      relationshipId,
      '恭喜进入暧昧期！聊天室已转为只读模式。',
    );

    return {
      type: 'roomReadOnly',
      relationshipId,
      reason: 'FLIRTING',
      message: '聊天室已转为只读模式',
    };
  }

  private async onEnded(relationshipId: string): Promise<LifecycleEvent> {
    await this.chatService.createSystemMessage(relationshipId, '聊天已结束。');

    await this.prisma.wingmanAssignment.updateMany({
      where: { relationshipId, leftAt: null },
      data: { leftAt: new Date() },
    });

    // Clean up Redis presence
    const members = await this.roomService.getRoomMembers(relationshipId);
    const userIds: string[] = [];
    for (const member of members) {
      userIds.push(member.userId);
      await this.presenceService.setOffline(member.userId, relationshipId);
    }

    return {
      type: 'roomEnded',
      relationshipId,
      reason: 'ENDED',
      message: '聊天已结束',
      disconnectedUserIds: userIds,
    };
  }
}
