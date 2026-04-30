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
import * as jwt from 'jsonwebtoken';
import { ChatService } from './chat.service.js';
import { RoomService } from './room.service.js';
import { PresenceService } from './presence.service.js';
import { ChatLifecycleService } from './chat-lifecycle.service.js';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'violet-dev-secret';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    relationshipId?: string;
    role?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
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

  handleConnection(client: AuthenticatedSocket) {
    // Try JWT cookie first, fallback to auth/query for DEV mode
    let userId: string | undefined;

    // 1. Try JWT from cookie
    const cookie = client.handshake.headers?.cookie;
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) {
        try {
          const payload = jwt.verify(match[1], JWT_SECRET) as { sub: string };
          userId = payload.sub;
        } catch {
          // Invalid token, try fallback
        }
      }
    }

    // 2. Fallback: auth/query param (DEV mode)
    if (!userId) {
      userId = client.handshake.auth?.userId ?? client.handshake.query?.userId;
    }

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

    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member) {
      client.emit('error', { code: 'FORBIDDEN', message: 'Not a room member' });
      return;
    }

    const relationship =
      await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) {
      client.emit('error', { code: 'NOT_FOUND', message: 'Relationship not found' });
      return;
    }

    // Allow joining for ICEBREAKING (normal) and FLIRTING (read-only)
    // Reject for other statuses
    if (relationship.status !== 'ICEBREAKING' && relationship.status !== 'FLIRTING') {
      client.emit('error', { code: 'FORBIDDEN', message: 'Room is not accessible' });
      return;
    }

    const isReadOnly = relationship.status === 'FLIRTING';

    const roomId = this.roomService.getRoomId(relationshipId);
    client.join(roomId);
    client.data.relationshipId = relationshipId;
    client.data.role = member.role;

    if (!isReadOnly) {
      await this.presenceService.setOnline(
        userId,
        client.id,
        relationshipId,
        member.role,
      );
    }

    const messages = await this.chatService.getMessages(relationshipId, userId);

    const { wingmanMode1, wingmanMode2, wingmanId1, wingmanId2 } =
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

    client.emit('roomJoined', {
      relationshipId,
      messages: visibleMessages,
      role: member.role,
      client1Id: relationship.user1Id,
      client2Id: relationship.user2Id,
      wingmanMode1,
      wingmanMode2,
      wingmanId1,
      wingmanId2,
      readOnly: isReadOnly,
    });

    client.to(roomId).emit('userJoined', {
      userId,
      role: member.role,
    });

    // Check for pending flirting proposals and push to this user
    const pendingProposals =
      await this.presenceService.getPendingProposals(userId);
    for (const proposal of pendingProposals) {
      // Only push if it's for this room
      if (proposal.relationshipId === relationshipId) {
        client.emit('proposeFlirting', {
          relationshipId: proposal.relationshipId,
          fromUserId: proposal.fromUserId,
        });
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      relationshipId: string;
      content: string;
      type: string;
      targetUserId?: string;
    },
  ) {
    const userId = client.data.userId;
    const { relationshipId, content, type, targetUserId } = data;

    if (!content || content.trim().length === 0 || content.length > 2000) {
      client.emit('error', {
        code: 'VALIDATION',
        message: 'Invalid message content',
      });
      return;
    }

    const canSend = await this.roomService.canSendToRoom(
      relationshipId,
      userId,
      type,
    );
    if (!canSend.allowed) {
      client.emit('error', { code: 'FORBIDDEN', message: canSend.reason });
      return;
    }

    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member) return;

    let effectiveSenderId = userId;
    if (member.role === 'wingman1' || member.role === 'wingman2') {
      const mode = member.wingmanMode;
      if (type === 'MAIN' && mode === 'SOLO') {
        const relationship =
          await this.chatService.findRelationshipById(relationshipId);
        if (relationship) {
          effectiveSenderId =
            member.role === 'wingman1'
              ? relationship.user1Id
              : relationship.user2Id;
        }
      } else if (type === 'MAIN' && mode === 'ASSIST') {
        client.emit('error', {
          code: 'FORBIDDEN',
          message:
            'ASSIST mode wingmen must use draftMessage to send MAIN messages',
        });
        return;
      } else if (type === 'MAIN' && mode === 'PRIVATE') {
        client.emit('error', {
          code: 'FORBIDDEN',
          message: 'Wingman in PRIVATE mode cannot send MAIN messages',
        });
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

    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member) return;

    if (!member.role.startsWith('wingman')) {
      return;
    }
    if (member.wingmanMode !== 'ASSIST') {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Only ASSIST mode wingmen can draft messages',
      });
      return;
    }

    const relationship =
      await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) return;

    const targetClientId =
      member.role === 'wingman1' ? relationship.user1Id : relationship.user2Id;

    const message = await this.chatService.createMessage({
      relationshipId,
      senderId: userId,
      content: content.trim(),
      type: 'PENDING' as any,
      targetUserId: targetClientId,
      requireConfirm: true,
    });

    await this.emitToUsers(
      relationshipId,
      [userId, targetClientId],
      'newMessage',
      message,
    );
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
      client.emit('error', {
        code: 'NOT_FOUND',
        message: 'Message not found or cannot be confirmed',
      });
      return;
    }

    await this.broadcastToVisibleMembers(relationshipId, confirmed);
  }

  @SubscribeMessage('rejectMessage')
  async handleRejectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; relationshipId: string },
  ) {
    const _userId = client.data.userId;
    const { messageId, relationshipId } = data;

    const message = await this.chatService.findMessageById(messageId);

    await this.chatService.rejectMessage(messageId);

    if (message) {
      await this.emitToUsers(
        relationshipId,
        [message.senderId],
        'messageRejected',
        { messageId },
      );
    }

    client.emit('messageRejected', { messageId });
  }

  @SubscribeMessage('forwardMessage')
  async handleForwardMessage(
    @ConnectedSocket() _client: AuthenticatedSocket,
    @MessageBody()
    data: {
      relationshipId: string;
      originalMessageId: string;
      targetUserId: string;
    },
  ) {
    const userId = _client.data.userId;
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

    await this.emitToUsers(
      relationshipId,
      [userId, targetUserId],
      'newMessage',
      forwarded,
    );
  }

  @SubscribeMessage('switchMode')
  async handleSwitchMode(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { relationshipId: string; wingmanId: string; mode: string },
  ) {
    const userId = client.data.userId;
    const { relationshipId, wingmanId, mode } = data;

    const assignment = await this.chatService.findWingmanAssignment(
      relationshipId,
      wingmanId,
    );

    if (!assignment) {
      client.emit('error', {
        code: 'NOT_FOUND',
        message: 'Wingman assignment not found',
      });
      return;
    }

    const relationship =
      await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) return;

    const expectedClientId =
      assignment.side === 1 ? relationship.user1Id : relationship.user2Id;
    if (userId !== expectedClientId) {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Only the owning client can switch mode',
      });
      return;
    }

    if (relationship.status !== 'ICEBREAKING') {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Cannot switch mode outside ICEBREAKING phase',
      });
      return;
    }

    await this.chatService.updateWingmanMode(assignment.id, mode);

    // Send mode switch notification as PRIVATE message to client↔wingman pair
    const targetClientId =
      assignment.side === 1 ? relationship.user1Id : relationship.user2Id;

    const wingman = await this.chatService.findUserById(wingmanId);
    const sysMsg = await this.chatService.createMessage({
      relationshipId,
      senderId: 'system',
      content: `${wingman?.nickname ?? '军师'} 的介入模式已切换为 ${mode}`,
      type: 'PRIVATE' as any,
      targetUserId: wingmanId,
      isSystem: true,
    });

    await this.emitToUsers(
      relationshipId,
      [targetClientId, wingmanId],
      'newMessage',
      sysMsg,
    );

    const roomId = this.roomService.getRoomId(relationshipId);
    this.server.to(roomId).emit('modeSwitched', { wingmanId, mode });
  }

  @SubscribeMessage('proposeFlirting')
  async handleProposeFlirting(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { relationshipId: string },
  ) {
    const { relationshipId } = data;
    const userId = client.data.userId;

    const relationship =
      await this.chatService.findRelationshipById(relationshipId);
    if (!relationship) {
      client.emit('error', {
        code: 'NOT_FOUND',
        message: 'Relationship not found',
      });
      return;
    }

    // Only clients (not wingmen) can propose
    const member = await this.roomService.validateMembership(
      relationshipId,
      userId,
    );
    if (!member || member.role.startsWith('wingman')) {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Only clients can propose flirting',
      });
      return;
    }

    if (relationship.status !== 'ICEBREAKING') {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Can only propose flirting during ICEBREAKING',
      });
      return;
    }

    // Determine the other client
    const otherClientId =
      relationship.user1Id === userId
        ? relationship.user2Id
        : relationship.user1Id;

    const roomId = this.roomService.getRoomId(relationshipId);

    // Try to find the other client's socket in the room
    const sockets = await this.server.in(roomId).fetchSockets();
    const otherSocket = sockets.find(
      (s) => (s as any).data?.userId === otherClientId,
    );

    if (otherSocket) {
      // Other client is online — send directly
      this.server.to(otherSocket.id).emit('proposeFlirting', {
        relationshipId,
        fromUserId: userId,
      });
    } else {
      // Other client is offline — store pending proposal in Redis via presence service
      await this.presenceService.storePendingProposal(
        otherClientId,
        relationshipId,
        userId,
      );
    }

    client.emit('proposeFlirtingSent', { relationshipId });
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

    const _roomId = this.roomService.getRoomId(relationshipId);

    if (event.type === 'roomReadOnly') {
      // Flirting phase: room becomes read-only, don't disconnect
      this.server.to(_roomId).emit('roomReadOnly', {
        relationshipId,
        reason: event.reason,
        message: event.message,
      });
    }

    if (event.type === 'roomClosed') {
      this.server.to(_roomId).emit('roomClosed', {
        relationshipId,
        reason: event.reason,
        message: event.message,
      });
    }

    if (event.type === 'roomEnded') {
      this.server.to(_roomId).emit('roomClosed', {
        relationshipId,
        reason: event.reason,
        message: event.message,
      });

      // Disconnect all sockets in the room
      const sockets = await this.server.in(_roomId).fetchSockets();
      for (const socket of sockets) {
        socket.disconnect(true);
      }
    }
  }

  private async broadcastToVisibleMembers(
    relationshipId: string,
    message: any,
  ) {
    const members = await this.roomService.getRoomMembers(relationshipId);
    const { wingmanMode1, wingmanMode2 } =
      await this.roomService.getWingmanModes(relationshipId);

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

  private async emitToUsers(
    relationshipId: string,
    userIds: string[],
    event: string,
    data: any,
  ) {
    const roomId = this.roomService.getRoomId(relationshipId);
    const sockets = await this.server.in(roomId).fetchSockets();
    for (const sock of sockets) {
      const sockData = (sock as any).data;
      if (sockData?.userId && userIds.includes(sockData.userId)) {
        this.server.to(sock.id).emit(event, data);
      }
    }
  }

  /**
   * Notify client that a wingman has been assigned to their relationship.
   * Called by WingmanTaskController after approval.
   */
  async emitWingmanAssigned(
    relationshipId: string,
    clientId: string,
    wingmanId: string,
    side: number,
    mode: string,
  ) {
    // Find client's socket and push event
    const sockets = await this.server.fetchSockets();
    for (const sock of sockets) {
      const sockData = (sock as any).data;
      if (sockData?.userId === clientId) {
        this.server.to(sock.id).emit('wingmanAssigned', {
          relationshipId,
          wingmanId,
          side,
          mode,
        });
      }
    }
  }

  /**
   * Notify wingman that their application was approved.
   */
  async emitWingmanApproved(
    relationshipId: string,
    wingmanId: string,
    side: number,
    mode: string,
  ) {
    const sockets = await this.server.fetchSockets();
    for (const sock of sockets) {
      const sockData = (sock as any).data;
      if (sockData?.userId === wingmanId) {
        this.server.to(sock.id).emit('wingmanApproved', {
          relationshipId,
          side,
          mode,
        });
      }
    }
  }
}
