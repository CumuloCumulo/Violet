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
    <div className="h-screen flex items-center justify-center p-4 relative">
      {/* Floating Glass Container */}
      <div className="glass-float w-[92vw] h-[90vh] max-w-[1400px] flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header
          className="shrink-0 h-16 flex items-center px-6 z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.2))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <button
            onClick={onExit}
            className="transition-colors"
            style={{ color: '#7a829a', marginLeft: -8 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3a405a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7a829a'; }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1
            className="text-[20px]"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: '#8ca0ff', letterSpacing: '1px', flex: 1, marginLeft: 12 }}
          >
            破冰聊天
          </h1>

          {/* Mode Switcher - Pill Style */}
          {!isWingman && wingmanId && (
            <div
              className="flex rounded-full p-1"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              {modeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleModeSwitch(opt.value)}
                  className="px-4 py-1.5 rounded-full text-[13px] transition-all"
                  style={
                    wingmanMode === opt.value
                      ? { background: '#ffffff', color: '#8ca0ff', boxShadow: '0 2px 8px rgba(140, 160, 255, 0.2)', fontWeight: 500 }
                      : { color: '#7a829a' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Chat Panels */}
        <div className="flex-1 flex min-h-0">
          {showMainPanel && (
            <div
              className={`flex flex-col ${showPrivatePanel ? 'w-3/5' : 'w-full'}`}
              style={
                showPrivatePanel
                  ? { borderRight: '1px solid rgba(255, 255, 255, 0.6)', background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }
                  : undefined
              }
            >
              <ChatPanel
                relationshipId={relationshipId}
                title="主聊天"
                messageType="MAIN"
                myUserId={userId}
                presenceKey={relationshipId}
                accentColor="violet"
              />
            </div>
          )}

          {showPrivatePanel && (
            <div
              className={`flex flex-col ${showMainPanel ? 'w-2/5' : 'w-full'}`}
              style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.1), transparent)' }}
            >
              <ChatPanel
                relationshipId={relationshipId}
                title={isWingman ? '私聊窗口' : '军师私聊'}
                messageType="PRIVATE"
                targetUserId={wingmanId}
                myUserId={userId}
                accentColor="green"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
