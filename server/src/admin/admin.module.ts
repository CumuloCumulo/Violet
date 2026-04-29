import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminGuard } from './admin.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [AdminService, PrismaService, AdminGuard],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
