import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  providers: [NotificationService, PrismaService, JwtAuthGuard],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
