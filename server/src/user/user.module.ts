import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  providers: [UserService, PrismaService, JwtAuthGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
