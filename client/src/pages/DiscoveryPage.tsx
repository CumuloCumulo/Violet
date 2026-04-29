import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { apiFetch } from '../lib/api';

interface DiscoverUser {
  id: string;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  interests: string[];
  declaration: string | null;
  isActive: boolean;
  lastActiveAt: string;
}

interface MatchRequestWithUser {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  fromUser?: DiscoverUser;
  toUser?: DiscoverUser;
}

type Tab = 'discover' | 'sent' | 'received';

const AURA_GRADIENTS = [
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #d4eda4 0%, #a1c4fd 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #d4eda4 100%)',
  'linear-gradient(135deg, #fecfef 0%, #ff9a9e 100%)',
];

function getAuraGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return AURA_GRADIENTS[Math.abs(hash) % AURA_GRADIENTS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return '刚刚活跃';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return '1天前';
}

export function DiscoveryPage() {
  const user = useAuthStore((s) => s.user);
  const enterChat = useAuthStore((s) => s.enterChat);
  const logout = useAuthStore((s) => s.logout);
  const setPage = useAuthStore((s) => s.setPage);
  const connect = useChatStore((s) => s.connect);
  const joinRoom = useChatStore((s) => s.joinRoom);

  const [tab, setTab] = useState<Tab>('discover');
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [sentRequests, setSentRequests] = useState<MatchRequestWithUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MatchRequestWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<DiscoverUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ users: DiscoverUser[]; total: number }>('/discovery/users');
      setUsers(res.users);
    } catch {}
    setLoading(false);
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const res = await apiFetch<MatchRequestWithUser[]>('/discovery/match-requests/sent');
      setSentRequests(res);
    } catch {}
  }, []);

  const fetchReceived = useCallback(async () => {
    try {
      const res = await apiFetch<MatchRequestWithUser[]>('/discovery/match-requests/received');
      setReceivedRequests(res);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'discover') fetchUsers();
    else if (tab === 'sent') fetchSent();
    else fetchReceived();
  }, [tab, fetchUsers, fetchSent, fetchReceived]);

  const sendMatchRequest = async (toUserId: string) => {
    setConfirmTarget(null);
    setActionError('');
    try {
      await apiFetch('/discovery/match-request', {
        method: 'POST',
        body: JSON.stringify({ toUserId }),
      });
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const acceptRequest = async (id: string) => {
    setActionError('');
    try {
      const res = await apiFetch<{ relationship: { id: string } }>(`/discovery/match-request/${id}/accept`, {
        method: 'POST',
      });
      const relationshipId = res.relationship.id;
      connect(user!.id);
      setTimeout(() => {
        joinRoom(relationshipId);
        enterChat(relationshipId);
      }, 300);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const rejectRequest = async (id: string) => {
    setActionError('');
    try {
      await apiFetch(`/discovery/match-request/${id}/reject`, { method: 'POST' });
      fetchReceived();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const tabLabels: Record<Tab, string> = { discover: '发现', sent: '已发起', received: '收到心动' };

  return (
    <div className="min-h-screen relative" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="logo" style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#3a405a', letterSpacing: 1, fontWeight: 600 }}>
          Violet
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#7a829a' }}>{user?.creditScore ?? 0} 分</span>
          {user?.roles.includes('ADMIN') && (
            <button
              onClick={() => setPage('admin')}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(212,237,164,0.35)', color: '#5a7332', border: '1px solid rgba(212,237,164,0.6)' }}
            >
              管理
            </button>
          )}
          <button
            onClick={() => setPage('profile')}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.5)', color: '#5a627a', border: '1px solid rgba(255,255,255,0.8)' }}
          >
            个人中心
          </button>
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.5)', color: '#7a829a', border: '1px solid rgba(255,255,255,0.8)' }}
          >
            退出
          </button>
        </div>
      </header>

      {/* Nav Pills */}
      <div className="text-center mb-12">
        <div
          className="inline-flex rounded-[30px] p-1"
          style={{
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          {(['discover', 'sent', 'received'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2 rounded-[20px] text-sm transition-all relative"
              style={{
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#8ca0ff' : '#7a829a',
                fontWeight: tab === t ? 600 : 400,
                boxShadow: tab === t ? '0 4px 12px rgba(140,160,255,0.2)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tabLabels[t]}
              {t === 'received' && receivedRequests.length > 0 && (
                <span
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
                  style={{ background: 'rgba(196,125,142,0.2)', color: '#c47d8e' }}
                >
                  {receivedRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {actionError && (
        <div className="mb-6">
          <p className="text-xs px-4 py-2 rounded-2xl text-center" style={{ background: 'rgba(196,125,142,0.1)', color: '#c47d8e' }}>
            {actionError}
          </p>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'discover' && (
          <motion.div
            key="discover"
            className="grid gap-6 pb-16"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <p className="text-sm text-center py-12 col-span-full" style={{ color: '#9e98aa' }}>加载中...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-center py-12 col-span-full" style={{ color: '#9e98aa' }}>暂无活跃用户</p>
            ) : (
              <>
                {users.map((u, i) => (
                  <SoulCard key={u.id} user={u} index={i} onSend={() => setConfirmTarget(u)} />
                ))}
                <MysteryCard />
              </>
            )}
          </motion.div>
        )}

        {tab === 'sent' && (
          <motion.div
            key="sent"
            className="grid gap-6 pb-16"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {sentRequests.length === 0 ? (
              <p className="text-sm text-center py-12 col-span-full" style={{ color: '#9e98aa' }}>还没有发起过牵线</p>
            ) : (
              sentRequests.map((r, i) => (
                <SoulCard
                  key={r.id}
                  user={r.toUser!}
                  index={i}
                  status={r.status}
                  onSend={() => {}}
                />
              ))
            )}
          </motion.div>
        )}

        {tab === 'received' && (
          <motion.div
            key="received"
            className="grid gap-6 pb-16"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {receivedRequests.length === 0 ? (
              <p className="text-sm text-center py-12 col-span-full" style={{ color: '#9e98aa' }}>暂无收到的牵线请求</p>
            ) : (
              receivedRequests.map((r, i) => (
                <ReceivedSoulCard
                  key={r.id}
                  request={r}
                  index={i}
                  onAccept={() => acceptRequest(r.id)}
                  onReject={() => rejectRequest(r.id)}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(58, 64, 90, 0.3)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-3xl p-6 w-full max-w-xs space-y-4"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 20px 50px rgba(140,160,255,0.15)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <p className="text-sm text-center" style={{ color: '#3a405a' }}>
                确认向 TA 发起牵线？<br />
                <span className="text-xs" style={{ color: '#9e98aa' }}>消耗 5 信用分</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="flex-1 h-10 rounded-2xl text-sm cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.45)', color: '#7a829a', border: '1px solid rgba(255,255,255,0.7)' }}
                >
                  取消
                </button>
                <button
                  onClick={() => sendMatchRequest(confirmTarget.id)}
                  className="flex-1 h-10 rounded-2xl text-sm font-medium cursor-pointer"
                  style={{ background: '#8ca0ff', color: '#fff', boxShadow: '0 6px 20px rgba(140,160,255,0.3)', border: 'none' }}
                >
                  确认牵线
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Soul Card (Gallery Mode) ───────────────────────────────

function SoulCard({ user, index, status, onSend }: {
  user: DiscoverUser;
  index: number;
  status?: string;
  onSend: () => void;
}) {
  const statusInfo = status
    ? { PENDING: { text: '等待中', color: '#c4a35a' }, ACCEPTED: { text: '已接受', color: '#6b8c5a' }, REJECTED: { text: '已拒绝', color: '#c47d8e' }, EXPIRED: { text: '已过期', color: '#9e98aa' } }[status] ?? { text: status, color: '#9e98aa' }
    : null;

  return (
    <motion.div
      className="soul-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 + index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* Aura */}
      <div
        className="aura"
        style={{ background: getAuraGradient(user.id) }}
      />

      {/* Meta */}
      <div className="card-meta">
        <span
          className="gender-tag"
          style={{
            background: user.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)',
            color: user.gender === 'male' ? '#6b82f0' : '#c47d8e',
          }}
        >
          {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '?'}
        </span>
        <span className="info-text">
          {user.campus}{user.campus && user.grade ? ' · ' : ''}{user.grade}
        </span>
      </div>

      {/* Quote */}
      <p className="card-quote">
        {user.declaration ? `"${user.declaration}"` : '"..."'}
      </p>

      {/* Tags */}
      {user.interests.length > 0 && (
        <div className="tags-wrapper">
          {user.interests.slice(0, 5).map((tag) => (
            <span key={tag} className="hobby-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="card-action">
        {statusInfo ? (
          <span className="text-xs font-medium" style={{ color: statusInfo.color }}>{statusInfo.text}</span>
        ) : (
          <div className="status">
            <div className="dot" />
            {timeAgo(user.lastActiveAt)}
          </div>
        )}
        {!status && (
          <button
            onClick={(e) => { e.stopPropagation(); onSend(); }}
            className="connect-btn"
          >
            牵线
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mystery Card ────────────────────────────────────────────

function MysteryCard() {
  return (
    <motion.div
      className="soul-card mystery-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="aura" style={{ background: '#e2e6f3', filter: 'blur(10px)' }} />
      <div className="card-meta">
        <span className="gender-tag" style={{ background: 'rgba(255,255,255,0.5)', color: '#7a829a' }}>未知</span>
      </div>
      <p className="card-quote mystery-quote">"有一份来自南区的神秘缘分等待开启..."</p>
      <div className="tags-wrapper mystery-tags">
        <span className="hobby-tag mystery-tag-blur">????</span>
        <span className="hobby-tag mystery-tag-blur">????</span>
      </div>
      <div className="card-action" style={{ borderTopColor: 'rgba(255,255,255,0.3)' }}>
        <span className="mystery-label">待解锁</span>
        <button className="connect-btn" style={{ color: '#a1a9c3' }}>
          拆开盲盒
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Received Request Soul Card ──────────────────────────────

function ReceivedSoulCard({ request, index, onAccept, onReject }: {
  request: MatchRequestWithUser;
  index: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  const u = request.fromUser!;

  return (
    <motion.div
      className="soul-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 + index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* Aura */}
      <div className="aura" style={{ background: getAuraGradient(u.id) }} />

      {/* Meta */}
      <div className="card-meta">
        <span
          className="gender-tag"
          style={{
            background: u.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)',
            color: u.gender === 'male' ? '#6b82f0' : '#c47d8e',
          }}
        >
          {u.gender === 'male' ? '男' : '女'}
        </span>
        <span className="info-text">
          {u.campus}{u.campus && u.grade ? ' · ' : ''}{u.grade}
        </span>
      </div>

      {/* Quote */}
      <p className="card-quote">
        {u.declaration ? `"${u.declaration}"` : '"..."'}
      </p>

      {/* Tags */}
      {u.interests.length > 0 && (
        <div className="tags-wrapper">
          {u.interests.slice(0, 5).map((tag) => (
            <span key={tag} className="hobby-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card-action">
        <button
          onClick={onReject}
          className="flex-1 h-10 rounded-2xl text-xs cursor-pointer transition-all"
          style={{ background: 'rgba(196,125,142,0.08)', color: '#c47d8e', border: '1px solid rgba(196,125,142,0.2)' }}
        >
          不合适
        </button>
        <button
          onClick={onAccept}
          className="flex-1 h-10 rounded-2xl text-xs font-medium cursor-pointer transition-all"
          style={{ background: '#8ca0ff', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(140,160,255,0.3)' }}
        >
          接受心动
        </button>
      </div>
    </motion.div>
  );
}
