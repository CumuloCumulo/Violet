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
}

export function ChatPanel({
  relationshipId,
  title,
  messageType,
  targetUserId,
  myUserId,
  presenceKey,
}: ChatPanelProps) {
  const rawMessages = useChatStore((s) => s.messages[relationshipId]);
  const messages = rawMessages ?? [];
  const sendMessage = useChatStore((s) => s.sendMessage);
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
      } else {
        sendMessage(relationshipId, content, messageType);
      }
    },
    [relationshipId, messageType, targetUserId, sendMessage],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-4 h-12 shrink-0"
        style={{
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(140, 160, 255, 0.08)',
        }}
      >
        <h2
          className="text-[14px] font-medium"
          style={{ fontFamily: 'var(--font-serif)', color: '#3a405a' }}
        >
          {title}
        </h2>
        {presenceKey && (
          <PresenceIndicator relationshipId={relationshipId} />
        )}
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-1"
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
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  myUserId: string;
  onConfirm: () => void;
  onReject: () => void;
}

function MessageBubble({
  message,
  isSelf,
  myUserId,
  onConfirm,
  onReject,
}: MessageBubbleProps) {
  const isSystem = message.type === 'SYSTEM';
  const isPending = message.type === 'PENDING';

  if (isSystem) {
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

  if (isPending) {
    const isForMe = message.targetUserId === myUserId;
    return (
      <motion.div
        className={`flex ${isSelf ? 'justify-end' : 'justify-start'} py-1`}
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
            className="rounded-[20px] px-3.5 py-2"
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(196, 163, 90, 0.35)',
            }}
          >
            <p className="text-sm whitespace-pre-wrap break-words" style={{ color: '#3a405a' }}>
              {message.content}
            </p>
            {isForMe && (
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
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex ${isSelf ? 'justify-end' : 'justify-start'} py-1`}
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
          className="rounded-[20px] px-3.5 py-2"
          style={
            isSelf
              ? {
                  background: '#8ca0ff',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(140, 160, 255, 0.25)',
                }
              : {
                  background: 'rgba(255, 255, 255, 0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#3a405a',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }
          }
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
        <span className="text-[10px] mt-0.5 block" style={{ color: '#9e98aa' }}>
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
