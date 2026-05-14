import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'violet-dev-secret';
const JWT_EXPIRES_IN = '7d';
const INITIAL_CREDIT = 20;

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.redis = new Redis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    });
  }

  async sendCode(email: string) {
    if (!email.endsWith('@smail.nju.edu.cn')) {
      throw new BadRequestException('仅支持南大 smail 邮箱注册');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.set(`verify:${email}`, code, 'EX', 300);
    await this.mailService.sendVerificationCode(email, code);
    return { message: '验证码已发送' };
  }

  async register(dto: { email: string; nickname: string; password: string; code: string }) {
    const { email, nickname, password, code } = dto;

    // Validate NJU email
    if (!email.endsWith('@smail.nju.edu.cn')) {
      throw new BadRequestException('仅支持南大 smail 邮箱注册');
    }

    // Verify code
    const stored = await this.redis.get(`verify:${email}`);
    if (!stored || stored !== code) {
      throw new BadRequestException('验证码错误或已过期');
    }
    await this.redis.del(`verify:${email}`);

    // Check duplicate
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('该邮箱已注册');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with initial credit
    const user = await this.prisma.user.create({
      data: {
        email,
        nickname,
        password: hashedPassword,
        creditScore: INITIAL_CREDIT,
        roles: ['CLIENT'],
      },
    });

    const token = this.signToken(user.id, user.email);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(dto: { email: string; password: string }) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // Update lastActiveAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = this.signToken(user.id, user.email);
    return { token, user: this.sanitizeUser(user) };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    // Verify code
    const stored = await this.redis.get(`verify:${email}`);
    if (!stored || stored !== code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // Find user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('该邮箱未注册');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new BadRequestException('密码至少 6 位');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.redis.del(`verify:${email}`);
    return { message: '密码重置成功' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  private signToken(userId: string, email: string): string {
    return jwt.sign({ sub: userId, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { password: _, ...result } = user;
    return result;
  }
}
