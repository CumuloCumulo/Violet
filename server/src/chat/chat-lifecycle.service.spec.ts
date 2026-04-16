import { ChatLifecycleService } from './chat-lifecycle.service';
import type { LifecycleEvent } from './chat-lifecycle.service';

describe('ChatLifecycleService', () => {
  let service: ChatLifecycleService;
  let mockPrisma: any;
  let mockChatService: any;
  let mockRoomService: any;
  let mockPresenceService: any;

  beforeEach(() => {
    mockPrisma = {
      relationship: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      wingmanAssignment: {
        updateMany: vi.fn(),
      },
    };

    mockChatService = {
      createSystemMessage: vi.fn(),
    };

    mockRoomService = {
      getRoomMembers: vi.fn(),
    };

    mockPresenceService = {
      setOffline: vi.fn(),
    };

    service = new ChatLifecycleService(
      mockPrisma,
      mockChatService,
      mockRoomService,
      mockPresenceService,
    );
  });

  describe('transitionStatus', () => {
    const relationshipId = 'rel_123';

    it('should return roomOpened when MATCHING → ICEBREAKING', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: relationshipId,
        status: 'MATCHING',
      });
      mockPrisma.relationship.update.mockResolvedValue({ id: relationshipId, status: 'ICEBREAKING' });
      mockChatService.createSystemMessage.mockResolvedValue({});

      const result = await service.transitionStatus(relationshipId, 'ICEBREAKING');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('roomOpened');
      expect(result!.relationshipId).toBe(relationshipId);
      expect(mockChatService.createSystemMessage).toHaveBeenCalledWith(
        relationshipId,
        expect.stringContaining('破冰'),
      );
    });

    it('should return roomClosed when ICEBREAKING → FLIRTING', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: relationshipId,
        status: 'ICEBREAKING',
      });
      mockPrisma.relationship.update.mockResolvedValue({ id: relationshipId, status: 'FLIRTING' });
      mockPrisma.wingmanAssignment.updateMany.mockResolvedValue({ count: 2 });
      mockChatService.createSystemMessage.mockResolvedValue({});

      const result = await service.transitionStatus(relationshipId, 'FLIRTING');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('roomClosed');
      expect(result!.reason).toBe('FLIRTING');
      expect(mockPrisma.wingmanAssignment.updateMany).toHaveBeenCalledWith({
        where: { relationshipId, leftAt: null },
        data: { leftAt: expect.any(Date) },
      });
    });

    it('should return roomEnded when → ENDED', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: relationshipId,
        status: 'ICEBREAKING',
      });
      mockPrisma.relationship.update.mockResolvedValue({ id: relationshipId, status: 'ENDED' });
      mockChatService.createSystemMessage.mockResolvedValue({});
      mockPrisma.wingmanAssignment.updateMany.mockResolvedValue({ count: 2 });
      mockRoomService.getRoomMembers.mockResolvedValue([
        { userId: 'user1', role: 'client1' },
        { userId: 'user2', role: 'client2' },
      ]);
      mockPresenceService.setOffline.mockResolvedValue(undefined);

      const result = await service.transitionStatus(relationshipId, 'ENDED');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('roomEnded');
      expect(result!.reason).toBe('ENDED');
      expect(result!.disconnectedUserIds).toEqual(['user1', 'user2']);
    });

    it('should return null when transitioning to the same status', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: relationshipId,
        status: 'ICEBREAKING',
      });

      const result = await service.transitionStatus(relationshipId, 'ICEBREAKING');

      expect(result).toBeNull();
    });

    it('should throw when relationship not found', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionStatus('nonexistent', 'ICEBREAKING'),
      ).rejects.toThrow('Relationship not found');
    });
  });
});
