import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChatStore, type ChatMessage } from '../stores/chatStore';
import { MessageInput } from './MessageInput';
import { PresenceIndicator } from './PresenceIndicator';

interface ChatPanelProps {
  relationshipId: string;
  title: string;
  messageType: 'MAIN' | 'PRIVATE';
  targetUserId?: string;
  myUserId: string;
  presenceKey?: string;
  accentColor?: 'violet' | 'green';
  /** 军师辅助模式下主聊天走 draftMessage 而非 sendMessage */
  draftMode?: boolean;
}

export function ChatPanel({
  relationshipId,
  title,
  messageType,
  targetUserId,
  myUserId,
  presenceKey,
  accentColor = 'violet',
  draftMode = false,
}: ChatPanelProps) {
  const rawMessages = useChatStore((s) => s.messages[relationshipId]);
  const messages = rawMessages ?? [];
  const sendMessage = useChatStore((s) => s.sendMessage);
  const draftMessage = useChatStore((s) => s.draftMessage);
  const confirmMessage = useChatStore((s) => s.confirmMessage);
  const rejectMessage = useChatStore((s) => s.rejectMessage);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [, setCursor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const filteredMessages = messages.filter((m) => {
    if (messageType === 'MAIN') {
      return m.type === 'MAIN' || m.type === 'SYSTEM' || m.type === 'PENDING';
    }
    return m.type === 'PRIVATE';
  });

  useEffect(() => {
    if (isAtBottomRef.current && filteredMessages.length > prevMsgCountRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
    prevMsgCountRef.current = filteredMessages.length;
  }, [filteredMessages.length]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (el.scrollTop < 60 && !loadingHistory && filteredMessages.length > 0) {
      loadHistory();
    }
  }, [loadingHistory, filteredMessages.length]);

  const loadHistory = useCallback(async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const firstMsg = filteredMessages[0];
      const params = new URLSearchParams({ limit: '20' });
      if (firstMsg) params.set('cursor', firstMsg.id);
      const res = await fetch(
        `/api/chat/${relationshipId}/messages?${params}`,
        { headers: { 'x-user-id': myUserId } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages?.length) {
          setCursor(data.messages[0].id);
        }
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [loadingHistory, filteredMessages, relationshipId, myUserId]);

  const handleSend = useCallback(
    (content: string) => {
      if (messageType === 'PRIVATE' && targetUserId) {
        sendMessage(relationshipId, content, 'PRIVATE', targetUserId);
      } else if (draftMode) {
        draftMessage(relationshipId, content);
      } else {
        sendMessage(relationshipId, content, messageType);
      }
    },
    [relationshipId, messageType, targetUserId, sendMessage, draftMessage, draftMode],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header — matches reference .chat-header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
      >
        <h2
          className="text-[18px]"
          style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, color: '#3a405a' }}
        >
          {title}
        </h2>
        {presenceKey && (
          <PresenceIndicator relationshipId={relationshipId} userId={myUserId} />
        )}
      </div>

      {/* Message List — matches reference .messages-area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-4 px-6 py-6"
      >
        {loadingHistory && (
          <div className="text-center text-xs py-2" style={{ color: '#8ca0ff' }}>
            加载中...
          </div>
        )}
        <AnimatePresence initial={false}>
          {filteredMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === myUserId || msg.displaySenderId === myUserId}
              myUserId={myUserId}
              onConfirm={() => confirmMessage(msg.id, relationshipId)}
              onReject={() => rejectMessage(msg.id, relationshipId)}
              accentColor={accentColor}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} accentColor={accentColor} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  myUserId: string;
  onConfirm: () => void;
  onReject: () => void;
  accentColor?: 'violet' | 'green';
}

function MessageBubble({
  message,
  isSelf,
  myUserId,
  onConfirm,
  onReject,
  accentColor = 'violet',
}: MessageBubbleProps) {
  const isSystem = message.type === 'SYSTEM';
  const isPending = message.type === 'PENDING';

  // System message — wingman-hint style for green, violet pill for default
  if (isSystem) {
    if (accentColor === 'green') {
      return (
        <motion.div
          className="flex justify-center py-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span
            className="text-xs px-4 py-2 rounded-full flex items-center gap-1.5"
            style={{
              background: 'rgba(212, 237, 164, 0.3)',
              border: '1px solid rgba(212, 237, 164, 0.8)',
              color: '#5a7332',
              backdropFilter: 'blur(8px)',
            }}
          >
            {message.content}
          </span>
        </motion.div>
      );
    }
    return (
      <motion.div
        className="flex justify-center py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: 'rgba(140, 160, 255, 0.12)', color: '#6b82f0' }}
        >
          {message.content}
        </span>
      </motion.div>
    );
  }

  // Pending message
  if (isPending) {
    const isTarget = message.targetUserId === myUserId;
    const isDraftAuthor = isSelf;
    return (
      <motion.div
        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-[75%]">
          {!isSelf && message.sender && (
            <span className="text-[13px] mb-0.5 block" style={{ color: '#7a829a' }}>
              {message.sender.nickname}
            </span>
          )}
          <div
            className="px-[18px] py-3"
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(196, 163, 90, 0.35)',
              borderRadius: isSelf
                ? '20px 20px 4px 20px'
                : '20px 20px 20px 4px',
            }}
          >
            <p className="whitespace-pre-wrap break-words" style={{ color: '#3a405a', fontSize: 14, fontWeight: 400, lineHeight: 1.5 }}>
              {message.content}
            </p>
            {/* 当事人：确认/拒绝 */}
            {isTarget && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onConfirm}
                  className="flex-1 text-xs font-medium text-white rounded-xl py-1.5 transition-all"
                  style={{ background: '#8ca0ff', boxShadow: '0 4px 12px rgba(140, 160, 255, 0.25)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7b90f0'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff'; }}
                >
                  确认发送
                </button>
                <button
                  onClick={onReject}
                  className="flex-1 text-xs font-medium rounded-xl py-1.5 transition-all"
                  style={{
                    background: 'rgba(140, 160, 255, 0.08)',
                    color: '#5a627a',
                    border: '1px solid rgba(140, 160, 255, 0.15)',
                  }}
                >
                  拒绝
                </button>
              </div>
            )}
            {/* 军师（起草者）：等待确认提示 */}
            {isDraftAuthor && !isTarget && (
              <div className="mt-2 text-center">
                <span
                  className="text-[11px] px-3 py-1 rounded-full"
                  style={{ background: 'rgba(196, 163, 90, 0.15)', color: '#8a7340' }}
                >
                  等待当事人确认...
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Normal message
  const selfBg = accentColor === 'green'
    ? 'linear-gradient(135deg, #8cbf6a, #b5d98a)'
    : 'linear-gradient(135deg, #8ca0ff, #b5c0ff)';
  const selfShadow = accentColor === 'green'
    ? '0 4px 15px rgba(140, 191, 106, 0.3)'
    : '0 4px 15px rgba(140, 160, 255, 0.3)';
  const receivedBg = accentColor === 'green'
    ? 'rgba(255, 255, 255, 0.8)'
    : 'rgba(255, 255, 255, 0.6)';

  return (
    <motion.div
      className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[75%]">
        {!isSelf && message.sender && (
          <span className="text-xs mb-0.5 block" style={{ color: '#7a829a' }}>
            {message.sender.nickname}
          </span>
        )}
        <div
          className="px-[18px] py-3 whitespace-pre-wrap break-words"
          style={{
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.5,
            ...(isSelf
              ? {
                  background: selfBg,
                  color: '#ffffff',
                  borderRadius: '20px 20px 4px 20px',
                  boxShadow: selfShadow,
                }
              : {
                  background: receivedBg,
                  border: '1px solid white',
                  borderRadius: '20px 20px 20px 4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  color: '#3a405a',
                }),
          }}
        >
          {message.content}
        </div>
        <span className="text-[11px] mt-0.5 block" style={{ color: '#7a829a' }}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
