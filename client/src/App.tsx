import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChatPage } from './pages/ChatPage';
import { useDevData, type DevUser, type DevRelationship } from './hooks/useDevData';

const DEV_MODE = import.meta.env.DEV;

type Identity = 'CLIENT' | 'WINGMAN';

function App() {
  if (DEV_MODE) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <DevLoginPage />
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <NoiseOverlay />
      <ProdLoginPage />
    </>
  );
}

// ─── DEV Mode: Selection-based Login ───────────────────────────

function DevLoginPage() {
  const { users, relationships, loading } = useDevData();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);
  const [selectedRel, setSelectedRel] = useState<DevRelationship | null>(null);
  const [started, setStarted] = useState(false);

  // Filter users by selected identity
  const filteredUsers = useMemo(() => {
    if (!identity) return [];
    if (identity === 'CLIENT') return users.filter((u) => u.roles.includes('CLIENT'));
    return users.filter((u) => u.roles.includes('WINGMAN'));
  }, [users, identity]);

  // Filter relationships by selected user
  const filteredRels = useMemo(() => {
    if (!selectedUser) return [];
    if (identity === 'CLIENT') {
      return relationships.filter(
        (r) => r.user1.id === selectedUser.id || r.user2.id === selectedUser.id,
      );
    }
    return relationships.filter((r) =>
      r.assignments.some((a) => a.userId === selectedUser.id),
    );
  }, [relationships, selectedUser, identity]);

  // Compute ChatPage props
  const chatUserId = selectedUser?.id ?? '';
  const chatRelationshipId = selectedRel?.id ?? '';

  // 当事人：wingmanId = 己方军师 ID，privateChatTargetId = 同上
  // 军师：wingmanId = undefined（不控制模式），privateChatTargetId = 己方当事人 ID
  const { chatWingmanId, chatPrivateTargetId } = useMemo(() => {
    if (!selectedRel || !selectedUser) return { chatWingmanId: undefined, chatPrivateTargetId: undefined };

    if (identity === 'CLIENT') {
      // 判断当事人是 user1 还是 user2，取对应 side 的军师
      const side = selectedRel.user1.id === selectedUser.id ? 1 : 2;
      const assignment = selectedRel.assignments.find((a) => a.side === side);
      return {
        chatWingmanId: assignment?.userId,
        chatPrivateTargetId: assignment?.userId,
      };
    }

    // WINGMAN：私聊对象是己方当事人
    const assignment = selectedRel.assignments.find((a) => a.userId === selectedUser.id);
    const clientUser = assignment?.side === 1 ? selectedRel.user1 : selectedRel.user2;
    return {
      chatWingmanId: undefined,
      chatPrivateTargetId: clientUser?.id,
    };
  }, [identity, selectedRel, selectedUser]);

  if (started && chatUserId && chatRelationshipId) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <ChatPage
          userId={chatUserId}
          relationshipId={chatRelationshipId}
          wingmanId={chatWingmanId}
          privateChatTargetId={chatPrivateTargetId}
          onExit={() => {
            setStarted(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md">
        {/* Brand */}
        <motion.div
          className="text-center mb-8"
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
            DEV 测试登录
          </motion.p>
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
        </motion.div>

        {loading ? (
          <div className="text-center text-sm" style={{ color: '#7a829a' }}>加载测试数据...</div>
        ) : (
          <motion.div
            className="glass rounded-[28px] p-6 space-y-5"
            style={{ boxShadow: '0 20px 50px rgba(140, 160, 255, 0.08)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* Step 1: Identity */}
            <StepSection label="1. 选择身份">
              <div className="flex gap-3">
                <SelectCard
                  selected={identity === 'CLIENT'}
                  onClick={() => { setIdentity('CLIENT'); setSelectedUser(null); setSelectedRel(null); }}
                  label="当事人"
                  desc="选择当事人身份测试主聊天"
                />
                <SelectCard
                  selected={identity === 'WINGMAN'}
                  onClick={() => { setIdentity('WINGMAN'); setSelectedUser(null); setSelectedRel(null); }}
                  label="军师"
                  desc="选择军师身份测试辅助功能"
                />
              </div>
            </StepSection>

            {/* Step 2: User */}
            {identity && (
              <StepSection label="2. 选择用户">
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      selected={selectedUser?.id === u.id}
                      onClick={() => { setSelectedUser(u); setSelectedRel(null); }}
                      isWingman={identity === 'WINGMAN'}
                    />
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: '#9e98aa' }}>没有可用的用户</p>
                  )}
                </div>
              </StepSection>
            )}

            {/* Step 3: Relationship */}
            {selectedUser && (
              <StepSection label="3. 选择聊天室">
                <div className="space-y-2">
                  {filteredRels.map((r) => (
                    <RelationshipCard
                      key={r.id}
                      rel={r}
                      selected={selectedRel?.id === r.id}
                      onClick={() => setSelectedRel(r)}
                    />
                  ))}
                  {filteredRels.length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: '#9e98aa' }}>没有可加入的聊天室</p>
                  )}
                </div>
              </StepSection>
            )}

            {/* Enter button */}
            {selectedRel && (
              <motion.button
                onClick={() => setStarted(true)}
                className="w-full h-11 rounded-2xl text-sm font-medium transition-all"
                style={{
                  background: '#8ca0ff',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(140, 160, 255, 0.35)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#7b90f0';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 30px rgba(140, 160, 255, 0.45)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(140, 160, 255, 0.35)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              >
                进入聊天
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI Components ──────────────────────────────────────

function StepSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-light block mb-2" style={{ color: '#7a829a' }}>{label}</span>
      {children}
    </div>
  );
}

function SelectCard({ selected, onClick, label, desc }: {
  selected: boolean; onClick: () => void; label: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-left px-4 py-3 rounded-2xl transition-all"
      style={{
        background: selected ? 'rgba(140, 160, 255, 0.12)' : 'rgba(255, 255, 255, 0.5)',
        border: selected ? '1px solid rgba(140, 160, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: selected ? '0 0 0 3px rgba(140, 160, 255, 0.1)' : 'none',
      }}
    >
      <span className="text-sm font-medium block" style={{ color: selected ? '#6b82f0' : '#3a405a' }}>{label}</span>
      <span className="text-[11px] block mt-0.5" style={{ color: '#7a829a' }}>{desc}</span>
    </button>
  );
}

function UserCard({ user, selected, onClick, isWingman }: {
  user: DevUser; selected: boolean; onClick: () => void; isWingman: boolean;
}) {
  const icon = isWingman ? '\uD83C\uDFAF' : '\uD83D\uDC64';
  const roleLabel = isWingman ? '军师' : '当事人';
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all"
      style={{
        background: selected ? 'rgba(140, 160, 255, 0.12)' : 'rgba(255, 255, 255, 0.5)',
        border: selected ? '1px solid rgba(140, 160, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: selected ? '0 0 0 3px rgba(140, 160, 255, 0.1)' : 'none',
      }}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-sm font-medium block" style={{ color: selected ? '#6b82f0' : '#3a405a' }}>
          {user.nickname}
        </span>
        <span className="text-[11px] block" style={{ color: '#9e98aa' }}>
          {roleLabel} · {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '?'} · {user.campus ?? '?'}
        </span>
      </div>
      <span className="text-[10px] ml-auto shrink-0 px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(140, 160, 255, 0.06)', color: '#9e98aa' }}
      >
        {user.id}
      </span>
    </button>
  );
}

function RelationshipCard({ rel, selected, onClick }: {
  rel: DevRelationship; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-2xl transition-all"
      style={{
        background: selected ? 'rgba(140, 160, 255, 0.12)' : 'rgba(255, 255, 255, 0.5)',
        border: selected ? '1px solid rgba(140, 160, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: selected ? '0 0 0 3px rgba(140, 160, 255, 0.1)' : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: selected ? '#6b82f0' : '#3a405a' }}>
          {rel.user1.nickname} ↔ {rel.user2.nickname}
        </span>
      </div>
      {rel.assignments.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {rel.assignments.map((a) => (
            <span
              key={a.userId}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(212, 237, 164, 0.3)',
                color: '#5a7332',
                border: '1px solid rgba(212, 237, 164, 0.5)',
              }}
            >
              {a.nickname}({a.mode})
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Prod Mode: Placeholder for future login ───────────────────

function ProdLoginPage() {
  const [userId, setUserId] = useState('');
  const [relationshipId, setRelationshipId] = useState('');
  const [started, setStarted] = useState(false);

  if (started && userId && relationshipId) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <ChatPage
          userId={userId}
          relationshipId={relationshipId}
          onExit={() => setStarted(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="text-ink text-[56px] font-light tracking-wide"
            style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}
          >
            Violet
          </h1>
          <p className="mt-2 text-sm font-light" style={{ color: '#5a627a' }}>
            对话即心跳 — 校园恋爱代聊平台
          </p>
        </div>
        <div className="glass rounded-[28px] p-6 space-y-4">
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
              }}
            />
          </div>
          <button
            onClick={() => setStarted(true)}
            disabled={!userId.trim() || !relationshipId.trim()}
            className="w-full h-11 rounded-2xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: '#8ca0ff',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(140, 160, 255, 0.35)',
            }}
          >
            进入聊天
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Background Components ─────────────────────────────────────

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
