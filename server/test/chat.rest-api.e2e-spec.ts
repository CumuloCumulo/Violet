import { TestApp } from './utils/test-app.js';
import { Fixture } from './utils/fixture.js';

describe('REST API', () => {
  let app: TestApp;
  let fixture: Fixture;
  let setup: Awaited<ReturnType<Fixture['setupFourPersonRoom']>>;
  let baseUrl: string;

  beforeAll(async () => {
    app = await TestApp.create();
    fixture = new Fixture(app.prisma);

    const httpServer = app.app.getHttpServer();
    const address = httpServer.address();
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await app.cleanup();
    setup = await fixture.setupFourPersonRoom();
  });

  it('GET /api/chat/:id/messages should return messages for room member', async () => {
    await app.prisma.message.create({
      data: {
        relationshipId: setup.relationship.id,
        senderId: setup.client1.id,
        content: 'Test message',
        type: 'MAIN',
      },
    });

    const res = await fetch(
      `${baseUrl}/api/chat/${setup.relationship.id}/messages`,
      { headers: { 'x-user-id': setup.client1.id } },
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages.length).toBeGreaterThanOrEqual(1);
    expect(data.messages[0].content).toBe('Test message');
  });

  it('GET /api/chat/:id/presence should return member presence', async () => {
    const res = await fetch(
      `${baseUrl}/api/chat/${setup.relationship.id}/presence`,
      { headers: { 'x-user-id': setup.client1.id } },
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.presence.length).toBe(4);
  });

  it('should reject non-member from accessing messages', async () => {
    const res = await fetch(
      `${baseUrl}/api/chat/${setup.relationship.id}/messages`,
      { headers: { 'x-user-id': 'stranger' } },
    );

    expect(res.status).toBe(401);
  });
});
