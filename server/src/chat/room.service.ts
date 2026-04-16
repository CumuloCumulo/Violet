import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface RoomMember {
  userId: string;
  role: 'client1' | 'client2' | 'wingman1' | 'wingman2';
  wingmanMode?: string;
}

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  getRoomId(relationshipId: string): string {
    return `relationship:${relationshipId}`;
  }

  async getRoomMembers(relationshipId: string): Promise<RoomMember[]> {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: { wingmen: true },
    });

    if (!relationship) {
      return [];
    }

    const members: RoomMember[] = [
      { userId: relationship.user1Id, role: 'client1' },
      { userId: relationship.user2Id, role: 'client2' },
    ];

    for (const assignment of relationship.wingmen) {
      if (!assignment.leftAt) {
        members.push({
          userId: assignment.userId,
          role: assignment.side === 1 ? 'wingman1' : 'wingman2',
          wingmanMode: assignment.mode,
        });
      }
    }

    return members;
  }

  async validateMembership(relationshipId: string, userId: string): Promise<RoomMember | null> {
    const members = await this.getRoomMembers(relationshipId);
    return members.find((m) => m.userId === userId) ?? null;
  }

  async canSendToRoom(
    relationshipId: string,
    userId: string,
    messageType: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      return { allowed: false, reason: 'Relationship not found' };
    }

    if (relationship.status !== 'ICEBREAKING') {
      return { allowed: false, reason: 'Relationship is not in ICEBREAKING phase' };
    }

    const member = await this.validateMembership(relationshipId, userId);
    if (!member) {
      return { allowed: false, reason: 'User is not a room member' };
    }

    return { allowed: true };
  }

  async getWingmanModes(
    relationshipId: string,
  ): Promise<{ wingmanMode1: string | null; wingmanMode2: string | null }> {
    const assignments = await this.prisma.wingmanAssignment.findMany({
      where: { relationshipId, leftAt: null },
    });

    const w1 = assignments.find((a) => a.side === 1);
    const w2 = assignments.find((a) => a.side === 2);

    return {
      wingmanMode1: w1?.mode ?? null,
      wingmanMode2: w2?.mode ?? null,
    };
  }
}
