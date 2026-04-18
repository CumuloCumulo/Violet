import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery.service.js';
import { DiscoveryController } from './discovery.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreditModule } from '../credit/credit.module.js';

@Module({
  imports: [CreditModule],
  providers: [DiscoveryService, PrismaService, JwtAuthGuard],
  controllers: [DiscoveryController],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
