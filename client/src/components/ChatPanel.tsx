import { useEffect, useRef, useState, useCallback } from 'react';
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

  // Filter messages for this panel
  const filteredMessages = messages.filter((m) => {
    if (messageType === 'MAIN') {
      return m.type === 'MAIN' || m.type === 'SYSTEM' || m.type === 'PENDING';
    }
    // PRIVATE panel shows PRIVATE type messages
    return m.type === 'PRIVATE';
  });

  // Auto-scroll to bottom on new messages
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

    // Load history when scrolled to top
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
    <div className="flex flex-col h-full bg-white">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200/60 shrink-0">
        <h2 className="text-[15px] font-semibold text-near-black tracking-tight">
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
          <div className="text-center text-xs text-msg-system py-2">
            加载中...
          </div>
        )}
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

  // System message
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-msg-system bg-light-gray px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Pending message (needs confirmation)
  if (isPending) {
    const isForMe = message.targetUserId === myUserId;
    return (
      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} py-1`}>
        <div className="max-w-[75%]">
          {!isSelf && message.sender && (
            <span className="text-xs text-msg-system mb-0.5 block">
              {message.sender.nickname}
            </span>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2">
            <p className="text-sm text-near-black whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {isForMe && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onConfirm}
                  className="flex-1 text-xs font-medium text-white bg-apple-blue rounded-lg py-1.5 hover:bg-apple-blue-hover transition-colors"
                >
                  确认发送
                </button>
                <button
                  onClick={onReject}
                  className="flex-1 text-xs font-medium text-near-black bg-white border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors"
                >
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal message (MAIN or PRIVATE)
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} py-1`}>
      <div className="max-w-[75%]">
        {!isSelf && message.sender && (
          <span className="text-xs text-msg-system mb-0.5 block">
            {message.sender.nickname}
          </span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isSelf
              ? 'bg-msg-self text-white'
              : 'bg-msg-other text-near-black'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
        <span className="text-[10px] text-msg-system mt-0.5 block">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
