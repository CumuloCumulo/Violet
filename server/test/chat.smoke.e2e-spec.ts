import { TestApp } from './utils/test-app.js';
import { Fixture } from './utils/fixture.js';
import { TestClient } from './utils/test-client.js';

describe('Chat Smoke Test', () => {
  let app: TestApp;
  let fixture: Fixture;

  beforeAll(async () => {
    app = await TestApp.create();
    fixture = new Fixture(app.prisma);
    await app.cleanup();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create test users and relationship', async () => {
    const setup = await fixture.setupFourPersonRoom();

    expect(setup.client1).toBeDefined();
    expect(setup.client2).toBeDefined();
    expect(setup.wingman1).toBeDefined();
    expect(setup.wingman2).toBeDefined();
    expect(setup.relationship.status).toBe('ICEBREAKING');
    expect(setup.assignment1.side).toBe(1);
    expect(setup.assignment2.side).toBe(2);
  });

  it('should connect socket clients', async () => {
    const setup = await fixture.setupFourPersonRoom();

    const httpServer = app.app.getHttpServer();
    const address = httpServer.address();
    const url = `http://localhost:${address.port}`;

    const client1 = new TestClient(url, setup.client1.id);
    const client2 = new TestClient(url, setup.client2.id);

    await client1.connect();
    await client2.connect();

    expect(client1.socket.connected).toBe(true);
    expect(client2.socket.connected).toBe(true);

    client1.disconnect();
    client2.disconnect();
  });
});
