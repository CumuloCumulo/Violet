import { UserService } from './user.service';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  compare: vi.fn().mockResolvedValue(false),
  hash: vi.fn().mockResolvedValue('newhash'),
}));

vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockRejectedValue(null),
}));

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new UserService(mockPrisma);
  });

  describe('getProfile', () => {
    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('nonexistent');
      expect(result).toBeNull();
    });

    it('should return user without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        nickname: 'Test',
        password: 'secret',
      });

      const result = await service.getProfile('user1');
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('user1');
    });
  });

  describe('updateProfile', () => {
    it('should reject invalid interests', async () => {
      await expect(
        service.updateProfile('user1', { interests: ['不存在的标签'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject more than 10 interests', async () => {
      const tooMany = Array(11).fill('摄影');
      await expect(
        service.updateProfile('user1', { interests: tooMany }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update profile successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        nickname: 'NewName',
        password: 'hashed',
      });

      const result = await service.updateProfile('user1', { nickname: 'NewName' });

      expect(result.nickname).toBe('NewName');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('certifyWingman', () => {
    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.certifyWingman('nonexistent', {
          moralAnswers: [1, 1],
          characteristicAnswers: ['kind'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject low credit score', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        creditScore: 5,
        wingmanCertCooldown: null,
      });

      await expect(
        service.certifyWingman('user1', {
          moralAnswers: [1, 1],
          characteristicAnswers: ['kind'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject during cooldown', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        creditScore: 50,
        wingmanCertCooldown: new Date(Date.now() + 86400000),
      });

      await expect(
        service.certifyWingman('user1', {
          moralAnswers: [1, 1],
          characteristicAnswers: ['kind'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject when moral answer is 0', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        creditScore: 50,
        wingmanCertCooldown: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        wingmanCertStatus: 'REJECTED',
      });

      await expect(
        service.certifyWingman('user1', {
          moralAnswers: [1, 0],
          characteristicAnswers: ['kind'],
        }),
      ).rejects.toThrow('道德评判未通过');
    });

    it('should approve wingman with valid answers', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        creditScore: 50,
        wingmanCertCooldown: null,
        roles: ['CLIENT'],
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        wingmanCertStatus: 'APPROVED',
        roles: ['CLIENT', 'WINGMAN'],
        password: 'hashed',
      });

      const result = await service.certifyWingman('user1', {
        moralAnswers: [1, 1, 1],
        characteristicAnswers: ['kind'],
      });

      expect(result.wingmanCertStatus).toBe('APPROVED');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('changePassword', () => {
    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', 'old', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject wrong current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        password: 'hashed',
      });
      // bcrypt.compare defaults to false

      await expect(
        service.changePassword('user1', 'wrongpass', 'newpass123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should change password with correct current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        password: 'hashed',
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user1' });

      const bcrypt = await import('bcrypt');
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.changePassword('user1', 'oldpass', 'newpass123');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { password: expect.any(String) },
      });
    });
  });

  describe('changeContactEmail', () => {
    it('should reject invalid email format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });

      await expect(
        service.changeContactEmail('user1', 'not-an-email'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update email successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        contactEmail: 'new@test.com',
        password: 'hashed',
      });

      const result = await service.changeContactEmail('user1', 'new@test.com');

      expect(result.contactEmail).toBe('new@test.com');
      expect(result).not.toHaveProperty('password');
    });
  });
});
