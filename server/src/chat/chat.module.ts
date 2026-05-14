import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { RoomService } from './room.service.js';
import { PresenceService } from './presence.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChatController } from './chat.controller.js';
import { ChatLifecycleService } from './chat-lifecycle.service.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [NotificationModule],
  providers: [
    ChatGateway,
    ChatService,
    RoomService,
    PresenceService,
    PrismaService,
    ChatLifecycleService,
  ],
  controllers: [ChatController],
  exports: [ChatService, RoomService, PresenceService, ChatLifecycleService, ChatGateway],
})
export class ChatModule {}
