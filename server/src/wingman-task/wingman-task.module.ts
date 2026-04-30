import { Module, forwardRef } from '@nestjs/common';
import { WingmanTaskService } from './wingman-task.service.js';
import { WingmanTaskController } from './wingman-task.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ChatModule } from '../chat/chat.module.js';

@Module({
  imports: [forwardRef(() => ChatModule)],
  providers: [WingmanTaskService, PrismaService, JwtAuthGuard],
  controllers: [WingmanTaskController],
  exports: [WingmanTaskService],
})
export class WingmanTaskModule {}
