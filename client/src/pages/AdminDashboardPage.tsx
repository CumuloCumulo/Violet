import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCredit: number;
  totalRelationships: number;
  pendingMatchRequests: number;
}

interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  roles: string[];
  creditScore: number;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface AdminUserDetail extends AdminUser {
  avatar: string | null;
  major: string | null;
  interests: string[];
  declaration: string | null;
  wingmanCertStatus: string;
  wechat: string | null;
  qq: string | null;
  _count: {
    checkinRecords: number;
    relationshipsAsUser1: number;
    relationshipsAsUser2: number;
    sentMatchRequests: number;
    receivedMatchRequests: number;
  };
  creditLogs: {
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
    admin: { nickname: string };
  }[];
}

type Tab = 'overview' | 'users';

const AURA_GRADIENTS = [
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #d4eda4 0%, #a1c4fd 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #d4eda4 100%)',
];

function getAuraGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return AURA_GRADIENTS[Math.abs(hash) % AURA_GRADIENTS.length];
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageNum] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<AdminStats>('/admin/stats');
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (search) params.set('search', search);
      if (activeFilter) params.set('active', activeFilter);
      const data = await apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, activeFilter]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const data = await apiFetch<AdminUserDetail>(`/admin/users/${id}`);
      setDetail(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (selectedUserId) loadDetail(selectedUserId); }, [selectedUserId, loadDetail]);

  const handleAdjustCredit = async () => {
    if (!selectedUserId || !creditAmount || !creditReason) return;
    try {
      await apiFetch(`/admin/users/${selectedUserId}/credit`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(creditAmount, 10), reason: creditReason }),
      });
      setCreditAmount('');
      setCreditReason('');
      loadDetail(selectedUserId);
      loadUsers();
    } catch (e: any) {
      alert(e.message ?? '调整失败');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUserId) return;
    try {
      await apiFetch(`/admin/users/${selectedUserId}/toggle-active`, { method: 'POST' });
      loadDetail(selectedUserId);
      loadUsers();
    } catch (e: any) {
      alert(e.message ?? '操作失败');
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button onClick={() => navigate('/profile')} className="admin-back-btn">
          ← 个人中心
        </button>
        <h1>Violet 管理</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="admin-content">
        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'overview' ? 'active' : ''}`}
            onClick={() => setTab('overview')}
          >
            概览
          </button>
          <button
            className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            用户管理
          </button>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">总用户</div>
                <div className="admin-stat-card-value">{stats.totalUsers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">活跃用户</div>
                <div className="admin-stat-card-value">{stats.activeUsers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">系统总信用分</div>
                <div className="admin-stat-card-value">{stats.totalCredit}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">关系总数</div>
                <div className="admin-stat-card-value">{stats.totalRelationships}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card-label">待处理请求</div>
                <div className="admin-stat-card-value">{stats.pendingMatchRequests}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <motion.div
            className="admin-split-layout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left Panel: List */}
            <div className="admin-left-panel">
              {/* Search & Filter */}
              <div className="admin-search-bar">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="搜索昵称或邮箱..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPageNum(1); }}
                />
                <button
                  className={`admin-filter-btn ${activeFilter === 'true' ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(activeFilter === 'true' ? '' : 'true'); setPageNum(1); }}
                >
                  活跃
                </button>
                <button
                  className={`admin-filter-btn ${activeFilter === 'false' ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(activeFilter === 'false' ? '' : 'false'); setPageNum(1); }}
                >
                  已禁用
                </button>
              </div>

              {/* User List */}
              <div className="admin-user-list">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`admin-user-row ${selectedUserId === u.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <div
                      className="admin-user-avatar"
                      style={{ background: getAuraGradient(u.id) }}
                    >
                      {u.nickname.charAt(0)}
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-nickname">{u.nickname}</div>
                      <div className="admin-user-meta">
                        {u.email} · {u.roles.join(', ')}
                      </div>
                    </div>
                    <div className="admin-user-credit">{u.creditScore} 分</div>
                    <span className={`admin-user-status ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? '活跃' : '已禁用'}
                    </span>
                  </div>
                ))}
                {users.length === 0 && !loading && (
                  <p style={{ textAlign: 'center', color: '#9e98aa', fontSize: 13, padding: 20 }}>
                    没有找到用户
                  </p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button disabled={page <= 1} onClick={() => setPageNum(page - 1)}>上一页</button>
                  <span style={{ fontSize: 12, color: '#7a829a', lineHeight: '28px' }}>
                    {page} / {totalPages}
                  </span>
                  <button disabled={page >= totalPages} onClick={() => setPageNum(page + 1)}>下一页</button>
                </div>
              )}
            </div>

            {/* Right Panel: Detail */}
            <div className="admin-right-panel">
              {detail ? (
                <>
                  {/* Profile header */}
                  <div className="admin-detail-header">
                    <div
                      className="admin-detail-avatar"
                      style={{ background: getAuraGradient(detail.id) }}
                    >
                      {detail.nickname.charAt(0)}
                    </div>
                    <div className="admin-detail-header-info">
                      <div className="admin-detail-header-name">{detail.nickname}</div>
                      <div className="admin-detail-header-email">{detail.email}</div>
                    </div>
                    <span className={`admin-user-status ${detail.isActive ? 'active' : 'inactive'}`} style={{ fontSize: 11 }}>
                      {detail.isActive ? '活跃' : '已禁用'}
                    </span>
                  </div>

                  {/* Fields grid */}
                  <div className="admin-detail-fields-grid">
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">性别</span>
                      <span className="admin-detail-value">{detail.gender === 'male' ? '男' : detail.gender === 'female' ? '女' : '未填'}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">校区</span>
                      <span className="admin-detail-value">{detail.campus ?? '未填'}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">年级</span>
                      <span className="admin-detail-value">{detail.grade ?? '未填'}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">专业</span>
                      <span className="admin-detail-value">{detail.major ?? '未填'}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">信用分</span>
                      <span className="admin-detail-value" style={{ color: '#8ca0ff', fontWeight: 500 }}>{detail.creditScore}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">角色</span>
                      <span className="admin-detail-value">{detail.roles.join(', ')}</span>
                    </div>
                    <div className="admin-detail-field">
                      <span className="admin-detail-label">注册时间</span>
                      <span className="admin-detail-value">{new Date(detail.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {detail.wechat && (
                      <div className="admin-detail-field">
                        <span className="admin-detail-label">微信</span>
                        <span className="admin-detail-value">{detail.wechat}</span>
                      </div>
                    )}
                    {detail.qq && (
                      <div className="admin-detail-field">
                        <span className="admin-detail-label">QQ</span>
                        <span className="admin-detail-value">{detail.qq}</span>
                      </div>
                    )}
                  </div>

                  {detail.declaration && (
                    <div className="admin-detail-declaration">
                      <span className="admin-detail-label">恋爱宣言</span>
                      <div className="admin-detail-declaration-text">{detail.declaration}</div>
                    </div>
                  )}

                  {/* Credit adjustment */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-section-title">信用分调整</div>
                    <div className="admin-credit-form">
                      <input
                        type="number"
                        className="admin-credit-input"
                        placeholder="±分数"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                      />
                      <input
                        type="text"
                        className="admin-credit-reason"
                        placeholder="调整原因（必填）"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                      />
                      <button
                        className="admin-credit-submit"
                        disabled={!creditAmount || !creditReason}
                        onClick={handleAdjustCredit}
                      >
                        调整
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="admin-detail-section">
                    <button
                      className={`admin-toggle-btn ${!detail.isActive ? 'activate' : ''}`}
                      onClick={handleToggleActive}
                    >
                      {detail.isActive ? '禁用用户' : '启用用户'}
                    </button>
                  </div>

                  {/* Credit logs */}
                  {detail.creditLogs.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-section-title">调整记录</div>
                      <div className="admin-credit-logs">
                        {detail.creditLogs.map((log) => (
                          <div key={log.id} className="admin-credit-log-item">
                            <span>
                              <span style={{ color: log.amount > 0 ? '#5a7332' : '#c47d8e' }}>
                                {log.amount > 0 ? `+${log.amount}` : log.amount}
                              </span>
                              {' '}{log.reason}
                            </span>
                            <span style={{ color: '#9e98aa' }}>
                              {log.admin.nickname} · {new Date(log.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-detail-empty">
                  <div className="admin-detail-empty-icon">👤</div>
                  <div>点击左侧用户查看详情</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
