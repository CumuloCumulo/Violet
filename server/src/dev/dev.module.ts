import { Module } from '@nestjs/common';
import { DevController } from './dev.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [DevController],
  providers: [PrismaService],
})
export class DevModule {}
