import { useState } from 'react';
import { motion } from 'motion/react';
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
    <div className="min-h-screen login-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-warm-white text-[52px] font-light tracking-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Violet
          </h1>
          <motion.p
            className="mt-2 text-warm-white-50 text-sm"
            style={{ letterSpacing: '-0.01em' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            对话即心跳 — 校园恋爱代聊平台
          </motion.p>
          {DEV_MODE && (
            <motion.span
              className="inline-block mt-2 text-[11px] text-violet-light px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139, 92, 246, 0.15)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              DEV MODE
            </motion.span>
          )}
        </motion.div>

        {/* Form */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <label className="block text-warm-white-50 text-xs mb-1.5" style={{ letterSpacing: '-0.01em' }}>
              用户 ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入你的用户 ID"
              className="w-full h-11 px-4 rounded-xl text-sm text-warm-white placeholder:text-warm-white-30 outline-none transition-shadow"
              style={{
                background: '#1a1525',
                border: '1px solid rgba(139, 92, 246, 0.15)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <label className="block text-warm-white-50 text-xs mb-1.5" style={{ letterSpacing: '-0.01em' }}>
              关系 ID
            </label>
            <input
              type="text"
              value={relationshipId}
              onChange={(e) => setRelationshipId(e.target.value)}
              placeholder="输入关系 ID"
              className="w-full h-11 px-4 rounded-xl text-sm text-warm-white placeholder:text-warm-white-30 outline-none transition-shadow"
              style={{
                background: '#1a1525',
                border: '1px solid rgba(139, 92, 246, 0.15)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <label className="block text-warm-white-50 text-xs mb-1.5" style={{ letterSpacing: '-0.01em' }}>
              军师 ID（可选）
            </label>
            <input
              type="text"
              value={wingmanId}
              onChange={(e) => setWingmanId(e.target.value)}
              placeholder="输入军师用户 ID"
              className="w-full h-11 px-4 rounded-xl text-sm text-warm-white placeholder:text-warm-white-30 outline-none transition-shadow"
              style={{
                background: '#1a1525',
                border: '1px solid rgba(139, 92, 246, 0.15)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
              }}
            />
          </motion.div>

          <motion.button
            onClick={() => setStarted(true)}
            disabled={!userId.trim() || !relationshipId.trim()}
            className="w-full h-11 rounded-xl text-sm font-medium text-warm-white disabled:opacity-30 transition-colors mt-2"
            style={{ background: '#8b5cf6' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6'; }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            进入聊天
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default App;
