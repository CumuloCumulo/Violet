import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreditService } from '../credit/credit.service.js';

const MATCH_REQUEST_COST = 5;
const EXPIRATION_HOURS = 24;

@Injectable()
export class DiscoveryService {
  constructor(
    private prisma: PrismaService,
    private creditService: CreditService,
  ) {}

  async listUsers(userId: string, page: number = 1, pageSize: number = 20) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: { not: userId },
          lastActiveAt: { gte: sevenDaysAgo },
        },
        orderBy: [{ isActive: 'desc' }, { lastActiveAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          gender: true,
          campus: true,
          grade: true,
          interests: true,
          declaration: true,
          isActive: true,
          lastActiveAt: true,
          avatar: true,
          cardImage: true,
        },
      }),
      this.prisma.user.count({
        where: {
          id: { not: userId },
          lastActiveAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return { users, total, page, pageSize };
  }

  async sendMatchRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('不能向自己发起牵线');
    }

    // Check for duplicate pending request (either direction)
    const existingPending = await this.prisma.matchRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });
    if (existingPending) {
      throw new ConflictException('已存在待处理的牵线请求');
    }

    // Check for existing active relationship between these two users
    const existingRelationship = await this.prisma.relationship.findFirst({
      where: {
        status: { not: 'ENDED' },
        OR: [
          { user1Id: fromUserId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: fromUserId },
        ],
      },
    });
    if (existingRelationship) {
      throw new ConflictException('两人之间已存在活跃关系');
    }

    // Deduct credit (throws if insufficient)
    await this.creditService.deductCredit(fromUserId, MATCH_REQUEST_COST);

    // Expire old pending requests from this user before creating new one
    await this.expireOldRequests(fromUserId);

    const request = await this.prisma.matchRequest.create({
      data: {
        fromUserId,
        toUserId,
        status: 'PENDING',
      },
    });

    return request;
  }

  async getSentRequests(userId: string) {
    // Expire old requests first
    await this.expireOldRequests(userId);

    const requests = await this.prisma.matchRequest.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        toUser: {
          select: {
            id: true,
            gender: true,
            campus: true,
            grade: true,
            interests: true,
            declaration: true,
            avatar: true,
          },
        },
      },
    });

    return requests;
  }

  async getReceivedRequests(userId: string) {
    // Expire old requests targeting this user
    await this.prisma.matchRequest.updateMany({
      where: {
        toUserId: userId,
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - EXPIRATION_HOURS * 60 * 60 * 1000),
        },
      },
      data: { status: 'EXPIRED' },
    });

    const requests = await this.prisma.matchRequest.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            gender: true,
            campus: true,
            grade: true,
            interests: true,
            declaration: true,
            avatar: true,
          },
        },
      },
    });

    return requests;
  }

  async listRelationships(userId: string) {
    // 1. 当事人视角：user1 或 user2
    const asClient = await this.prisma.relationship.findMany({
      where: {
        status: { not: 'ENDED' },
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            gender: true,
            campus: true,
            grade: true,
            interests: true,
            declaration: true,
            wechat: true,
            qq: true,
            avatar: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            gender: true,
            campus: true,
            grade: true,
            interests: true,
            declaration: true,
            wechat: true,
            qq: true,
            avatar: true,
          },
        },
        wingmen: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, nickname: true, interests: true } },
          },
        },
      },
    });

    // 2. 军师视角：通过 WingmanAssignment
    const asWingman = await this.prisma.wingmanAssignment.findMany({
      where: { userId, leftAt: null },
      include: {
        relationship: {
          include: {
            user1: {
              select: {
                id: true,
                nickname: true,
                gender: true,
                campus: true,
                grade: true,
                interests: true,
                declaration: true,
                wechat: true,
                qq: true,
                avatar: true,
              },
            },
            user2: {
              select: {
                id: true,
                nickname: true,
                gender: true,
                campus: true,
                grade: true,
                interests: true,
                declaration: true,
                wechat: true,
                qq: true,
                avatar: true,
              },
            },
            wingmen: {
              where: { leftAt: null },
              include: {
                user: { select: { id: true, nickname: true, interests: true } },
              },
            },
          },
        },
      },
    });

    const seenIds = new Set<string>();
    const results: Array<Record<string, unknown>> = [];

    // 当事人关系
    for (const rel of asClient) {
      seenIds.add(rel.id);
      const isUser1 = rel.user1Id === userId;
      const otherUser = isUser1 ? rel.user2 : rel.user1;
      const mySide = isUser1 ? 1 : 2;
      const myWingman = rel.wingmen.find((w) => w.side === mySide);
      const otherWingman = rel.wingmen.find((w) => w.side !== mySide);

      results.push({
        id: rel.id,
        status: rel.status,
        role: 'client' as const,
        createdAt: rel.createdAt,
        otherUser,
        myWingman: myWingman
          ? {
              id: myWingman.user.id,
              nickname: myWingman.user.nickname,
              mode: myWingman.mode,
            }
          : null,
        otherWingman: otherWingman
          ? {
              id: otherWingman.user.id,
              nickname: otherWingman.user.nickname,
              mode: otherWingman.mode,
            }
          : null,
      });
    }

    // 军师关系（排除已作为当事人的）
    for (const wa of asWingman) {
      const rel = wa.relationship;
      if (seenIds.has(rel.id)) continue;
      results.push({
        id: rel.id,
        status: rel.status,
        role: 'wingman' as const,
        createdAt: rel.createdAt,
        wingmanSide: wa.side,
        wingmanMode: wa.mode,
        // 军师能看到双方当事人
        client1: rel.user1,
        client2: rel.user2,
      });
    }

    return results;
  }

  async acceptMatchRequest(requestId: string, userId: string) {
    const request = await this.prisma.matchRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('牵线请求不存在');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('只有目标用户才能响应此请求');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('请求已处理');
    }

    // Check if expired
    if (this.isExpired(request.createdAt)) {
      await this.prisma.matchRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('请求已过期');
    }

    // Create relationship and update request in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.matchRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      const relationship = await tx.relationship.create({
        data: {
          user1Id: request.fromUserId,
          user2Id: request.toUserId,
          status: 'ICEBREAKING',
        },
      });

      return { request: updated, relationship };
    });

    return result;
  }

  async rejectMatchRequest(requestId: string, userId: string) {
    const request = await this.prisma.matchRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('牵线请求不存在');
    }

    if (request.toUserId !== userId) {
      throw new ForbiddenException('只有目标用户才能响应此请求');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('请求已处理');
    }

    return this.prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  private isExpired(createdAt: Date): boolean {
    return createdAt < new Date(Date.now() - EXPIRATION_HOURS * 60 * 60 * 1000);
  }

  private async expireOldRequests(userId: string) {
    await this.prisma.matchRequest.updateMany({
      where: {
        fromUserId: userId,
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - EXPIRATION_HOURS * 60 * 60 * 1000),
        },
      },
      data: { status: 'EXPIRED' },
    });
  }
}
