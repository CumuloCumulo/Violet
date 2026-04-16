import { io, Socket } from 'socket.io-client';

export class TestClient {
  socket: Socket;
  userId: string;
  private events: Map<string, any[]> = new Map();

  constructor(url: string, userId: string) {
    this.userId = userId;
    this.socket = io(url, {
      auth: { userId },
      transports: ['websocket'],
      forceNew: true,
    });

    this.socket.onAny((event, ...args) => {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event)!.push(args.length === 1 ? args[0] : args);
    });
  }

  async connect(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection timeout for user ${this.userId}`));
      }, timeout);

      this.socket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async joinRoom(relationshipId: string): Promise<any> {
    this.socket.emit('joinRoom', { relationshipId, userId: this.userId });
    return this.waitForEvent('roomJoined', 5000);
  }

  sendMessage(
    relationshipId: string,
    content: string,
    type: string = 'MAIN',
    targetUserId?: string,
  ) {
    this.socket.emit('sendMessage', {
      relationshipId,
      content,
      type,
      targetUserId,
    });
  }

  draftMessage(relationshipId: string, content: string) {
    this.socket.emit('draftMessage', { relationshipId, content });
  }

  confirmMessage(messageId: string, relationshipId: string) {
    this.socket.emit('confirmMessage', { messageId, relationshipId });
  }

  rejectMessage(messageId: string, relationshipId: string) {
    this.socket.emit('rejectMessage', { messageId, relationshipId });
  }

  forwardMessage(
    relationshipId: string,
    originalMessageId: string,
    targetUserId: string,
  ) {
    this.socket.emit('forwardMessage', {
      relationshipId,
      originalMessageId,
      targetUserId,
    });
  }

  switchMode(relationshipId: string, wingmanId: string, mode: string) {
    this.socket.emit('switchMode', { relationshipId, wingmanId, mode });
  }

  transitionStatus(relationshipId: string, newStatus: string) {
    this.socket.emit('transitionStatus', { relationshipId, newStatus });
  }

  waitForEvent(event: string, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if we already received this event
      const existing = this.events.get(event);
      if (existing && existing.length > 0) {
        resolve(existing.shift());
        return;
      }

      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timeout waiting for event "${event}" (user: ${this.userId})`,
          ),
        );
      }, timeout);

      const handler = (...args: any[]) => {
        clearTimeout(timer);
        resolve(args.length === 1 ? args[0] : args);
      };

      this.socket.once(event, handler);
    });
  }

  getEvents(event: string): any[] {
    return this.events.get(event) ?? [];
  }

  clearEvents() {
    this.events.clear();
  }

  disconnect() {
    this.socket.disconnect();
  }
}
