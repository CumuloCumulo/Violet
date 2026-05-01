import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  imports: [
    MulterModule.register({
      dest: path.join(process.cwd(), '..', 'uploads', 'avatars'),
    }),
  ],
  providers: [UserService, PrismaService, JwtAuthGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
