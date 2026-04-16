import { PrismaService } from '../../src/prisma/prisma.service.js';
import type { WingmanMode, RelationshipStatus } from '@prisma/client';

export class Fixture {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSystemUser() {
    await this.prisma.user.upsert({
      where: { id: 'system' },
      update: {},
      create: {
        id: 'system',
        email: 'system@violet.internal',
        nickname: '系统',
        password: 'internal',
        roles: ['CLIENT'],
      },
    });
  }

  async createUser(overrides: Partial<{
    email: string;
    nickname: string;
    password: string;
    gender: string;
    campus: string;
    grade: string;
    major: string;
    roles: string[];
  }> = {}) {
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return this.prisma.user.create({
      data: {
        id,
        email: overrides.email ?? `${id}@test.nju.edu.cn`,
        nickname: overrides.nickname ?? `TestUser_${id.slice(0, 8)}`,
        password: overrides.password ?? 'hashed_password',
        gender: overrides.gender ?? 'other',
        campus: overrides.campus ?? '仙林',
        grade: overrides.grade ?? '大二',
        major: overrides.major ?? '计算机',
        roles: (overrides.roles ?? ['CLIENT']) as any[],
      },
    });
  }

  async createRelationship(
    user1Id: string,
    user2Id: string,
    status: RelationshipStatus = 'MATCHING',
  ) {
    return this.prisma.relationship.create({
      data: {
        user1Id,
        user2Id,
        status: status as any,
      },
    });
  }

  async createWingmanAssignment(
    relationshipId: string,
    userId: string,
    side: number,
    mode: WingmanMode = 'PRIVATE',
  ) {
    return this.prisma.wingmanAssignment.create({
      data: {
        relationshipId,
        userId,
        side,
        mode: mode as any,
      },
    });
  }

  async setupFourPersonRoom(
    relStatus: RelationshipStatus = 'ICEBREAKING',
    wingman1Mode: WingmanMode = 'PRIVATE',
    wingman2Mode: WingmanMode = 'PRIVATE',
  ) {
    const client1 = await this.createUser({ nickname: '当事人1', roles: ['CLIENT'] });
    const client2 = await this.createUser({ nickname: '当事人2', roles: ['CLIENT'] });
    const wingman1 = await this.createUser({ nickname: '军师1', roles: ['CLIENT', 'WINGMAN'] });
    const wingman2 = await this.createUser({ nickname: '军师2', roles: ['CLIENT', 'WINGMAN'] });

    const relationship = await this.createRelationship(client1.id, client2.id, relStatus);

    const assignment1 = await this.createWingmanAssignment(relationship.id, wingman1.id, 1, wingman1Mode);
    const assignment2 = await this.createWingmanAssignment(relationship.id, wingman2.id, 2, wingman2Mode);

    return {
      client1,
      client2,
      wingman1,
      wingman2,
      relationship,
      assignment1,
      assignment2,
    };
  }
}
