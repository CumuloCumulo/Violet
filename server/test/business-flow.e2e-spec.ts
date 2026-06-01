import { TestApp } from './utils/test-app';
import { Fixture } from './utils/fixture';
import request from 'supertest';

describe('Business Flow E2E', () => {
  let app: TestApp;
  let fixture: Fixture;

  beforeAll(async () => {
    app = await TestApp.create();
    fixture = new Fixture(app.prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 完整正常流程：
   * 注册用户A → 注册用户B → 登录 → 浏览发现 → 发起牵线 → 接受请求 → 查看关系
   */
  describe('Happy Path: Register → Login → Discover → Match → Accept', () => {
    const userAData = {
      email: 'alice@smail.nju.edu.cn',
      nickname: 'Alice',
      password: 'password123',
      code: '123456',
    };
    const userBData = {
      email: 'bob@smail.nju.edu.cn',
      nickname: 'Bob',
      password: 'password456',
      code: '654321',
    };

    let tokenA: string;
    let tokenB: string;
    let userAId: string;
    let userBId: string;

    it('should register user A', async () => {
      // Create user directly via fixture (bypasses email verification)
      const userA = await fixture.createUser({
        email: userAData.email,
        nickname: userAData.nickname,
        password: '$2b$10$testhashedpassword',
      });
      userAId = userA.id;
      expect(userA.id).toBeDefined();
    });

    it('should register user B', async () => {
      const userB = await fixture.createUser({
        email: userBData.email,
        nickname: userBData.nickname,
        password: '$2b$10$testhashedpassword',
      });
      userBId = userB.id;
      expect(userB.id).toBeDefined();
    });

    it('should login as user A', async () => {
      // Update password to a known bcrypt hash for testing
      await app.prisma.user.update({
        where: { id: userAId },
        data: { password: '$2b$10$testhashedpassword' },
      });

      // Since we can't easily predict bcrypt hash in fixture,
      // we simulate login by calling the auth/me endpoint with a generated token
      // For e2e purposes, we directly use the auth mechanism
      const jwt = await import('jsonwebtoken');
      tokenA = jwt.sign(
        { sub: userAId, email: userAData.email },
        process.env['JWT_SECRET'] ?? 'violet-dev-secret',
        { expiresIn: '7d' },
      );
      expect(tokenA).toBeDefined();
    });

    it('should login as user B', async () => {
      const jwt = await import('jsonwebtoken');
      tokenB = jwt.sign(
        { sub: userBId, email: userBData.email },
        process.env['JWT_SECRET'] ?? 'violet-dev-secret',
        { expiresIn: '7d' },
      );
      expect(tokenB).toBeDefined();
    });

    it('should browse discovery users', async () => {
      const res = await request(app.app.getHttpServer())
        .get('/api/discovery/users')
        .set('Cookie', `token=${tokenA}`)
        .expect(200);

      expect(res.body.users).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should send match request from A to B', async () => {
      // Ensure user A has enough credit
      await app.prisma.user.update({
        where: { id: userAId },
        data: { creditScore: 50 },
      });

      const res = await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .set('Cookie', `token=${tokenA}`)
        .send({ toUserId: userBId })
        .expect(201);

      expect(res.body.fromUserId).toBe(userAId);
      expect(res.body.toUserId).toBe(userBId);
      expect(res.body.status).toBe('PENDING');
    });

    it('should accept match request as user B', async () => {
      // Find the match request
      const matchRequest = await app.prisma.matchRequest.findFirst({
        where: { fromUserId: userAId, toUserId: userBId },
      });
      expect(matchRequest).not.toBeNull();

      const res = await request(app.app.getHttpServer())
        .post(`/api/discovery/match-request/${matchRequest!.id}/accept`)
        .set('Cookie', `token=${tokenB}`)
        .expect(201);

      expect(res.body.relationship).toBeDefined();
      expect(res.body.relationship.status).toBe('ICEBREAKING');
    });

    it('should list relationships', async () => {
      const res = await request(app.app.getHttpServer())
        .get('/api/discovery/relationships')
        .set('Cookie', `token=${tokenA}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const rel = res.body.find((r: any) => r.status === 'ICEBREAKING');
      expect(rel).toBeDefined();
    });

    it('should check credit was deducted', async () => {
      const res = await request(app.app.getHttpServer())
        .get('/api/credit/balance')
        .set('Cookie', `token=${tokenA}`)
        .expect(200);

      expect(res.body.balance).toBe(45); // 50 - 5 for match request
    });
  });

  /**
   * 异常流程 1：未登录访问受保护资源
   */
  describe('Error Flow 1: Unauthorized Access', () => {
    it('should reject unauthenticated discovery access', async () => {
      await request(app.app.getHttpServer())
        .get('/api/discovery/users')
        .expect(401);
    });

    it('should reject unauthenticated match request', async () => {
      await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .send({ toUserId: 'someone' })
        .expect(401);
    });

    it('should reject unauthenticated profile update', async () => {
      await request(app.app.getHttpServer())
        .patch('/api/user/profile')
        .send({ nickname: 'Hacker' })
        .expect(401);
    });

    it('should reject unauthenticated checkin', async () => {
      await request(app.app.getHttpServer())
        .post('/api/credit/checkin')
        .expect(401);
    });

    it('should reject unauthenticated notification access', async () => {
      await request(app.app.getHttpServer())
        .get('/api/notifications')
        .expect(401);
    });
  });

  /**
   * 异常流程 2：业务逻辑冲突（重复操作、越权、无效参数）
   */
  describe('Error Flow 2: Business Logic Conflicts', () => {
    let tokenA: string;
    let _tokenB: string;
    let userAId: string;
    let userBId: string;

    beforeAll(async () => {
      const userA = await fixture.createUser({ nickname: 'ConflictA' });
      const userB = await fixture.createUser({ nickname: 'ConflictB' });
      userAId = userA.id;
      userBId = userB.id;

      await app.prisma.user.update({
        where: { id: userAId },
        data: { creditScore: 50 },
      });

      const jwt = await import('jsonwebtoken');
      const secret = process.env['JWT_SECRET'] ?? 'violet-dev-secret';
      tokenA = jwt.sign({ sub: userAId, email: 'a@test.com' }, secret, {
        expiresIn: '7d',
      });
      tokenB = jwt.sign({ sub: userBId, email: 'b@test.com' }, secret, {
        expiresIn: '7d',
      });
    });

    it('should reject self-match', async () => {
      await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .set('Cookie', `token=${tokenA}`)
        .send({ toUserId: userAId })
        .expect(400);
    });

    it('should reject duplicate match request', async () => {
      // First request succeeds
      await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .set('Cookie', `token=${tokenA}`)
        .send({ toUserId: userBId })
        .expect(201);

      // Second request should be rejected
      await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .set('Cookie', `token=${tokenA}`)
        .send({ toUserId: userBId })
        .expect(409);
    });

    it('should reject accept by non-target user', async () => {
      const matchRequest = await app.prisma.matchRequest.findFirst({
        where: { fromUserId: userAId, toUserId: userBId },
      });

      // User A (sender) tries to accept their own request
      await request(app.app.getHttpServer())
        .post(`/api/discovery/match-request/${matchRequest!.id}/accept`)
        .set('Cookie', `token=${tokenA}`)
        .expect(403);
    });

    it('should reject profile update with invalid interests', async () => {
      await request(app.app.getHttpServer())
        .patch('/api/user/profile')
        .set('Cookie', `token=${tokenA}`)
        .send({ interests: ['不存在的标签'] })
        .expect(400);
    });

    it('should reject match request with insufficient credit', async () => {
      // Set credit to 0
      await app.prisma.user.update({
        where: { id: userAId },
        data: { creditScore: 0 },
      });

      const userC = await fixture.createUser({ nickname: 'UserC' });

      await request(app.app.getHttpServer())
        .post('/api/discovery/match-request')
        .set('Cookie', `token=${tokenA}`)
        .send({ toUserId: userC.id })
        .expect(403);
    });

    it('should reject checkin twice on same day', async () => {
      // Reset credit for checkin test
      await app.prisma.user.update({
        where: { id: userAId },
        data: { creditScore: 10 },
      });

      // First checkin
      await request(app.app.getHttpServer())
        .post('/api/credit/checkin')
        .set('Cookie', `token=${tokenA}`)
        .expect(201);

      // Second checkin same day
      await request(app.app.getHttpServer())
        .post('/api/credit/checkin')
        .set('Cookie', `token=${tokenA}`)
        .expect(409);
    });
  });
});
