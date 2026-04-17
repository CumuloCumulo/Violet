import { useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { ChatPanel } from '../components/ChatPanel';

interface ChatPageProps {
  userId: string;
  relationshipId: string;
  wingmanId?: string;
  wingmanMode?: string;
  onExit?: () => void;
}

export function ChatPage({
  userId,
  relationshipId,
  wingmanId,
  wingmanMode,
  onExit,
}: ChatPageProps) {
  const connect = useChatStore((s) => s.connect);
  const joinRoom = useChatStore((s) => s.joinRoom);
  const leaveRoom = useChatStore((s) => s.leaveRoom);
  const connected = useChatStore((s) => s.connected);
  const myRole = useChatStore((s) => s.myRole);
  const switchMode = useChatStore((s) => s.switchMode);

  useEffect(() => {
    connect(userId);
  }, [userId, connect]);

  useEffect(() => {
    if (connected) {
      joinRoom(relationshipId);
    }
  }, [connected, relationshipId, joinRoom]);

  useEffect(() => {
    return () => {
      leaveRoom(relationshipId);
    };
  }, [relationshipId, leaveRoom]);

  const isWingman = myRole?.startsWith('wingman');
  const isPrivateOnly = isWingman && wingmanMode === 'PRIVATE';
  const showMainPanel = !isPrivateOnly;
  const showPrivatePanel = !!wingmanId;

  const handleModeSwitch = useCallback(
    (mode: string) => {
      if (wingmanId) {
        switchMode(relationshipId, wingmanId, mode);
      }
    },
    [relationshipId, wingmanId, switchMode],
  );

  const modeOptions = [
    { value: 'SOLO', label: '代聊' },
    { value: 'PRIVATE', label: '私聊' },
    { value: 'ASSIST', label: '辅助' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation Bar - Glass */}
      <header
        className="shrink-0 h-12 flex items-center px-4 z-10"
        style={{
          background: 'rgba(251, 251, 252, 0.5)',
          backdropFilter: 'blur(20px) saturate(130%)',
          WebkitBackdropFilter: 'blur(20px) saturate(130%)',
          borderBottom: '1px solid rgba(140, 160, 255, 0.12)',
        }}
      >
        <button
          onClick={onExit}
          className="mr-3 transition-colors"
          style={{ color: '#7a829a' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3a405a'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7a829a'; }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1
          className="flex-1 text-[15px] font-medium"
          style={{ fontFamily: 'var(--font-serif)', color: '#3a405a', letterSpacing: '0.01em' }}
        >
          破冰聊天
        </h1>
        <ConnectionStatus connected={connected} />
      </header>

      {/* Mode Switcher */}
      {!isWingman && wingmanId && (
        <div
          className="shrink-0 flex items-center gap-1 px-4 py-2"
          style={{ background: 'rgba(255, 255, 255, 0.35)', borderBottom: '1px solid rgba(140, 160, 255, 0.08)' }}
        >
          <span className="text-xs mr-2" style={{ color: '#7a829a' }}>军师模式:</span>
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleModeSwitch(opt.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                wingmanMode === opt.value
                  ? { background: '#8ca0ff', color: '#ffffff', boxShadow: '0 4px 12px rgba(140, 160, 255, 0.3)' }
                  : { background: 'rgba(140, 160, 255, 0.1)', color: '#5a627a' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Panels */}
      <div className="flex-1 flex min-h-0">
        {showMainPanel && (
          <div
            className={`flex flex-col ${showPrivatePanel ? 'w-3/5' : 'w-full'}`}
            style={showPrivatePanel ? { borderRight: '1px solid rgba(140, 160, 255, 0.1)' } : undefined}
          >
            <ChatPanel
              relationshipId={relationshipId}
              title="主聊天"
              messageType="MAIN"
              myUserId={userId}
              presenceKey={relationshipId}
            />
          </div>
        )}

        {showPrivatePanel && (
          <div className={`flex flex-col ${showMainPanel ? 'w-2/5' : 'w-full'}`}>
            <ChatPanel
              relationshipId={relationshipId}
              title={isWingman ? '私聊窗口' : '军师私聊'}
              messageType="PRIVATE"
              targetUserId={wingmanId}
              myUserId={userId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: connected ? '#6b8c5a' : '#c47d8e' }}
      />
      <span className="text-[11px] font-light" style={{ color: '#7a829a' }}>
        {connected ? '已连接' : '连接中...'}
      </span>
    </div>
  );
}
