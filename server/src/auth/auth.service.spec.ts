import { AuthService } from './auth.service';
import { BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(false),
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    get = vi.fn();
    set = vi.fn();
    del = vi.fn();
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockMailService: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    mockMailService = {
      sendVerificationCode: vi.fn(),
    };

    service = new AuthService(mockPrisma, mockMailService);
    mockRedis = (service as any).redis;
  });

  describe('sendCode', () => {
    it('should reject non-NJU email', async () => {
      await expect(service.sendCode('user@gmail.com')).rejects.toThrow(BadRequestException);
    });

    it('should accept NJU email and send code', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockMailService.sendVerificationCode.mockResolvedValue(undefined);

      const result = await service.sendCode('test@smail.nju.edu.cn');

      expect(result.message).toBe('验证码已发送');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'verify:test@smail.nju.edu.cn',
        expect.any(String),
        'EX',
        300,
      );
      expect(mockMailService.sendVerificationCode).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const dto = {
      email: 'test@smail.nju.edu.cn',
      nickname: 'TestUser',
      password: 'password123',
      code: '123456',
    };

    it('should reject non-NJU email', async () => {
      await expect(
        service.register({ ...dto, email: 'bad@gmail.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject wrong verification code', async () => {
      mockRedis.get.mockResolvedValue('654321');

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject expired verification code', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(service.register(dto)).rejects.toThrow('验证码错误或已过期');
    });

    it('should reject duplicate email', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should register successfully', async () => {
      const createdUser = {
        id: 'user1',
        email: dto.email,
        nickname: dto.nickname,
        password: 'hashed',
        creditScore: 20,
        roles: ['CLIENT'],
      };
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockRedis.del.mockResolvedValue(1);

      const result = await service.register(dto);

      expect(result.token).toBeDefined();
      expect(result.user.id).toBe('user1');
      expect(result.user).not.toHaveProperty('password');
      expect(mockRedis.del).toHaveBeenCalledWith('verify:test@smail.nju.edu.cn');
    });
  });

  describe('login', () => {
    const dto = { email: 'test@smail.nju.edu.cn', password: 'password123' };

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        password: 'hashedpassword',
      });
      // bcrypt.compare defaults to false in mock

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should login successfully', async () => {
      const user = {
        id: 'user1',
        email: dto.email,
        nickname: 'TestUser',
        password: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, lastActiveAt: new Date() });

      const bcrypt = await import('bcrypt');
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.login(dto);

      expect(result.token).toBeDefined();
      expect(result.user.id).toBe('user1');
      expect(result.user).not.toHaveProperty('password');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { lastActiveAt: expect.any(Date) },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reject wrong verification code', async () => {
      mockRedis.get.mockResolvedValue('wrong');

      await expect(
        service.resetPassword('test@smail.nju.edu.cn', '123456', 'newpass123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unregistered email', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('test@smail.nju.edu.cn', '123456', 'newpass123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject password shorter than 6 characters', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });

      await expect(
        service.resetPassword('test@smail.nju.edu.cn', '123456', '12345'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password successfully', async () => {
      mockRedis.get.mockResolvedValue('123456');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user1' });
      mockRedis.del.mockResolvedValue(1);

      const result = await service.resetPassword(
        'test@smail.nju.edu.cn',
        '123456',
        'newpass123',
      );

      expect(result.message).toBe('密码重置成功');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { password: expect.any(String) },
      });
    });
  });

  describe('validateUser', () => {
    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');
      expect(result).toBeNull();
    });

    it('should return sanitized user without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@test.com',
        password: 'secret',
        nickname: 'Test',
      });

      const result = await service.validateUser('user1');
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe('user1');
    });
  });
});
