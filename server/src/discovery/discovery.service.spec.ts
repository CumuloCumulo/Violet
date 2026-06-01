import { DiscoveryService } from './discovery.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let mockPrisma: any;
  let mockCreditService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
      },
      matchRequest: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      relationship: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      wingmanAssignment: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      $transaction: vi.fn((fn) => fn(mockPrisma)),
    };

    mockCreditService = {
      deductCredit: vi.fn(),
    };

    mockNotificationService = {
      createNotification: vi.fn(),
    };

    service = new DiscoveryService(
      mockPrisma,
      mockCreditService,
      mockNotificationService,
    );
  });

  describe('listUsers', () => {
    it('should return paginated users with default card images', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user2', gender: 'MALE', cardImage: null },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers('user1', 1, 20);

      expect(result.total).toBe(1);
      expect(result.users[0].cardImage).toContain('/uploads/cards/');
    });

    it('should use user-provided card image when available', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user2', cardImage: '/uploads/custom.png' },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers('user1');

      expect(result.users[0].cardImage).toBe('/uploads/custom.png');
    });

    it('should exclude the requesting user', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.listUsers('user1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'user1' } }),
        }),
      );
    });
  });

  describe('sendMatchRequest', () => {
    it('should reject sending to self', async () => {
      await expect(service.sendMatchRequest('user1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject duplicate pending request', async () => {
      mockPrisma.matchRequest.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.sendMatchRequest('user1', 'user2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject when active relationship exists', async () => {
      mockPrisma.matchRequest.findFirst.mockResolvedValue(null);
      mockPrisma.relationship.findFirst.mockResolvedValue({ id: 'rel1' });

      await expect(service.sendMatchRequest('user1', 'user2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create match request successfully', async () => {
      mockPrisma.matchRequest.findFirst.mockResolvedValue(null);
      mockPrisma.relationship.findFirst.mockResolvedValue(null);
      mockCreditService.deductCredit.mockResolvedValue(15);
      mockPrisma.matchRequest.create.mockResolvedValue({
        id: 'req1',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'PENDING',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ nickname: 'Alice' });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.sendMatchRequest('user1', 'user2');

      expect(result.status).toBe('PENDING');
      expect(mockCreditService.deductCredit).toHaveBeenCalledWith('user1', 5);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user2',
          type: 'MATCH_REQUEST_RECEIVED',
        }),
      );
    });
  });

  describe('acceptMatchRequest', () => {
    it('should reject non-existent request', async () => {
      mockPrisma.matchRequest.findUnique.mockResolvedValue(null);

      await expect(service.acceptMatchRequest('req1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject if user is not the target', async () => {
      mockPrisma.matchRequest.findUnique.mockResolvedValue({
        id: 'req1',
        toUserId: 'user3',
        status: 'PENDING',
        createdAt: new Date(),
      });

      await expect(service.acceptMatchRequest('req1', 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject already processed request', async () => {
      mockPrisma.matchRequest.findUnique.mockResolvedValue({
        id: 'req1',
        toUserId: 'user2',
        status: 'ACCEPTED',
        createdAt: new Date(),
      });

      await expect(service.acceptMatchRequest('req1', 'user2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept and create relationship', async () => {
      const request = {
        id: 'req1',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'PENDING',
        createdAt: new Date(),
      };
      mockPrisma.matchRequest.findUnique.mockResolvedValue(request);
      mockPrisma.matchRequest.update.mockResolvedValue({
        ...request,
        status: 'ACCEPTED',
      });
      mockPrisma.relationship.create.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'ICEBREAKING',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ nickname: 'Bob' });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.acceptMatchRequest('req1', 'user2');

      expect(result.relationship.status).toBe('ICEBREAKING');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: 'MATCH_REQUEST_ACCEPTED',
        }),
      );
    });
  });

  describe('rejectMatchRequest', () => {
    it('should reject and notify sender', async () => {
      mockPrisma.matchRequest.findUnique.mockResolvedValue({
        id: 'req1',
        fromUserId: 'user1',
        toUserId: 'user2',
        status: 'PENDING',
      });
      mockPrisma.matchRequest.update.mockResolvedValue({
        id: 'req1',
        status: 'REJECTED',
      });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.rejectMatchRequest('req1', 'user2');

      expect(result.status).toBe('REJECTED');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          type: 'MATCH_REQUEST_REJECTED',
        }),
      );
    });
  });

  describe('getSentRequests', () => {
    it('should return sent requests', async () => {
      mockPrisma.matchRequest.findMany.mockResolvedValue([
        { id: 'req1', toUser: { id: 'user2' } },
      ]);

      const result = await service.getSentRequests('user1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getReceivedRequests', () => {
    it('should return only pending received requests', async () => {
      mockPrisma.matchRequest.findMany.mockResolvedValue([
        { id: 'req1', fromUser: { id: 'user1' } },
      ]);

      const result = await service.getReceivedRequests('user2');
      expect(result).toHaveLength(1);
    });
  });
});
