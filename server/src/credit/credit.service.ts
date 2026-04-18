import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const CHECKIN_REWARD = 3;
const MATCH_REQUEST_COST = 5;

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true },
    });
    return user?.creditScore ?? 0;
  }

  async checkin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ConflictException('用户不存在');

    // Check if already checked in today (server timezone)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existingCheckin = await this.prisma.checkinRecord.findFirst({
      where: {
        userId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    });

    if (existingCheckin) {
      throw new ConflictException('今日已签到');
    }

    // Atomic increment + create record
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { creditScore: { increment: CHECKIN_REWARD } },
        select: { creditScore: true },
      }),
      this.prisma.checkinRecord.create({
        data: { userId },
      }),
    ]);

    return { balance: updated.creditScore, reward: CHECKIN_REWARD };
  }

  async deductCredit(userId: string, amount: number): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditScore: true },
    });

    if (!user || user.creditScore < amount) {
      throw new ForbiddenException('信用分不足');
    }

    // Atomic decrement with check
    const updated = await this.prisma.user.updateMany({
      where: { id: userId, creditScore: { gte: amount } },
      data: { creditScore: { decrement: amount } },
    });

    if (updated.count === 0) {
      throw new ForbiddenException('信用分不足');
    }

    return (user.creditScore - amount);
  }
}
