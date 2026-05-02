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
  contactExchange?: {
    user1Id: string;
    user2Id: string;
    user1Wechat: string | null;
    user1Qq: string | null;
    user2Wechat: string | null;
    user2Qq: string | null;
  };
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

    // Query both users' contact info for exchange
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { user1Id: true, user2Id: true },
    });

    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: relationship!.user1Id },
        select: { id: true, nickname: true, wechat: true, qq: true },
      }),
      this.prisma.user.findUnique({
        where: { id: relationship!.user2Id },
        select: { id: true, nickname: true, wechat: true, qq: true },
      }),
    ]);

    // Build contact exchange system message
    const lines = ['🎉 联系方式已交换'];
    if (user1?.wechat) lines.push(`${user1.nickname}的微信: ${user1.wechat}`);
    if (user1?.qq) lines.push(`${user1.nickname}的QQ: ${user1.qq}`);
    if (user2?.wechat) lines.push(`${user2.nickname}的微信: ${user2.wechat}`);
    if (user2?.qq) lines.push(`${user2.nickname}的QQ: ${user2.qq}`);

    await this.chatService.createSystemMessage(
      relationshipId,
      lines.join('\n'),
    );

    return {
      type: 'roomReadOnly',
      relationshipId,
      reason: 'FLIRTING',
      message: '聊天室已转为只读模式',
      contactExchange: {
        user1Id: user1!.id,
        user2Id: user2!.id,
        user1Wechat: user1?.wechat ?? null,
        user1Qq: user1?.qq ?? null,
        user2Wechat: user2?.wechat ?? null,
        user2Qq: user2?.qq ?? null,
      },
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
