import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { useChatStore } from '../stores/chatStore';

interface WingmanPanelProps {
  relationshipId: string;
  userId: string;
  isWingman: boolean;
  wingmanId1: string | null;
  wingmanId2: string | null;
  wingmanMode1: string | null;
  wingmanMode2: string | null;
  relationshipStatus: string;
}

interface WingmanTask {
  id: string;
  title: string;
  description: string;
  status: string;
  wingmanId: string | null;
  wingman?: { id: string; nickname: string; avatar: string | null };
}

interface UserInfo {
  id: string;
  nickname: string;
  avatar: string | null;
}

const MODE_LABELS: Record<string, string> = {
  SOLO: '代聊',
  PRIVATE: '私聊',
  ASSIST: '辅助',
};

export function WingmanPanel({
  relationshipId,
  userId: _userId,
  isWingman,
  wingmanId1,
  wingmanId2,
  wingmanMode1,
  wingmanMode2,
  relationshipStatus,
}: WingmanPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<WingmanTask[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flirtingPending, setFlirtingPending] = useState(false);
  const [wingmenInfo, setWingmenInfo] = useState<Record<string, UserInfo>>({});

  const socket = useChatStore((s) => s.socket);

  // Fetch tasks for this relationship
  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiFetch<WingmanTask[]>(
        `/wingman-task/by-relationship?relationshipId=${encodeURIComponent(relationshipId)}`,
      );
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch wingman tasks:', err);
    }
  }, [relationshipId]);

  // Fetch user info helper
  const fetchUserInfo = useCallback(async (uid: string): Promise<UserInfo | null> => {
    try {
      const data = await apiFetch<UserInfo>(`/user/${encodeURIComponent(uid)}`);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Load wingmen nicknames
  useEffect(() => {
    const ids = [wingmanId1, wingmanId2].filter(Boolean) as string[];
    if (ids.length === 0) return;

    const missing = ids.filter((id) => !wingmenInfo[id]);
    if (missing.length === 0) return;

    Promise.all(missing.map((id) => fetchUserInfo(id))).then((results) => {
      setWingmenInfo((prev) => {
        const next = { ...prev };
        results.forEach((info, i) => {
          if (info) next[missing[i]] = info;
        });
        return next;
      });
    });
  }, [wingmanId1, wingmanId2, fetchUserInfo, wingmenInfo]);

  // Fetch tasks when panel expands
  useEffect(() => {
    if (expanded) {
      fetchTasks();
    }
  }, [expanded, fetchTasks]);

  // Publish a new task
  const handlePublish = useCallback(async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch('/wingman-task', {
        method: 'POST',
        body: JSON.stringify({ relationshipId, title: title.trim(), description: description.trim() }),
      });
      setTitle('');
      setDescription('');
      await fetchTasks();
    } catch (err) {
      console.error('Failed to publish task:', err);
    } finally {
      setSubmitting(false);
    }
  }, [relationshipId, title, description, fetchTasks]);

  // Approve a task applicant
  const handleApprove = useCallback(async (taskId: string) => {
    try {
      await apiFetch(`/wingman-task/${taskId}/approve`, { method: 'POST' });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to approve task:', err);
    }
  }, [fetchTasks]);

  // Reject a task applicant
  const handleReject = useCallback(async (taskId: string) => {
    try {
      await apiFetch(`/wingman-task/${taskId}/reject`, { method: 'POST' });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to reject task:', err);
    }
  }, [fetchTasks]);

  // Cancel / dismiss a wingman
  const handleCancel = useCallback(async (taskId: string) => {
    try {
      await apiFetch(`/wingman-task/${taskId}`, { method: 'DELETE' });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to cancel task:', err);
    }
  }, [fetchTasks]);

  // Propose flirting phase
  const handleProposeFlirting = useCallback(() => {
    if (!socket) return;
    socket.emit('proposeFlirting', { relationshipId });
    setFlirtingPending(true);
  }, [socket, relationshipId]);

  // Active wingmen from props
  const activeWingmen: { id: string; mode: string | null }[] = [];
  if (wingmanId1) activeWingmen.push({ id: wingmanId1, mode: wingmanMode1 });
  if (wingmanId2) activeWingmen.push({ id: wingmanId2, mode: wingmanMode2 });

  // Tasks with pending applications (status ASSIGNED)
  const assignedTasks = tasks.filter((t) => t.status === 'ASSIGNED' && t.wingmanId);

  // Build a taskId map for active wingmen so we can show "请出"
  const wingmanTaskMap: Record<string, string> = {};
  tasks.forEach((t) => {
    if (t.wingmanId && (t.status === 'ASSIGNED' || t.status === 'APPROVED')) {
      wingmanTaskMap[t.wingmanId] = t.id;
    }
  });

  return (
    <>
      {/* Toggle button - always visible on the right edge */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="shrink-0 flex items-center justify-center transition-all z-10"
        style={{
          width: 32,
          background: expanded
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderLeft: expanded ? 'none' : '1px solid rgba(255, 255, 255, 0.8)',
          borderRight: '1px solid rgba(255, 255, 255, 0.6)',
          borderTop: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          color: '#7a829a',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#8ca0ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#7a829a';
        }}
        title={expanded ? '收起军师面板' : '展开军师面板'}
      >
        <span style={{ fontSize: 18, writingMode: 'vertical-rl', letterSpacing: 2 }}>
          {expanded ? '\u2039' : '\u203A'}
        </span>
      </button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <div className="flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ width: 320 }}>
              {/* Header */}
              <div
                className="shrink-0 px-5 py-4"
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.6)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                }}
              >
                <h3
                  className="text-[16px]"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 600,
                    color: '#3a405a',
                  }}
                >
                  {isWingman ? '军师面板' : '军师管理'}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
                {/* ---- Current Wingmen ---- */}
                {activeWingmen.length > 0 && (
                  <Section title="当前军师">
                    {activeWingmen.map((wm) => {
                      const info = wingmenInfo[wm.id];
                      const taskId = wingmanTaskMap[wm.id];
                      return (
                        <div
                          key={wm.id}
                          className="flex items-center justify-between gap-2 py-2"
                          style={{ borderBottom: '1px solid rgba(140, 160, 255, 0.08)' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                              style={{
                                background: 'rgba(212, 237, 164, 0.35)',
                                color: '#5a7332',
                                border: '1px solid rgba(212, 237, 164, 0.6)',
                              }}
                            >
                              {(info?.nickname ?? '?').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] truncate" style={{ color: '#3a405a' }}>
                                {info?.nickname ?? wm.id}
                              </p>
                              {wm.mode && (
                                <span
                                  className="text-[11px] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: 'rgba(140, 160, 255, 0.1)',
                                    color: '#8ca0ff',
                                  }}
                                >
                                  {MODE_LABELS[wm.mode] ?? wm.mode}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isWingman && taskId && (
                            <button
                              onClick={() => handleCancel(taskId)}
                              className="shrink-0 text-[11px] px-2 py-1 rounded-lg transition-all"
                              style={{
                                background: 'rgba(196, 125, 142, 0.1)',
                                color: '#c47d8e',
                                border: '1px solid rgba(196, 125, 142, 0.2)',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196, 125, 142, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196, 125, 142, 0.1)';
                              }}
                            >
                              请出
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </Section>
                )}

                {/* ---- Wingman simplified view ---- */}
                {isWingman && activeWingmen.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-[13px]" style={{ color: '#9e98aa' }}>
                      当前无可查看的军师信息
                    </p>
                  </div>
                )}

                {/* ---- Publish Task Form (clients only) ---- */}
                {!isWingman && (
                  <Section title="发布任务">
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="任务标题，如：帮忙约线下吃饭"
                        className="w-full px-3 py-2 rounded-xl text-[13px] outline-none transition-all"
                        style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.8)',
                          color: '#3a405a',
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLInputElement).style.borderColor = 'rgba(140, 160, 255, 0.4)';
                          (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.8)';
                          (e.target as HTMLInputElement).style.boxShadow = 'none';
                        }}
                      />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="描述你需要军师帮你做什么..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none transition-all"
                        style={{
                          background: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.8)',
                          color: '#3a405a',
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(140, 160, 255, 0.4)';
                          (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255, 255, 255, 0.8)';
                          (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                        }}
                      />
                      <button
                        onClick={handlePublish}
                        disabled={submitting || !title.trim() || !description.trim()}
                        className="w-full py-2 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40"
                        style={{
                          background: '#8ca0ff',
                          color: '#ffffff',
                          boxShadow: '0 4px 12px rgba(140, 160, 255, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                          if (!submitting && title.trim() && description.trim()) {
                            (e.currentTarget as HTMLButtonElement).style.background = '#758cf0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff';
                        }}
                      >
                        {submitting ? '发布中...' : '发布军师任务'}
                      </button>
                    </div>
                  </Section>
                )}

                {/* ---- Task Applicants (clients only) ---- */}
                {!isWingman && assignedTasks.length > 0 && (
                  <Section title="申请中的军师">
                    {assignedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="py-2"
                        style={{ borderBottom: '1px solid rgba(140, 160, 255, 0.08)' }}
                      >
                        <p className="text-[13px] mb-1" style={{ color: '#3a405a' }}>
                          <span style={{ fontWeight: 500 }}>
                            {task.wingman?.nickname ?? '未知用户'}
                          </span>
                          {' 申请加入'}
                        </p>
                        <p className="text-[12px] mb-2" style={{ color: '#7a829a' }}>
                          任务：{task.title}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(task.id)}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                            style={{
                              background: '#8ca0ff',
                              color: '#ffffff',
                              boxShadow: '0 2px 8px rgba(140, 160, 255, 0.2)',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#758cf0';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff';
                            }}
                          >
                            同意
                          </button>
                          <button
                            onClick={() => handleReject(task.id)}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                            style={{
                              background: 'rgba(140, 160, 255, 0.08)',
                              color: '#5a627a',
                              border: '1px solid rgba(140, 160, 255, 0.15)',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.08)';
                            }}
                          >
                            拒绝
                          </button>
                        </div>
                      </div>
                    ))}
                  </Section>
                )}

                {/* ---- Propose Flirting (clients only, ICEBREAKING status) ---- */}
                {!isWingman && relationshipStatus === 'ICEBREAKING' && (
                  <Section title="阶段转换">
                    {flirtingPending ? (
                      <div
                        className="text-center py-3 px-4 rounded-xl"
                        style={{
                          background: 'rgba(140, 160, 255, 0.08)',
                          color: '#8ca0ff',
                        }}
                      >
                        <p className="text-[13px]">等待对方确认...</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleProposeFlirting}
                        className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #c47d8e, #e0a0b0)',
                          color: '#ffffff',
                          boxShadow: '0 4px 12px rgba(196, 125, 142, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b06e80, #d090a0)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #c47d8e, #e0a0b0)';
                        }}
                      >
                        发起暧昧期
                      </button>
                    )}
                  </Section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---- Reusable section wrapper ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="text-[12px] uppercase tracking-wider mb-2"
        style={{ color: '#9e98aa', fontWeight: 500 }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
