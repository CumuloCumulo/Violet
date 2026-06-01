import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    service = new NotificationService(mockPrisma, mockEventEmitter);
  });

  describe('createNotification', () => {
    it('should create notification and emit event', async () => {
      const notification = {
        id: 'notif1',
        userId: 'user1',
        type: 'TEST',
        title: 'Test title',
        content: null,
        data: null,
        read: false,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(notification);

      const result = await service.createNotification({
        userId: 'user1',
        type: 'TEST',
        title: 'Test title',
      });

      expect(result.id).toBe('notif1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'notification.created',
        notification,
      );
    });

    it('should create notification with content and data', async () => {
      const notification = {
        id: 'notif2',
        userId: 'user1',
        type: 'MATCH_REQUEST',
        title: 'New match',
        content: 'Check it out',
        data: { requestId: 'req1' },
        read: false,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(notification);

      const _result = await service.createNotification({
        userId: 'user1',
        type: 'MATCH_REQUEST',
        title: 'New match',
        content: 'Check it out',
        data: { requestId: 'req1' },
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: { requestId: 'req1' },
          }),
        }),
      );
    });
  });

  describe('getNotifications', () => {
    it('should return notifications without cursor', async () => {
      const notifications = [
        { id: 'n1', createdAt: new Date() },
        { id: 'n2', createdAt: new Date() },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.getNotifications('user1');

      expect(result.notifications).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination with hasMore', async () => {
      const notifications = Array(21).fill({ id: 'n', createdAt: new Date() });
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.getNotifications('user1', undefined, 20);

      expect(result.hasMore).toBe(true);
      expect(result.notifications).toHaveLength(20);
    });

    it('should use cursor for pagination', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        createdAt: new Date('2026-01-01'),
      });
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await service.getNotifications('user1', 'cursor123');

      expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'cursor123' },
        select: { createdAt: true },
      });
    });

    it('should still work if cursor not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getNotifications('user1', 'bad-cursor');

      expect(result.notifications).toHaveLength(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user1');

      expect(result.count).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user1', read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should return null for non-existent notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      const result = await service.markAsRead('nonexistent', 'user1');
      expect(result).toBeNull();
    });

    it('should return null if notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif1',
        userId: 'user2',
      });

      const result = await service.markAsRead('notif1', 'user1');
      expect(result).toBeNull();
    });

    it('should mark notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
      });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif1',
        read: true,
      });

      const result = await service.markAsRead('notif1', 'user1');

      expect(result.read).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: { read: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user1');

      expect(result.updated).toBe(3);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', read: false },
        data: { read: true },
      });
    });
  });
});
