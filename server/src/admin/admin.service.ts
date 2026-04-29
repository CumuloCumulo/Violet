import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalUsers, activeUsers, totalCredit, totalRelationships, pendingMatchRequests] =
      await Promise.all([
        this.prisma.user.count({ where: { id: { not: 'system' } } }),
        this.prisma.user.count({
          where: { isActive: true, id: { not: 'system' } },
        }),
        this.prisma.user.aggregate({
          _sum: { creditScore: true },
          where: { id: { not: 'system' } },
        }),
        this.prisma.relationship.count(),
        this.prisma.matchRequest.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalCredit: totalCredit._sum.creditScore ?? 0,
      totalRelationships,
      pendingMatchRequests,
    };
  }

  async listUsers(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    active?: string,
  ) {
    const where: Record<string, unknown> = { id: { not: 'system' } };

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          gender: true,
          campus: true,
          grade: true,
          roles: true,
          creditScore: true,
          isActive: true,
          lastActiveAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar: true,
        gender: true,
        campus: true,
        grade: true,
        major: true,
        interests: true,
        declaration: true,
        creditScore: true,
        isActive: true,
        lastActiveAt: true,
        roles: true,
        wingmanCertStatus: true,
        wechat: true,
        qq: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            checkinRecords: true,
            relationshipsAsUser1: true,
            relationshipsAsUser2: true,
            sentMatchRequests: true,
            receivedMatchRequests: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Get recent credit logs
    const creditLogs = await this.prisma.creditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
        admin: { select: { nickname: true } },
      },
    });

    return { ...user, creditLogs };
  }

  async adjustCredit(adminId: string, userId: string, amount: number, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('必须填写调整原因');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditScore: { increment: amount } },
        select: { id: true, creditScore: true },
      }),
      this.prisma.creditLog.create({
        data: { userId, adminId, amount, reason: reason.trim() },
      }),
    ]);

    return updated;
  }

  async toggleActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    return updated;
  }
}
