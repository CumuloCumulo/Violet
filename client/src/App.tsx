import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { useAuthStore } from './stores/authStore';
import { useDevData, type DevUser, type DevRelationship } from './hooks/useDevData';

const DEV_MODE = import.meta.env.DEV;

function App() {
  if (DEV_MODE) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <DevApp />
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <NoiseOverlay />
      <ProdApp />
    </>
  );
}

// ─── DEV Mode: Selection-based Login (preserved) ──────────────

function DevApp() {
  const { users, relationships, loading } = useDevData();
  const [identity, setIdentity] = useState<'CLIENT' | 'WINGMAN' | null>(null);
  const [selectedUser, setSelectedUser] = useState<DevUser | null>(null);
  const [selectedRel, setSelectedRel] = useState<DevRelationship | null>(null);
  const [started, setStarted] = useState(false);
  const [useRealAuth, setUseRealAuth] = useState(false);

  // Use authStore page state for new pages
  const page = useAuthStore((s) => s.page);
  const authUser = useAuthStore((s) => s.user);
  const chatRelationshipId = useAuthStore((s) => s.chatRelationshipId);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const exitChat = useAuthStore((s) => s.exitChat);
  const setPage = useAuthStore((s) => s.setPage);

  // Try to resume session
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const filteredUsers = useMemo(() => {
    if (!identity) return [];
    if (identity === 'CLIENT') return users.filter((u) => u.roles.includes('CLIENT'));
    return users.filter((u) => u.roles.includes('WINGMAN'));
  }, [users, identity]);

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

  const chatUserId = selectedUser?.id ?? '';
  const chatRelationshipIdDev = selectedRel?.id ?? '';

  const { chatWingmanId, chatPrivateTargetId } = useMemo(() => {
    if (!selectedRel || !selectedUser) return { chatWingmanId: undefined, chatPrivateTargetId: undefined };

    if (identity === 'CLIENT') {
      const side = selectedRel.user1.id === selectedUser.id ? 1 : 2;
      const assignment = selectedRel.assignments.find((a) => a.side === side);
      return {
        chatWingmanId: assignment?.userId,
        chatPrivateTargetId: assignment?.userId,
      };
    }

    const assignment = selectedRel.assignments.find((a) => a.userId === selectedUser.id);
    const clientUser = assignment?.side === 1 ? selectedRel.user1 : selectedRel.user2;
    return {
      chatWingmanId: undefined,
      chatPrivateTargetId: clientUser?.id,
    };
  }, [identity, selectedRel, selectedUser]);

  // ── All hooks above this line. Early returns below. ──

  // If in chat mode (from discovery acceptance)
  if (page === 'chat' && authUser && chatRelationshipId) {
    return (
      <ChatPage
        userId={authUser.id}
        relationshipId={chatRelationshipId}
        onExit={exitChat}
      />
    );
  }

  // If authenticated, show production-style pages
  if (authUser && page !== 'login' && page !== 'register') {
    if (page === 'profile-setup') return <ProfileSetupPage />;
    if (page === 'discovery') return <DiscoveryPage />;
  }

  // If user chose real auth flow
  if (useRealAuth) {
    if (page === 'register') return <><AmbientBackground /><NoiseOverlay /><RegisterPage /></>;
    if (page === 'discovery' && authUser) return <><AmbientBackground /><NoiseOverlay /><DiscoveryPage /></>;
    return <><AmbientBackground /><NoiseOverlay /><LoginPage /></>;
  }

  if (started && chatUserId && chatRelationshipIdDev) {
    return (
      <>
        <AmbientBackground />
        <NoiseOverlay />
        <ChatPage
          userId={chatUserId}
          relationshipId={chatRelationshipIdDev}
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
          <div className="mt-4">
            <button
              onClick={() => { setUseRealAuth(true); setPage('login'); }}
              className="text-xs transition-colors"
              style={{ color: '#8ca0ff' }}
            >
              使用注册/登录 →
            </button>
          </div>
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

            {identity && (
              <StepSection label="2. 选择用户">
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <DevUserCard
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

// ─── Prod Mode: Auth-based routing ───────────────────────────

function ProdApp() {
  const page = useAuthStore((s) => s.page);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const chatRelationshipId = useAuthStore((s) => s.chatRelationshipId);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const exitChat = useAuthStore((s) => s.exitChat);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: '#9e98aa' }}>加载中...</p>
      </div>
    );
  }

  if (page === 'chat' && user && chatRelationshipId) {
    return (
      <ChatPage
        userId={user.id}
        relationshipId={chatRelationshipId}
        onExit={exitChat}
      />
    );
  }

  if (page === 'register') return <RegisterPage />;
  if (page === 'profile-setup') return <ProfileSetupPage />;
  if (page === 'discovery' && user) return <DiscoveryPage />;

  return <LoginPage />;
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

function DevUserCard({ user, selected, onClick, isWingman }: {
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
