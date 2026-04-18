import { useState } from 'react';
import { motion } from 'motion/react';
import { ChatPage } from './pages/ChatPage';

const DEV_MODE = import.meta.env.DEV;
const DEV_USER_ID = 'test_client1';
const DEV_RELATIONSHIP_ID = 'test_relationship_1';
const DEV_WINGMAN_ID = 'test_wingman1';

function App() {
  const [userId, setUserId] = useState(DEV_MODE ? DEV_USER_ID : '');
  const [relationshipId, setRelationshipId] = useState(DEV_MODE ? DEV_RELATIONSHIP_ID : '');
  const [wingmanId, setWingmanId] = useState(DEV_MODE ? DEV_WINGMAN_ID : '');
  const [started, setStarted] = useState(false);

  if (started && userId && relationshipId) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <ChatPage
          userId={userId}
          relationshipId={relationshipId}
          wingmanId={wingmanId || undefined}
          onExit={() => setStarted(false)}
        />
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <NoiseOverlay />
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <h1
              className="text-ink text-[56px] font-light tracking-wide"
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}
            >
              Violet
            </h1>
            <motion.p
              className="mt-2 text-sm font-light"
              style={{ color: '#5a627a', letterSpacing: '0.01em' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            >
              对话即心跳 — 校园恋爱代聊平台
            </motion.p>
            {DEV_MODE && (
              <motion.span
                className="inline-block mt-3 text-[11px] px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(212, 237, 164, 0.35)',
                  color: '#5a7332',
                  border: '1px solid rgba(212, 237, 164, 0.6)',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                DEV MODE
              </motion.span>
            )}
          </motion.div>

          {/* Form - Glass Card */}
          <motion.div
            className="glass rounded-[28px] p-6"
            style={{ boxShadow: '0 20px 50px rgba(140, 160, 255, 0.08)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
                  用户 ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="输入你的用户 ID"
                  className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    color: '#3a405a',
                    border: '1px solid rgba(140, 160, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
                  关系 ID
                </label>
                <input
                  type="text"
                  value={relationshipId}
                  onChange={(e) => setRelationshipId(e.target.value)}
                  placeholder="输入关系 ID"
                  className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    color: '#3a405a',
                    border: '1px solid rgba(140, 160, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
                  军师 ID（可选）
                </label>
                <input
                  type="text"
                  value={wingmanId}
                  onChange={(e) => setWingmanId(e.target.value)}
                  placeholder="输入军师用户 ID"
                  className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    color: '#3a405a',
                    border: '1px solid rgba(140, 160, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <motion.button
                onClick={() => setStarted(true)}
                disabled={!userId.trim() || !relationshipId.trim()}
                className="w-full h-11 rounded-2xl text-sm font-medium transition-all disabled:opacity-30 mt-1"
                style={{
                  background: '#8ca0ff',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(140, 160, 255, 0.35)',
                }}
                onMouseEnter={(e) => {
                  if (userId.trim() && relationshipId.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#7b90f0';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 30px rgba(140, 160, 255, 0.45)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(140, 160, 255, 0.35)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              >
                进入聊天
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function NoiseOverlay() {
  return <div className="noise-overlay" />;
}

function AmbientBackground() {
  return (
    <div className="ambient-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>
  );
}

export default App;
