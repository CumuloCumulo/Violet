import { TestApp } from './utils/test-app.js';
import { Fixture } from './utils/fixture.js';
import { TestClient } from './utils/test-client.js';

describe('Four Person Flow', () => {
  let app: TestApp;
  let fixture: Fixture;
  let url: string;

  beforeAll(async () => {
    app = await TestApp.create();
    fixture = new Fixture(app.prisma);
    url = app.getUrl()!;
  });

  afterAll(async () => {
    await app.close();
  });

  async function cleanSetup() {
    await app.cleanup();
    await fixture.ensureSystemUser();
    return fixture.setupFourPersonRoom();
  }

  it('should allow four users to join and exchange messages', async () => {
    const setup = await cleanSetup();

    const c1 = new TestClient(url, setup.client1.id);
    const c2 = new TestClient(url, setup.client2.id);
    const w1 = new TestClient(url, setup.wingman1.id);

    await c1.connect();
    await c2.connect();
    await w1.connect();

    const joinData = await c1.joinRoom(setup.relationship.id);
    expect(joinData.relationshipId).toBe(setup.relationship.id);
    expect(joinData.role).toBe('client1');

    await c2.joinRoom(setup.relationship.id);
    await w1.joinRoom(setup.relationship.id);

    // Client1 sends a MAIN message
    c1.clearEvents();
    c2.clearEvents();
    c1.sendMessage(setup.relationship.id, 'Hello from client1!');

    const c2Msg = await c2.waitForEvent('newMessage', 3000);
    expect(c2Msg.content).toBe('Hello from client1!');
    expect(c2Msg.type).toBe('MAIN');

    const c1Echo = await c1.waitForEvent('newMessage', 3000);
    expect(c1Echo.content).toBe('Hello from client1!');

    // Wingman1 sends a PRIVATE message to client1
    w1.clearEvents();
    c1.clearEvents();
    c2.clearEvents();
    w1.sendMessage(
      setup.relationship.id,
      'Private advice',
      'PRIVATE',
      setup.client1.id,
    );

    const c1Private = await c1.waitForEvent('newMessage', 3000);
    expect(c1Private.content).toBe('Private advice');
    expect(c1Private.type).toBe('PRIVATE');

    // Client2 should NOT see the private message
    const c2Events = c2
      .getEvents('newMessage')
      .filter((e: any) => e.content === 'Private advice');
    expect(c2Events.length).toBe(0);

    c1.disconnect();
    c2.disconnect();
    w1.disconnect();
    await new Promise((r) => setTimeout(r, 100));
  });

  it('should reject invalid room join', async () => {
    const setup = await cleanSetup();

    const stranger = new TestClient(url, 'nonexistent_user');
    await stranger.connect();
    stranger.joinRoom(setup.relationship.id);

    const result = await stranger.waitForEvent('error', 3000);
    expect(result).toBeDefined();

    stranger.disconnect();
  });
});
