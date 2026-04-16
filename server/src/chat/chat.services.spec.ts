import { ChatService } from './chat.service';
import { RoomService } from './room.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeAll(() => {
    // computeVisibility is a pure function, no need for real PrismaService
    service = new ChatService(null as any);
  });

  describe('computeVisibility', () => {
    it('should allow clients to see MAIN messages', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'user2',
        'client2',
        null,
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should hide MAIN messages from PRIVATE mode wingman', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'wingman1',
        'wingman1',
        'PRIVATE',
        null,
      );
      expect(result.canSee).toBe(false);
    });

    it('should show MAIN messages to SOLO mode wingman', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'wingman1',
        'wingman1',
        'SOLO',
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should show MAIN messages to ASSIST mode wingman', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'wingman1',
        'wingman1',
        'ASSIST',
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should allow sender to see PRIVATE messages', () => {
      const result = service.computeVisibility(
        { type: 'PRIVATE', senderId: 'wingman1', targetUserId: 'client1' },
        'wingman1',
        'wingman1',
        'PRIVATE',
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should allow target to see PRIVATE messages', () => {
      const result = service.computeVisibility(
        { type: 'PRIVATE', senderId: 'wingman1', targetUserId: 'client1' },
        'client1',
        'client1',
        null,
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should hide PRIVATE messages from non-participants', () => {
      const result = service.computeVisibility(
        { type: 'PRIVATE', senderId: 'wingman1', targetUserId: 'client1' },
        'client2',
        'client2',
        null,
        null,
      );
      expect(result.canSee).toBe(false);
    });

    it('should always show SYSTEM messages', () => {
      const result = service.computeVisibility(
        { type: 'SYSTEM', senderId: 'system', targetUserId: null },
        'any_user',
        'client1',
        null,
        null,
      );
      expect(result.canSee).toBe(true);
    });

    it('should show PENDING messages to sender and target only', () => {
      const toSender = service.computeVisibility(
        { type: 'PENDING', senderId: 'wingman1', targetUserId: 'client1' },
        'wingman1',
        'wingman1',
        'ASSIST',
        null,
      );
      expect(toSender.canSee).toBe(true);

      const toTarget = service.computeVisibility(
        { type: 'PENDING', senderId: 'wingman1', targetUserId: 'client1' },
        'client1',
        'client1',
        null,
        null,
      );
      expect(toTarget.canSee).toBe(true);

      const toOther = service.computeVisibility(
        { type: 'PENDING', senderId: 'wingman1', targetUserId: 'client1' },
        'client2',
        'client2',
        null,
        null,
      );
      expect(toOther.canSee).toBe(false);
    });

    it('should hide MAIN messages from PRIVATE mode wingman2 using wingmanMode2', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'wingman2',
        'wingman2',
        null,
        'PRIVATE',
      );
      expect(result.canSee).toBe(false);
    });

    it('should show MAIN messages to SOLO mode wingman2 using wingmanMode2', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'wingman2',
        'wingman2',
        'PRIVATE',
        'SOLO',
      );
      expect(result.canSee).toBe(true);
    });

    it('should return canSee false for unknown message type', () => {
      const result = service.computeVisibility(
        { type: 'UNKNOWN', senderId: 'user1', targetUserId: null },
        'user2',
        'client2',
        null,
        null,
      );
      expect(result.canSee).toBe(false);
    });

    it('should return correct displaySenderId matching message sender', () => {
      const result = service.computeVisibility(
        { type: 'MAIN', senderId: 'user1', targetUserId: null },
        'user2',
        'client2',
        null,
        null,
      );
      expect(result.displaySenderId).toBe('user1');
    });
  });
});

describe('RoomService', () => {
  let service: RoomService;

  beforeAll(() => {
    service = new RoomService(null as any);
  });

  describe('getRoomId', () => {
    it('should return correct room ID format', () => {
      expect(service.getRoomId('rel_123')).toBe('relationship:rel_123');
    });
  });
});
