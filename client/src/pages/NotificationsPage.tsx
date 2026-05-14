import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotificationStore, type NotificationItem } from '../stores/notificationStore';

// ─── Notification type config ────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  MATCH_REQUEST_RECEIVED: { icon: '💜', color: '#8ca0ff' },
  MATCH_REQUEST_ACCEPTED: { icon: '🎉', color: '#8cbf6a' },
  MATCH_REQUEST_REJECTED: { icon: '🤍', color: '#9e98aa' },
  WINGMAN_APPLIED: { icon: '🎯', color: '#d4eda4' },
  WINGMAN_APPROVED: { icon: '✅', color: '#8cbf6a' },
  WINGMAN_REJECTED: { icon: '❌', color: '#c47d8e' },
  RELATIONSHIP_ICEBREAKING: { icon: '💬', color: '#8ca0ff' },
  RELATIONSHIP_FLIRTING: { icon: '💗', color: '#e8a0bf' },
  RELATIONSHIP_ENDED: { icon: '🍂', color: '#b0b5c9' },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: '🔔', color: '#8ca0ff' };
}

// ─── Time formatting ─────────────────────────────────────────

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ─── Date grouping ───────────────────────────────────────────

type DateGroup = 'today' | 'yesterday' | 'earlier';

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDay.getTime() >= today.getTime()) return 'today';
  if (msgDay.getTime() >= yesterday.getTime()) return 'yesterday';
  return 'earlier';
}

const GROUP_LABELS: Record<DateGroup, string> = {
  today: '今天',
  yesterday: '昨天',
  earlier: '更早',
};

// ─── Navigate helper ─────────────────────────────────────────

function getNotificationTarget(notification: NotificationItem): string | null {
  const data = notification.data;
  if (!data) return null;

  switch (notification.type) {
    case 'MATCH_REQUEST_RECEIVED':
      return '/';
    case 'MATCH_REQUEST_ACCEPTED':
      return data.relationshipId ? `/chat/${data.relationshipId}` : '/';
    case 'RELATIONSHIP_ICEBREAKING':
    case 'RELATIONSHIP_FLIRTING':
    case 'RELATIONSHIP_ENDED':
      return data.relationshipId ? `/chat/${data.relationshipId}` : null;
    case 'WINGMAN_APPLIED':
      return '/wingman-hall';
    case 'WINGMAN_APPROVED':
      return data.relationshipId ? `/chat/${data.relationshipId}` : '/';
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hasMore = useNotificationStore((s) => s.hasMore);
  const loading = useNotificationStore((s) => s.loading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleClick = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      const target = getNotificationTarget(notification);
      if (target) navigate(target);
    },
    [markAsRead, navigate],
  );

  // Group notifications by date
  const groups: { key: DateGroup; items: NotificationItem[] }[] = [];
  const groupMap = new Map<DateGroup, NotificationItem[]>();
  for (const n of notifications) {
    const group = getDateGroup(n.createdAt);
    if (!groupMap.has(group)) groupMap.set(group, []);
    groupMap.get(group)!.push(n);
  }
  const order: DateGroup[] = ['today', 'yesterday', 'earlier'];
  for (const key of order) {
    const items = groupMap.get(key);
    if (items && items.length > 0) {
      groups.push({ key, items });
    }
  }

  return (
    <div className="ntf-page" style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' }}>
      {/* Header */}
      <header className="ntf-header">
        <button
          onClick={() => navigate('/')}
          className="ntf-back-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className="ntf-title"
          style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#3a405a', letterSpacing: 1, fontWeight: 600 }}
        >
          消息
        </div>
        <div className="ntf-header-actions">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="ntf-mark-all-btn"
            >
              全部已读
            </button>
          )}
        </div>
      </header>

      {/* Notification List */}
      {loading && notifications.length === 0 ? (
        <div className="ntf-empty">
          <p className="text-sm" style={{ color: '#9e98aa' }}>加载中...</p>
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          className="ntf-empty-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm" style={{ color: '#9e98aa' }}>暂无消息</p>
          <p className="text-xs mt-2" style={{ color: '#b0b5c9' }}>互动消息会在这里显示</p>
        </motion.div>
      ) : (
        <div className="ntf-list">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <div key={group.key} className="ntf-group">
                <div className="ntf-group-label">{GROUP_LABELS[group.key]}</div>
                {group.items.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleClick(notification)}
                  />
                ))}
              </div>
            ))}
          </AnimatePresence>
          {hasMore && (
            <div className="ntf-load-more">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={loading}
                className="ntf-load-more-btn"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notification Card ───────────────────────────────────────

function NotificationCard({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  const config = getTypeConfig(notification.type);
  const hasTarget = getNotificationTarget(notification) !== null;

  return (
    <motion.div
      className={`ntf-card${!notification.read ? ' ntf-card-unread' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={hasTarget ? onClick : undefined}
      style={{ cursor: hasTarget ? 'pointer' : 'default' }}
    >
      <div className="ntf-card-icon" style={{ background: `${config.color}18` }}>
        <span>{config.icon}</span>
      </div>
      <div className="ntf-card-body">
        <p className="ntf-card-title" style={{ color: notification.read ? '#7a829a' : '#3a405a' }}>
          {notification.title}
        </p>
        {notification.content && (
          <p className="ntf-card-content">{notification.content}</p>
        )}
        <span className="ntf-card-time">{formatTime(notification.createdAt)}</span>
      </div>
      {!notification.read && (
        <div className="ntf-card-dot" style={{ background: config.color }} />
      )}
    </motion.div>
  );
}
