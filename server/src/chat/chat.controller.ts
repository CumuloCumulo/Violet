import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { PresenceService } from './presence.service.js';
import { RoomService } from './room.service.js';
import { ChatLifecycleService } from './chat-lifecycle.service.js';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly presenceService: PresenceService,
    private readonly roomService: RoomService,
    private readonly lifecycleService: ChatLifecycleService,
  ) {}

  @Get(':relationshipId/messages')
  async getMessages(
    @Param('relationshipId') relationshipId: string,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: any,
  ) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const messages = await this.chatService.getMessages(
      relationshipId,
      userId,
      cursor,
      Math.min(parsedLimit, 100),
    );

    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member) {
      throw new UnauthorizedException('Not a room member');
    }

    const { wingmanMode1, wingmanMode2 } =
      await this.roomService.getWingmanModes(relationshipId);
    const visibleMessages = messages.filter((msg) => {
      const vis = this.chatService.computeVisibility(
        msg,
        userId,
        member.role as any,
        wingmanMode1,
        wingmanMode2,
      );
      return vis.canSee;
    });

    return { messages: visibleMessages };
  }

  @Get(':relationshipId/presence')
  async getPresence(
    @Param('relationshipId') relationshipId: string,
    @Req() req: any,
  ) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      throw new UnauthorizedException('Missing user identity');
    }

    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member) {
      throw new UnauthorizedException('Not a room member');
    }

    const members = await this.roomService.getRoomMembers(relationshipId);
    const onlineUserIds =
      await this.presenceService.getOnlineMembers(relationshipId);

    const presence = members.map((m) => ({
      userId: m.userId,
      role: m.role,
      online: onlineUserIds.includes(m.userId),
    }));

    return { presence };
  }

  @Post(':relationshipId/status')
  async updateStatus(
    @Param('relationshipId') relationshipId: string,
    @Body() body: { status: string },
  ) {
    const validStatuses = ['MATCHING', 'ICEBREAKING', 'FLIRTING', 'ENDED'];
    if (!validStatuses.includes(body.status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const event = await this.lifecycleService.transitionStatus(
      relationshipId,
      body.status as any,
    );

    return {
      success: true,
      event: event ? { type: event.type, message: event.message } : null,
    };
  }
}
