import { useEffect, useCallback } from 'react';
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
  // Connect and join room on mount
  useEffect(() => {
    connect(userId);
  }, [userId, connect]);

  useEffect(() => {
    if (connected) {
      joinRoom(relationshipId);
    }
  }, [connected, relationshipId, joinRoom]);

  // Leave room on unmount
  useEffect(() => {
    return () => {
      leaveRoom(relationshipId);
    };
  }, [relationshipId, leaveRoom]);

  // Determine layout based on role and mode
  const isWingman = myRole?.startsWith('wingman');
  const isPrivateOnly = isWingman && wingmanMode === 'PRIVATE';
  const showMainPanel = !isPrivateOnly;
  const showPrivatePanel = !!wingmanId;

  // Mode switcher for clients
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
    <div className="h-full flex flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="shrink-0 h-12 bg-near-black/80 backdrop-blur-xl flex items-center px-4 z-10">
        <button
          onClick={onExit}
          className="text-white/70 hover:text-white transition-colors mr-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-white text-[15px] font-semibold tracking-tight flex-1">
          破冰聊天
        </h1>
        <ConnectionStatus connected={connected} />
      </header>

      {/* Mode Switcher (for clients with wingman) */}
      {!isWingman && wingmanId && (
        <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-light-gray border-b border-gray-200/60">
          <span className="text-xs text-msg-system mr-2">军师模式:</span>
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleModeSwitch(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                wingmanMode === opt.value
                  ? 'bg-apple-blue text-white'
                  : 'bg-white text-near-black border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Panels */}
      <div className="flex-1 flex min-h-0">
        {/* Main Chat Panel */}
        {showMainPanel && (
          <div className={`flex flex-col ${showPrivatePanel ? 'w-3/5 border-r border-gray-200/60' : 'w-full'}`}>
            <ChatPanel
              relationshipId={relationshipId}
              title="主聊天"
              messageType="MAIN"
              myUserId={userId}
              presenceKey={relationshipId}
            />
          </div>
        )}

        {/* Private Chat Panel (with wingman) */}
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
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-online' : 'bg-red-400'
        }`}
      />
      <span className="text-white/50 text-[11px]">
        {connected ? '已连接' : '连接中...'}
      </span>
    </div>
  );
}
