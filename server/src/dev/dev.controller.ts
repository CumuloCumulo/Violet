import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('dev')
export class DevController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        gender: true,
        campus: true,
        roles: true,
      },
    });
    return users;
  }

  @Get('relationships')
  async getRelationships() {
    const relationships = await this.prisma.relationship.findMany({
      where: { status: 'ICEBREAKING' },
      select: {
        id: true,
        status: true,
        user1: { select: { id: true, nickname: true } },
        user2: { select: { id: true, nickname: true } },
        wingmen: {
          where: { leftAt: null },
          select: {
            userId: true,
            side: true,
            mode: true,
            user: { select: { nickname: true } },
          },
        },
      },
    });
    return relationships.map(({ wingmen, ...r }) => ({
      ...r,
      assignments: wingmen.map((a) => ({
        userId: a.userId,
        nickname: a.user.nickname,
        side: a.side,
        mode: a.mode,
      })),
    }));
  }
}
