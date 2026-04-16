import { TestApp } from './utils/test-app.js';
import { Fixture } from './utils/fixture.js';
import { TestClient } from './utils/test-client.js';

describe('Lifecycle', () => {
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
  }

  it('should open room when MATCHING transitions to ICEBREAKING', async () => {
    await cleanSetup();
    const client1 = await fixture.createUser({ nickname: 'C1' });
    const client2 = await fixture.createUser({ nickname: 'C2' });
    const rel = await fixture.createRelationship(client1.id, client2.id, 'MATCHING');

    const res = await fetch(`${url}/api/chat/${rel.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ICEBREAKING' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.event.type).toBe('roomOpened');

    const messages = await app.prisma.message.findMany({
      where: { relationshipId: rel.id },
    });
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('SYSTEM');
  });

  it('should close room when relationship transitions to FLIRTING', async () => {
    await cleanSetup();
    const setup = await fixture.setupFourPersonRoom('ICEBREAKING');

    const c1 = new TestClient(url, setup.client1.id);
    const c2 = new TestClient(url, setup.client2.id);
    await c1.connect();
    await c2.connect();
    await c1.joinRoom(setup.relationship.id);
    await c2.joinRoom(setup.relationship.id);

    c1.clearEvents();
    c2.clearEvents();
    c1.transitionStatus(setup.relationship.id, 'FLIRTING');

    const c1Closed = await c1.waitForEvent('roomClosed', 3000);
    expect(c1Closed.reason).toBe('FLIRTING');

    const c2Closed = await c2.waitForEvent('roomClosed', 3000);
    expect(c2Closed.reason).toBe('FLIRTING');

    c1.disconnect();
    c2.disconnect();
    await new Promise((r) => setTimeout(r, 100));
  });

  it('should disconnect all when relationship transitions to ENDED', async () => {
    await cleanSetup();
    const setup = await fixture.setupFourPersonRoom('ICEBREAKING');

    const c1 = new TestClient(url, setup.client1.id);
    const c2 = new TestClient(url, setup.client2.id);
    await c1.connect();
    await c2.connect();
    await c1.joinRoom(setup.relationship.id);
    await c2.joinRoom(setup.relationship.id);

    c1.clearEvents();
    c1.transitionStatus(setup.relationship.id, 'ENDED');

    const c1Closed = await c1.waitForEvent('roomClosed', 3000);
    expect(c1Closed.reason).toBe('ENDED');

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(c1.socket.connected).toBe(false);
    expect(c2.socket.connected).toBe(false);
  });
});
