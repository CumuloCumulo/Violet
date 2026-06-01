import { ChatLifecycleService } from './chat-lifecycle.service';

describe('ChatLifecycleService', () => {
  let service: ChatLifecycleService;
  let mockPrisma: any;
  let mockChatService: any;
  let mockRoomService: any;
  let mockPresenceService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockPrisma = {
      relationship: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
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

    mockNotificationService = {
      createNotification: vi.fn(),
    };

    service = new ChatLifecycleService(
      mockPrisma,
      mockChatService,
      mockRoomService,
      mockPresenceService,
      mockNotificationService,
    );
  });

  describe('transitionStatus', () => {
    const relationshipId = 'rel_123';

    it('should return roomOpened when MATCHING → ICEBREAKING', async () => {
      const relationship = {
        id: relationshipId,
        status: 'MATCHING',
        user1Id: 'user1',
        user2Id: 'user2',
        user1: { nickname: 'Alice' },
        user2: { nickname: 'Bob' },
      };
      mockPrisma.relationship.findUnique
        .mockResolvedValueOnce({ id: relationshipId, status: 'MATCHING', user1Id: 'user1', user2Id: 'user2' })
        .mockResolvedValueOnce(relationship);
      mockPrisma.relationship.update.mockResolvedValue({
        id: relationshipId,
        status: 'ICEBREAKING',
      });
      mockChatService.createSystemMessage.mockResolvedValue({});
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.transitionStatus(
        relationshipId,
        'ICEBREAKING',
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe('roomOpened');
      expect(result!.relationshipId).toBe(relationshipId);
      expect(mockChatService.createSystemMessage).toHaveBeenCalledWith(
        relationshipId,
        expect.stringContaining('破冰'),
      );
    });

    it('should return roomClosed when ICEBREAKING → FLIRTING', async () => {
      mockPrisma.relationship.findUnique
        .mockResolvedValueOnce({ id: relationshipId, status: 'ICEBREAKING', user1Id: 'user1', user2Id: 'user2' })
        .mockResolvedValueOnce({ user1Id: 'user1', user2Id: 'user2' });
      mockPrisma.relationship.update.mockResolvedValue({
        id: relationshipId,
        status: 'FLIRTING',
      });
      mockPrisma.wingmanAssignment.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user1', nickname: 'Alice', wechat: 'alice_wx', qq: null })
        .mockResolvedValueOnce({ id: 'user2', nickname: 'Bob', wechat: null, qq: 'bob_qq' });
      mockChatService.createSystemMessage.mockResolvedValue({});
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.transitionStatus(relationshipId, 'FLIRTING');

      expect(result).not.toBeNull();
      expect(result!.type).toBe('roomReadOnly');
      expect(result!.reason).toBe('FLIRTING');
      expect(result!.contactExchange).toBeDefined();
      expect(result!.contactExchange!.user1Wechat).toBe('alice_wx');
      expect(result!.contactExchange!.user2Qq).toBe('bob_qq');
      expect(mockPrisma.wingmanAssignment.updateMany).toHaveBeenCalledWith({
        where: { relationshipId, leftAt: null },
        data: { leftAt: expect.any(Date) },
      });
    });

    it('should return roomEnded when → ENDED', async () => {
      mockPrisma.relationship.findUnique
        .mockResolvedValueOnce({ id: relationshipId, status: 'ICEBREAKING', user1Id: 'user1', user2Id: 'user2' })
        .mockResolvedValueOnce({ user1Id: 'user1', user2Id: 'user2' });
      mockPrisma.relationship.update.mockResolvedValue({
        id: relationshipId,
        status: 'ENDED',
      });
      mockChatService.createSystemMessage.mockResolvedValue({});
      mockNotificationService.createNotification.mockResolvedValue({});
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

      const result = await service.transitionStatus(
        relationshipId,
        'ICEBREAKING',
      );

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
