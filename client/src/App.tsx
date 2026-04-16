import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';

const DEV_MODE = import.meta.env.DEV;
const DEV_USER_ID = 'dev_user_1';
const DEV_RELATIONSHIP_ID = 'dev_rel_1';
const DEV_WINGMAN_ID = 'dev_wingman_1';

function App() {
  const [userId, setUserId] = useState(DEV_MODE ? DEV_USER_ID : '');
  const [relationshipId, setRelationshipId] = useState(DEV_MODE ? DEV_RELATIONSHIP_ID : '');
  const [wingmanId, setWingmanId] = useState(DEV_MODE ? DEV_WINGMAN_ID : '');
  const [started, setStarted] = useState(false);

  if (started && userId && relationshipId) {
    return (
      <ChatPage
        userId={userId}
        relationshipId={relationshipId}
        wingmanId={wingmanId || undefined}
        onExit={() => setStarted(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-near-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-white text-[40px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Violet
          </h1>
          <p className="mt-2 text-white/50 text-sm tracking-tight">
            NJU代恋 — 校园恋爱代聊平台
          </p>
          {DEV_MODE && (
            <span className="inline-block mt-2 text-[11px] text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded-full">
              DEV MODE
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs mb-1.5 tracking-tight">
              用户 ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入你的用户 ID"
              className="w-full h-11 px-4 rounded-xl bg-dark-surface text-white text-sm placeholder:text-white/30 outline-none focus:ring-2 focus:ring-apple-blue/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1.5 tracking-tight">
              关系 ID
            </label>
            <input
              type="text"
              value={relationshipId}
              onChange={(e) => setRelationshipId(e.target.value)}
              placeholder="输入关系 ID"
              className="w-full h-11 px-4 rounded-xl bg-dark-surface text-white text-sm placeholder:text-white/30 outline-none focus:ring-2 focus:ring-apple-blue/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1.5 tracking-tight">
              军师 ID（可选）
            </label>
            <input
              type="text"
              value={wingmanId}
              onChange={(e) => setWingmanId(e.target.value)}
              placeholder="输入军师用户 ID"
              className="w-full h-11 px-4 rounded-xl bg-dark-surface text-white text-sm placeholder:text-white/30 outline-none focus:ring-2 focus:ring-apple-blue/40 transition-shadow"
            />
          </div>

          <button
            onClick={() => setStarted(true)}
            disabled={!userId.trim() || !relationshipId.trim()}
            className="w-full h-11 rounded-xl bg-apple-blue text-white text-sm font-medium disabled:opacity-30 hover:bg-apple-blue-hover transition-colors mt-2"
          >
            进入聊天
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
