import { TestApp } from './utils/test-app.js';
import { Fixture } from './utils/fixture.js';
import { TestClient } from './utils/test-client.js';
import type { WingmanMode } from '@prisma/client';

describe('Wingman Modes', () => {
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

  async function setupRoom(
    wingman1Mode: WingmanMode = 'PRIVATE',
    wingman2Mode: WingmanMode = 'PRIVATE',
  ) {
    await app.cleanup();
    await fixture.ensureSystemUser();
    return fixture.setupFourPersonRoom('ICEBREAKING', wingman1Mode, wingman2Mode);
  }

  async function waitDisconnect(...clients: TestClient[]) {
    for (const c of clients) c.disconnect();
    await new Promise((r) => setTimeout(r, 100));
  }

  it('should enforce PRIVATE mode wingman cannot send MAIN messages', async () => {
    const setup = await setupRoom();

    const w1 = new TestClient(url, setup.wingman1.id);
    await w1.connect();
    await w1.joinRoom(setup.relationship.id);

    w1.clearEvents();
    w1.sendMessage(setup.relationship.id, 'Should be blocked');

    const error = await w1.waitForEvent('error', 3000);
    expect(error.code).toBe('FORBIDDEN');

    await waitDisconnect(w1);
  });

  it('should allow SOLO mode wingman to send MAIN as client', async () => {
    const setup = await setupRoom('SOLO', 'PRIVATE');

    const c2 = new TestClient(url, setup.client2.id);
    const w1 = new TestClient(url, setup.wingman1.id);
    await c2.connect();
    await w1.connect();
    await c2.joinRoom(setup.relationship.id);
    await w1.joinRoom(setup.relationship.id);

    c2.clearEvents();
    w1.sendMessage(setup.relationship.id, 'Hello as client1!');

    const c2Msg = await c2.waitForEvent('newMessage', 3000);
    expect(c2Msg.content).toBe('Hello as client1!');
    expect(c2Msg.senderId).toBe(setup.client1.id);

    await waitDisconnect(c2, w1);
  });

  it('should handle ASSIST mode draft→confirm flow', async () => {
    const setup = await setupRoom('ASSIST', 'PRIVATE');

    const c1 = new TestClient(url, setup.client1.id);
    const c2 = new TestClient(url, setup.client2.id);
    const w1 = new TestClient(url, setup.wingman1.id);
    await c1.connect();
    await c2.connect();
    await w1.connect();
    await c1.joinRoom(setup.relationship.id);
    await c2.joinRoom(setup.relationship.id);
    await w1.joinRoom(setup.relationship.id);

    // Wingman drafts a message
    c1.clearEvents();
    c2.clearEvents();
    w1.draftMessage(setup.relationship.id, 'How about this line?');

    const pending = await c1.waitForEvent('newMessage', 3000);
    expect(pending.type).toBe('PENDING');
    expect(pending.content).toBe('How about this line?');

    // Client2 should NOT see the draft
    const c2DraftEvents = c2.getEvents('newMessage').filter(
      (e: any) => e.content === 'How about this line?',
    );
    expect(c2DraftEvents.length).toBe(0);

    // Client confirms
    c1.clearEvents();
    c2.clearEvents();
    c1.confirmMessage(pending.id, setup.relationship.id);

    // Confirmed message is broadcast as newMessage (type MAIN)
    const c1Confirmed = await c1.waitForEvent('newMessage', 3000);
    expect(c1Confirmed.type).toBe('MAIN');
    expect(c1Confirmed.content).toBe('How about this line?');

    await waitDisconnect(c1, c2, w1);
  });

  it('should handle ASSIST mode draft→reject flow', async () => {
    const setup = await setupRoom('ASSIST', 'PRIVATE');

    const c1 = new TestClient(url, setup.client1.id);
    const w1 = new TestClient(url, setup.wingman1.id);
    await c1.connect();
    await w1.connect();
    await c1.joinRoom(setup.relationship.id);
    await w1.joinRoom(setup.relationship.id);

    c1.clearEvents();
    w1.draftMessage(setup.relationship.id, 'Bad line');

    const pending = await c1.waitForEvent('newMessage', 3000);
    expect(pending.type).toBe('PENDING');

    // Client rejects
    c1.clearEvents();
    w1.clearEvents();
    c1.rejectMessage(pending.id, setup.relationship.id);

    const rejected = await w1.waitForEvent('messageRejected', 3000);
    expect(rejected.messageId).toBe(pending.id);

    await waitDisconnect(c1, w1);
  });

  it('should broadcast mode switch via switchMode event', async () => {
    const setup = await setupRoom();

    const c1 = new TestClient(url, setup.client1.id);
    const w1 = new TestClient(url, setup.wingman1.id);
    await c1.connect();
    await w1.connect();
    await c1.joinRoom(setup.relationship.id);
    await w1.joinRoom(setup.relationship.id);

    c1.clearEvents();
    w1.clearEvents();
    c1.switchMode(setup.relationship.id, setup.wingman1.id, 'SOLO');

    const c1Event = await c1.waitForEvent('modeSwitched', 3000);
    expect(c1Event.wingmanId).toBe(setup.wingman1.id);
    expect(c1Event.mode).toBe('SOLO');

    const w1Event = await w1.waitForEvent('modeSwitched', 3000);
    expect(w1Event.mode).toBe('SOLO');

    await waitDisconnect(c1, w1);
  });
});
