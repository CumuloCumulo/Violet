import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest<{ user: { userId: string } }>();
    const userId = request.user?.userId;
    if (!userId) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user?.roles.includes('ADMIN')) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
