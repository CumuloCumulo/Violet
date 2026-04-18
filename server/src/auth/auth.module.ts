import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
