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
          isActive: true,
        },
        orderBy: { lastActiveAt: 'desc' },
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
        },
      }),
      this.prisma.user.count({
        where: {
          id: { not: userId },
          lastActiveAt: { gte: sevenDaysAgo },
          isActive: true,
        },
      }),
    ]);

    return { users, total, page, pageSize };
  }

  async sendMatchRequest(fromUserId: string, toUserId: string) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('不能向自己发起牵线');
    }

    // Check for duplicate pending request
    const existing = await this.prisma.matchRequest.findFirst({
      where: {
        fromUserId,
        toUserId,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw new ConflictException('已存在待处理的牵线请求');
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
          },
        },
      },
    });

    return requests;
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
