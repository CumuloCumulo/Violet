/* eslint-disable @typescript-eslint/no-unsafe-return */
import { WingmanTaskService } from './wingman-task.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('WingmanTaskService', () => {
  let service: WingmanTaskService;
  let mockPrisma: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockPrisma = {
      relationship: {
        findUnique: vi.fn(),
      },
      wingmanTask: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
      },
      wingmanAssignment: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      wingmanApplication: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((fn) => fn(mockPrisma)),
    };

    mockNotificationService = {
      createNotification: vi.fn(),
    };

    service = new WingmanTaskService(mockPrisma, mockNotificationService);
  });

  describe('createTask', () => {
    it('should reject non-existent relationship', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue(null);

      await expect(
        service.createTask('user1', 'rel1', 'title', 'desc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject non-participant', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'userA',
        user2Id: 'userB',
        status: 'ICEBREAKING',
      });

      await expect(
        service.createTask('user1', 'rel1', 'title', 'desc'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-ICEBREAKING status', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'FLIRTING',
      });

      await expect(
        service.createTask('user1', 'rel1', 'title', 'desc'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate active task', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'ICEBREAKING',
      });
      mockPrisma.wingmanTask.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createTask('user1', 'rel1', 'title', 'desc'),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if side already has wingman', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'ICEBREAKING',
      });
      mockPrisma.wingmanTask.findFirst.mockResolvedValue(null);
      mockPrisma.wingmanAssignment.findFirst.mockResolvedValue({
        id: 'assign1',
      });

      await expect(
        service.createTask('user1', 'rel1', 'title', 'desc'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create task successfully', async () => {
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
        status: 'ICEBREAKING',
      });
      mockPrisma.wingmanTask.findFirst.mockResolvedValue(null);
      mockPrisma.wingmanAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.wingmanTask.create.mockResolvedValue({
        id: 'task1',
        clientId: 'user1',
        relationshipId: 'rel1',
        title: 'title',
        status: 'OPEN',
      });

      const result = await service.createTask('user1', 'rel1', 'title', 'desc');

      expect(result.status).toBe('OPEN');
    });
  });

  describe('applyForTask', () => {
    it('should reject non-existent task', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue(null);

      await expect(service.applyForTask('task1', 'wingman1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject non-OPEN task', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        status: 'CLOSED',
        clientId: 'user1',
      });

      await expect(service.applyForTask('task1', 'wingman1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject non-wingman user', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        status: 'OPEN',
        clientId: 'user1',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        roles: ['CLIENT'],
        wingmanCertStatus: 'APPROVED',
      });

      await expect(service.applyForTask('task1', 'wingman1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject duplicate application', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        status: 'OPEN',
        clientId: 'user1',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        roles: ['WINGMAN'],
        wingmanCertStatus: 'APPROVED',
      });
      mockPrisma.wingmanApplication.findUnique.mockResolvedValue({
        id: 'existing',
      });

      await expect(service.applyForTask('task1', 'wingman1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should apply successfully and notify client', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        status: 'OPEN',
        clientId: 'user1',
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          roles: ['WINGMAN'],
          wingmanCertStatus: 'APPROVED',
        })
        .mockResolvedValueOnce({ nickname: 'WingmanA' });
      mockPrisma.wingmanApplication.findUnique.mockResolvedValue(null);
      mockPrisma.wingmanApplication.create.mockResolvedValue({
        id: 'app1',
        taskId: 'task1',
        wingmanId: 'wingman1',
      });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.applyForTask('task1', 'wingman1');

      expect(result.id).toBe('app1');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1', type: 'WINGMAN_APPLIED' }),
      );
    });
  });

  describe('approveTask', () => {
    it('should reject if not task owner', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        clientId: 'other',
      });

      await expect(
        service.approveTask('task1', 'user1', 'wingman1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if application not found', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        id: 'task1',
        clientId: 'user1',
        status: 'OPEN',
        relationshipId: 'rel1',
      });
      mockPrisma.wingmanApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.approveTask('task1', 'user1', 'wingman1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve and create assignment', async () => {
      const task = {
        id: 'task1',
        clientId: 'user1',
        status: 'OPEN',
        relationshipId: 'rel1',
      };
      const application = { id: 'app1', status: 'PENDING' };

      mockPrisma.wingmanTask.findUnique.mockResolvedValue(task);
      mockPrisma.wingmanApplication.findUnique.mockResolvedValue(application);
      mockPrisma.relationship.findUnique.mockResolvedValue({
        id: 'rel1',
        user1Id: 'user1',
        user2Id: 'user2',
      });
      mockPrisma.wingmanAssignment.findUnique.mockResolvedValue(null);
      mockPrisma.wingmanApplication.update.mockResolvedValue({
        ...application,
        status: 'APPROVED',
      });
      mockPrisma.wingmanApplication.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.wingmanAssignment.create.mockResolvedValue({
        id: 'assign1',
        mode: 'PRIVATE',
      });
      mockPrisma.wingmanTask.update.mockResolvedValue({
        ...task,
        status: 'IN_PROGRESS',
        wingmanId: 'wingman1',
      });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.approveTask('task1', 'user1', 'wingman1');

      expect(result.task.status).toBe('IN_PROGRESS');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'wingman1',
          type: 'WINGMAN_APPROVED',
        }),
      );
    });
  });

  describe('rejectApplication', () => {
    it('should reject application and notify wingman', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        id: 'task1',
        clientId: 'user1',
      });
      mockPrisma.wingmanApplication.findUnique.mockResolvedValue({
        id: 'app1',
        status: 'PENDING',
      });
      mockPrisma.wingmanApplication.update.mockResolvedValue({
        id: 'app1',
        status: 'REJECTED',
      });
      mockNotificationService.createNotification.mockResolvedValue({});

      const result = await service.rejectApplication(
        'task1',
        'user1',
        'wingman1',
      );

      expect(result.status).toBe('REJECTED');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'wingman1',
          type: 'WINGMAN_REJECTED',
        }),
      );
    });
  });

  describe('cancelTask', () => {
    it('should reject if not task owner', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        clientId: 'other',
      });

      await expect(service.cancelTask('task1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should cancel task and remove wingman assignment', async () => {
      mockPrisma.wingmanTask.findUnique.mockResolvedValue({
        id: 'task1',
        clientId: 'user1',
        status: 'OPEN',
        wingmanId: 'wingman1',
        relationshipId: 'rel1',
      });
      mockPrisma.wingmanAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.wingmanTask.update.mockResolvedValue({
        id: 'task1',
        status: 'CANCELLED',
      });

      const result = await service.cancelTask('task1', 'user1');

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.wingmanAssignment.updateMany).toHaveBeenCalled();
    });
  });
});
