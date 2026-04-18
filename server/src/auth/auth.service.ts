import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'violet-dev-secret';
const JWT_EXPIRES_IN = '7d';
const INITIAL_CREDIT = 20;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: { email: string; nickname: string; password: string }) {
    const { email, nickname, password } = dto;

    // Validate NJU email
    if (!email.endsWith('@smail.nju.edu.cn')) {
      throw new BadRequestException('仅支持南大 smail 邮箱注册');
    }

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
