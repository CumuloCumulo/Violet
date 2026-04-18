import { useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { ChatPanel } from '../components/ChatPanel';

interface ChatPageProps {
  userId: string;
  relationshipId: string;
  /** 私聊对象的 userId：当事人传军师 ID，军师传当事人 ID */
  privateChatTargetId?: string;
  /** 军师 ID（仅当事人需要，用于模式切换） */
  wingmanId?: string;
  onExit?: () => void;
}

export function ChatPage({
  userId,
  relationshipId,
  privateChatTargetId,
  wingmanId,
  onExit,
}: ChatPageProps) {
  const connect = useChatStore((s) => s.connect);
  const joinRoom = useChatStore((s) => s.joinRoom);
  const leaveRoom = useChatStore((s) => s.leaveRoom);
  const connected = useChatStore((s) => s.connected);
  const myRole = useChatStore((s) => s.myRole);
  const switchMode = useChatStore((s) => s.switchMode);
  const rooms = useChatStore((s) => s.rooms);

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

  const room = rooms[relationshipId];
  const isWingman = myRole?.startsWith('wingman');

  // 军师：根据 myRole 直接取自己的 mode
  // 当事人：根据 wingmanId 匹配对应的 mode
  let currentWingmanMode: string | null = null;
  if (myRole === 'wingman1') {
    currentWingmanMode = room?.wingmanMode1 ?? null;
  } else if (myRole === 'wingman2') {
    currentWingmanMode = room?.wingmanMode2 ?? null;
  } else if (wingmanId) {
    if (room?.wingmanId1 === wingmanId) {
      currentWingmanMode = room.wingmanMode1;
    } else if (room?.wingmanId2 === wingmanId) {
      currentWingmanMode = room.wingmanMode2;
    }
  }

  // 当事人：始终显示主聊天 + 私聊
  // 军师：始终显示私聊；主聊天仅 ASSIST/SOLO 时显示
  const showMainPanel = !isWingman || currentWingmanMode !== 'PRIVATE';
  const showPrivatePanel = !!privateChatTargetId;

  // 模式切换：仅当事人可操作
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

          {/* Mode Switcher — 仅当事人可见，且角色已确认 */}
          {myRole && !isWingman && wingmanId && (
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
                    currentWingmanMode === opt.value
                      ? { background: '#ffffff', color: '#8ca0ff', boxShadow: '0 2px 8px rgba(140, 160, 255, 0.2)', fontWeight: 500 }
                      : { color: '#7a829a' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Wingman mode indicator — 仅军师可见 */}
          {isWingman && currentWingmanMode && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: 'rgba(212, 237, 164, 0.35)', color: '#5a7332', border: '1px solid rgba(212, 237, 164, 0.6)' }}
            >
              {currentWingmanMode === 'PRIVATE' ? '私聊模式' : currentWingmanMode === 'ASSIST' ? '辅助模式' : '代聊模式'}
            </span>
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
                draftMode={isWingman && currentWingmanMode === 'ASSIST'}
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
                targetUserId={privateChatTargetId}
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
