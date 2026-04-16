import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { RoomService } from './room.service.js';
import { PresenceService } from './presence.service.js';
import { ChatLifecycleService } from './chat-lifecycle.service.js';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    relationshipId?: string;
    role?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly roomService: RoomService,
    private readonly presenceService: PresenceService,
    private readonly lifecycleService: ChatLifecycleService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.handshake.auth?.userId ?? client.handshake.query?.userId;
    if (!userId || typeof userId !== 'string') {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const { userId, relationshipId } = client.data;
    if (userId) {
      try {
        await this.presenceService.setOffline(userId, relationshipId);
      } catch {
        // Redis may be disconnected during shutdown
      }

      if (relationshipId) {
        const roomId = this.roomService.getRoomId(relationshipId);
        this.server.to(roomId).emit('userOffline', { userId });
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string },
  ) {
    const { relationshipId } = data;
    const userId = client.data.userId;

    const member = await this.roomService.validateMembership(relationshipId, userId);
    if (!member) {
      client.emit('error', { code: 'FORBIDDEN', message: 'Not a room member' });
      return;
    }

    const canSend = await this.roomService.canSendToRoom(relationshipId, userId, 'MAIN');
    if (!canSend.allowed) {
      client.emit('error', { code: 'FORBIDDEN', message: canSend.reason });
      return;
    }

    const roomId = this.roomService.getRoomId(relationshipId);
    client.join(roomId);
    client.data.relationshipId = relationshipId;
    client.data.role = member.role;

    await this.presenceService.setOnline(userId, client.id, relationshipId, member.role);

    const messages = await this.chatService.getMessages(relationshipId, userId);

    const { wingmanMode1, wingmanMode2 } = await this.roomService.getWingmanModes(relationshipId);
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

    client.emit('roomJoined', {
      relationshipId,
      messages: visibleMessages,
      role: member.role,
    });

    client.to(roomId).emit('userJoined', {
      userId,
      role: member.role,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string; content: string; type: string; targetUserId?: string },
  ) {
    const userId = client.data.userId;
    const { relationshipId, content, type, targetUserId } = data;

    if (!content || content.trim().length === 0 || content.length > 2000) {
      client.emit('error', { code: 'VALIDATION', message: 'Invalid message content' });
      return;
    }

    const canSend = await this.roomService.canSendToRoom(relationshipId, userId, type);
    if (!canSend.allowed) {
      client.emit('error', { code: 'FORBIDDEN', message: canSend.reason });
      return;
    }

    const member = await this.roomService.validateMembership(relationshipId, userId);
    if (!member) return;

    let effectiveSenderId = userId;
    if (member.role === 'wingman1' || member.role === 'wingman2') {
      const mode = member.wingmanMode;
      if (type === 'MAIN' && mode === 'SOLO') {
        const relationship = await this.chatService.findRelationshipById(relationshipId);
        if (relationship) {
          effectiveSenderId = member.role === 'wingman1' ? relationship.user1Id : relationship.user2Id;
        }
      } else if (type === 'MAIN' && mode === 'PRIVATE') {
        client.emit('error', { code: 'FORBIDDEN', message: 'Wingman in PRIVATE mode cannot send MAIN messages' });
        return;
      }
    }

    const message = await this.chatService.createMessage({
      relationshipId,
      senderId: effectiveSenderId,
      content: content.trim(),
      type: type as any,
      targetUserId,
    });

    await this.broadcastToVisibleMembers(relationshipId, message);
  }

  @SubscribeMessage('draftMessage')
  async handleDraftMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string; content: string },
  ) {
    const userId = client.data.userId;
    const { relationshipId, content } = data;

    if (!content || content.trim().length === 0) {
      return;
    }

    const member = await this.roomService.validateMembership(relationshipId, userId);
    if (!member) return;

    if (!member.role.startsWith('wingman')) {
      return;
    }
    if (member.wingmanMode !== 'ASSIST') {
      client.emit('error', { code: 'FORBIDDEN', message: 'Only ASSIST mode wingmen can draft messages' });
      return;
    }

    const relationship = await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) return;

    const targetClientId = member.role === 'wingman1' ? relationship.user1Id : relationship.user2Id;

    const message = await this.chatService.createMessage({
      relationshipId,
      senderId: userId,
      content: content.trim(),
      type: 'PENDING' as any,
      targetUserId: targetClientId,
      requireConfirm: true,
    });

    await this.emitToUsers(relationshipId, [userId, targetClientId], 'newMessage', message);
  }

  @SubscribeMessage('confirmMessage')
  async handleConfirmMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; relationshipId: string },
  ) {
    const userId = client.data.userId;
    const { messageId, relationshipId } = data;

    const confirmed = await this.chatService.confirmMessage(messageId, userId);
    if (!confirmed) {
      client.emit('error', { code: 'NOT_FOUND', message: 'Message not found or cannot be confirmed' });
      return;
    }

    await this.broadcastToVisibleMembers(relationshipId, confirmed);
  }

  @SubscribeMessage('rejectMessage')
  async handleRejectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; relationshipId: string },
  ) {
    const userId = client.data.userId;
    const { messageId, relationshipId } = data;

    const message = await this.chatService.findMessageById(messageId);

    await this.chatService.rejectMessage(messageId);

    if (message) {
      await this.emitToUsers(relationshipId, [message.senderId], 'messageRejected', { messageId });
    }

    client.emit('messageRejected', { messageId });
  }

  @SubscribeMessage('forwardMessage')
  async handleForwardMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string; originalMessageId: string; targetUserId: string },
  ) {
    const userId = client.data.userId;
    const { relationshipId, originalMessageId, targetUserId } = data;

    const original = await this.chatService.findMessageById(originalMessageId);

    if (!original || original.relationshipId !== relationshipId) {
      return;
    }

    const forwarded = await this.chatService.createMessage({
      relationshipId,
      senderId: userId,
      content: `[转发] ${original.content}`,
      type: 'PRIVATE' as any,
      targetUserId,
    });

    await this.emitToUsers(relationshipId, [userId, targetUserId], 'newMessage', forwarded);
  }

  @SubscribeMessage('switchMode')
  async handleSwitchMode(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string; wingmanId: string; mode: string },
  ) {
    const userId = client.data.userId;
    const { relationshipId, wingmanId, mode } = data;

    const assignment = await this.chatService.findWingmanAssignment(relationshipId, wingmanId);

    if (!assignment) {
      client.emit('error', { code: 'NOT_FOUND', message: 'Wingman assignment not found' });
      return;
    }

    const relationship = await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) return;

    const expectedClientId = assignment.side === 1 ? relationship.user1Id : relationship.user2Id;
    if (userId !== expectedClientId) {
      client.emit('error', { code: 'FORBIDDEN', message: 'Only the owning client can switch mode' });
      return;
    }

    if (relationship.status !== 'ICEBREAKING') {
      client.emit('error', { code: 'FORBIDDEN', message: 'Cannot switch mode outside ICEBREAKING phase' });
      return;
    }

    await this.chatService.updateWingmanMode(assignment.id, mode);

    const wingman = await this.chatService.findUserById(wingmanId);
    const sysMsg = await this.chatService.createSystemMessage(
      relationshipId,
      `${wingman?.nickname ?? '军师'} 的介入模式已切换为 ${mode}`,
    );

    const roomId = this.roomService.getRoomId(relationshipId);
    this.server.to(roomId).emit('newMessage', sysMsg);
    this.server.to(roomId).emit('modeSwitched', { wingmanId, mode });
  }

  @SubscribeMessage('transitionStatus')
  async handleTransitionStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string; newStatus: string },
  ) {
    const { relationshipId, newStatus } = data;

    const event = await this.lifecycleService.transitionStatus(
      relationshipId,
      newStatus as any,
    );

    if (!event) return;

    const roomId = this.roomService.getRoomId(relationshipId);

    if (event.type === 'roomClosed') {
      this.server.to(roomId).emit('roomClosed', {
        relationshipId,
        reason: event.reason,
        message: event.message,
      });
    }

    if (event.type === 'roomEnded') {
      this.server.to(roomId).emit('roomClosed', {
        relationshipId,
        reason: event.reason,
        message: event.message,
      });

      // Disconnect all sockets in the room
      const sockets = await this.server.in(roomId).fetchSockets();
      for (const socket of sockets) {
        socket.disconnect(true);
      }
    }
  }

  private async broadcastToVisibleMembers(relationshipId: string, message: any) {
    const roomId = this.roomService.getRoomId(relationshipId);
    const members = await this.roomService.getRoomMembers(relationshipId);
    const { wingmanMode1, wingmanMode2 } = await this.roomService.getWingmanModes(relationshipId);

    for (const m of members) {
      const vis = this.chatService.computeVisibility(
        message,
        m.userId,
        m.role as any,
        wingmanMode1,
        wingmanMode2,
      );
      if (vis.canSee) {
        await this.emitToUsers(relationshipId, [m.userId], 'newMessage', {
          ...message,
          displaySenderId: vis.displaySenderId,
        });
      }
    }
  }

  private async emitToUsers(relationshipId: string, userIds: string[], event: string, data: any) {
    const roomId = this.roomService.getRoomId(relationshipId);
    const sockets = await this.server.in(roomId).fetchSockets();
    for (const sock of sockets) {
      const sockData = (sock as any).data;
      if (sockData?.userId && userIds.includes(sockData.userId)) {
        this.server.to(sock.id).emit(event, data);
      }
    }
  }
}
