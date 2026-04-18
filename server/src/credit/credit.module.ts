import { Module } from '@nestjs/common';
import { CreditService } from './credit.service.js';
import { CreditController } from './credit.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  providers: [CreditService, PrismaService, JwtAuthGuard],
  controllers: [CreditController],
  exports: [CreditService],
})
export class CreditModule {}
