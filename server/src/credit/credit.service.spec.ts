/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CreditService } from './credit.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('CreditService', () => {
  let service: CreditService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      checkinRecord: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },

      $transaction: vi.fn((ops: any) => {
        if (Array.isArray(ops)) return Promise.all(ops);
        return ops(mockPrisma);
      }),
    };

    service = new CreditService(mockPrisma);
  });

  describe('getBalance', () => {
    it('should return user credit score', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ creditScore: 42 });

      const result = await service.getBalance('user1');
      expect(result).toBe(42);
    });

    it('should return 0 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getBalance('nonexistent');
      expect(result).toBe(0);
    });
  });

  describe('checkin', () => {
    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.checkin('nonexistent')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject duplicate checkin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });
      mockPrisma.checkinRecord.findFirst.mockResolvedValue({ id: 'record1' });

      await expect(service.checkin('user1')).rejects.toThrow('今日已签到');
    });

    it('should checkin and award credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });
      mockPrisma.checkinRecord.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ creditScore: 23 });
      mockPrisma.checkinRecord.create.mockResolvedValue({ id: 'record1' });

      const result = await service.checkin('user1');

      expect(result.reward).toBe(3);
      expect(result.balance).toBe(23);
    });
  });

  describe('getCheckinStatus', () => {
    it('should return hasCheckedIn false when not checked in', async () => {
      mockPrisma.checkinRecord.findFirst.mockResolvedValue(null);

      const result = await service.getCheckinStatus('user1');
      expect(result.hasCheckedIn).toBe(false);
      expect(result.reward).toBe(3);
    });

    it('should return hasCheckedIn true when already checked in', async () => {
      mockPrisma.checkinRecord.findFirst.mockResolvedValue({ id: 'record1' });

      const result = await service.getCheckinStatus('user1');
      expect(result.hasCheckedIn).toBe(true);
    });
  });

  describe('deductCredit', () => {
    it('should reject insufficient credit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ creditScore: 3 });

      await expect(service.deductCredit('user1', 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deductCredit('nonexistent', 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should deduct credit successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ creditScore: 20 });
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.deductCredit('user1', 5);
      expect(result).toBe(15);
    });

    it('should handle race condition where updateMany returns 0', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ creditScore: 20 });
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.deductCredit('user1', 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
