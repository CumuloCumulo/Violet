import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { validateInterests } from './interest-tags.js';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      avatar?: string;
      declaration?: string;
      interests?: string[];
      campus?: string;
      grade?: string;
      major?: string;
    },
  ) {
    if (data.interests) {
      const error = validateInterests(data.interests);
      if (error) throw new BadRequestException(error);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password: _, ...result } = user;
    return result;
  }

  async certifyWingman(
    userId: string,
    data: {
      moralAnswers: number[];
      characteristicAnswers: string[];
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');

    // Check credit score threshold
    if (user.creditScore <= 10) {
      throw new ForbiddenException('信用分需大于 10 才可申请军师认证');
    }

    // Check cooldown
    if (user.wingmanCertCooldown && user.wingmanCertCooldown > new Date()) {
      throw new ForbiddenException('冷却期尚未结束，请稍后再试');
    }

    // Evaluate moral answers (any answer of 0 = fail)
    const moralPassed = data.moralAnswers.every((a) => a > 0);
    if (!moralPassed) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          wingmanCertStatus: 'REJECTED',
          wingmanCertCooldown: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      throw new BadRequestException('道德评判未通过，请 24 小时后重新申请');
    }

    // Passed - approve wingman status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        wingmanCertStatus: 'APPROVED',
        wingmanCertCooldown: null,
        roles: {
          set: user.roles.includes('WINGMAN')
            ? user.roles
            : [...user.roles, 'WINGMAN'],
        },
      },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }

  // Get anonymous profile for discovery (no nickname/avatar)
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatar: true },
    });
    return user;
  }

  async getAnonymousProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return {
      id: user.id,
      gender: user.gender,
      campus: user.campus,
      grade: user.grade,
      interests: user.interests,
      declaration: user.declaration,
      isActive: user.isActive,
      lastActiveAt: user.lastActiveAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('当前密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async changeContactEmail(userId: string, newEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('用户不存在');

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new BadRequestException('邮箱格式不正确');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { contactEmail: newEmail },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }
}
