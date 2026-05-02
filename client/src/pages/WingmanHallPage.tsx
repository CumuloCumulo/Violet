import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

interface WingmanTaskClient {
  id: string;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  interests: string[];
  declaration: string | null;
}

interface WingmanTask {
  id: string;
  clientId: string;
  relationshipId: string | null;
  title: string;
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'CANCELLED';
  wingmanId: string | null;
  createdAt: string;
  applicationCount?: number;
  client: WingmanTaskClient;
}

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
  if (mins < 5) return '刚刚发布';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function WingmanHallPage() {
  const user = useAuthStore((s) => s.user);
  const setPage = useAuthStore((s) => s.setPage);

  const [tasks, setTasks] = useState<WingmanTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<WingmanTask[]>('/wingman-task');
      setTasks(res);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const applyForTask = async (taskId: string) => {
    setActionError('');
    try {
      await apiFetch(`/wingman-task/${taskId}/apply`, { method: 'POST' });
      setAppliedIds((prev) => new Set(prev).add(taskId));
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  return (
    <div className="wh min-h-screen relative" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage('discovery')}
            className="text-sm transition-colors cursor-pointer"
            style={{ color: '#7a829a', background: 'none', border: 'none', padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            className="logo"
            style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#3a405a', letterSpacing: 1, fontWeight: 600 }}
          >
            军师大厅
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#7a829a' }}>{user?.creditScore ?? 0} 分</span>
          <span
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(212,237,164,0.35)', color: '#5a7332', border: '1px solid rgba(212,237,164,0.6)' }}
          >
            军师
          </span>
        </div>
      </header>

      {/* Subtitle */}
      <div className="text-center mb-10">
        <motion.p
          className="text-sm"
          style={{ color: '#7a829a' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          浏览开放的军师任务，帮助有缘人牵线搭桥
        </motion.p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p
              className="text-xs px-4 py-2 rounded-2xl text-center"
              style={{ background: 'rgba(196,125,142,0.1)', color: '#c47d8e' }}
            >
              {actionError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          className="grid gap-6 pb-16"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <p className="text-sm text-center py-12 col-span-full" style={{ color: '#9e98aa' }}>
              加载中...
            </p>
          ) : tasks.length === 0 ? (
            <motion.div
              className="text-center py-16 col-span-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div
                className="inline-block rounded-3xl px-8 py-10"
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(16px)',
                  border: '1px dashed rgba(255,255,255,0.5)',
                }}
              >
                <p className="text-sm" style={{ color: '#9e98aa' }}>
                  暂无开放的军师任务
                </p>
                <p className="text-xs mt-2" style={{ color: '#b0b5c9' }}>
                  稍后再来看看吧
                </p>
              </div>
            </motion.div>
          ) : (
            tasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                applied={appliedIds.has(task.id)}
                onApply={() => applyForTask(task.id)}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────

function TaskCard({
  task,
  index,
  applied,
  onApply,
}: {
  task: WingmanTask;
  index: number;
  applied: boolean;
  onApply: () => void;
}) {
  const client = task.client;
  const isApplied = applied || task.wingmanId !== null;

  return (
    <motion.div
      className="soul-card"
      style={{ cursor: 'default' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 + index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* Aura */}
      <div className="aura" style={{ background: getAuraGradient(client.id) }} />

      {/* Client Meta (anonymous) */}
      <div className="card-meta">
        <span
          className="gender-tag"
          style={{
            background: client.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)',
            color: client.gender === 'male' ? '#6b82f0' : '#c47d8e',
          }}
        >
          {client.gender === 'male' ? '男' : client.gender === 'female' ? '女' : '?'}
        </span>
        <span className="info-text">
          {client.campus}{client.campus && client.grade ? ' · ' : ''}{client.grade}
        </span>
        <span className="info-text" style={{ marginLeft: 'auto', fontSize: 11 }}>
          {timeAgo(task.createdAt)}
        </span>
      </div>

      {/* Task Title */}
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          fontWeight: 600,
          color: '#3a405a',
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: '#5a627a',
          lineHeight: 1.6,
          marginBottom: 16,
          flex: 1,
        }}
      >
        {task.description}
      </p>

      {/* Client Interest Tags */}
      {client.interests.length > 0 && (
        <div className="tags-wrapper">
          {client.interests.slice(0, 5).map((tag) => (
            <span key={tag} className="hobby-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="card-action">
        {!isApplied && (task.applicationCount ?? 0) > 0 && (
          <span
            className="text-[11px] px-2 py-1 rounded-full"
            style={{ background: 'rgba(140,160,255,0.08)', color: '#8ca0ff' }}
          >
            {task.applicationCount}人已申请
          </span>
        )}
        {client.declaration && (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 13,
              fontStyle: 'italic',
              color: '#9e98aa',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            "{client.declaration}"
          </p>
        )}
        {isApplied ? (
          <span
            className="text-xs font-medium px-4 py-2 rounded-2xl"
            style={{ background: 'rgba(212,237,164,0.15)', color: '#6b8c5a', border: '1px solid rgba(212,237,164,0.3)' }}
          >
            已申请，等待审批
          </span>
        ) : (
          <button
            onClick={onApply}
            className="text-xs font-medium px-5 py-2 rounded-2xl cursor-pointer transition-all"
            style={{
              background: '#8ca0ff',
              color: '#fff',
              border: 'none',
              boxShadow: '0 6px 20px rgba(140,160,255,0.3)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#7b90f0';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(140,160,255,0.4)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(140,160,255,0.3)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            申请接单
          </button>
        )}
      </div>
    </motion.div>
  );
}
