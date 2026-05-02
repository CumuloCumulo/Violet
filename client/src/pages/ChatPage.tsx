import { useEffect, useCallback, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChatStore } from '../stores/chatStore';
import { ChatPanel } from '../components/ChatPanel';
import { WingmanPanel } from '../components/WingmanPanel';
import { useToast, ToastContainer } from '../components/Toast';

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
  const roomClosedReason = useChatStore((s) => s.roomClosedReason);
  const roomClosedRelId = useChatStore((s) => s.roomClosedRelId);
  const isReadOnly = useChatStore((s) => s.isReadOnly);
  const flirtingProposal = useChatStore((s) => s.flirtingProposal);
  const transitionStatus = useChatStore((s) => s.transitionStatus);
  const clearFlirtingProposal = useChatStore((s) => s.clearFlirtingProposal);
  const exchangedContact = useChatStore((s) => s.exchangedContact);
  const { toasts, showToast, removeToast } = useToast();

  const [relationshipStatus] = useState<string>('ICEBREAKING');

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

  // Derive wingmanId for the current client's side
  // client1 ↔ wingman1, client2 ↔ wingman2
  const effectiveWingmanId = wingmanId ?? (
    myRole === 'client1' ? (room?.wingmanId1 ?? undefined)
    : myRole === 'client2' ? (room?.wingmanId2 ?? undefined)
    : undefined
  );

  // Private chat target: each person chats with their own side's wingman/client
  // client1 → wingman1, client2 → wingman2
  // wingman1 → client1, wingman2 → client2
  const effectivePrivateTargetId = privateChatTargetId ?? (
    myRole === 'client1' ? (room?.wingmanId1 ?? undefined)
    : myRole === 'client2' ? (room?.wingmanId2 ?? undefined)
    : myRole === 'wingman1' ? (room?.client1Id ?? undefined)
    : myRole === 'wingman2' ? (room?.client2Id ?? undefined)
    : effectiveWingmanId
  );

  // 军师：根据 myRole 直接取自己的 mode
  // 当事人：根据 wingmanId 匹配对应的 mode
  let currentWingmanMode: string | null = null;
  if (myRole === 'wingman1') {
    currentWingmanMode = room?.wingmanMode1 ?? null;
  } else if (myRole === 'wingman2') {
    currentWingmanMode = room?.wingmanMode2 ?? null;
  } else if (effectiveWingmanId) {
    if (room?.wingmanId1 === effectiveWingmanId) {
      currentWingmanMode = room.wingmanMode1;
    } else if (room?.wingmanId2 === effectiveWingmanId) {
      currentWingmanMode = room.wingmanMode2;
    }
  }

  // 当事人：始终显示主聊天 + 私聊
  // 军师：始终显示私聊；主聊天仅 ASSIST/SOLO 时显示
  const showMainPanel = !isWingman || currentWingmanMode !== 'PRIVATE';
  const showPrivatePanel = !!effectivePrivateTargetId;

  // 模式切换：仅当事人可操作
  const handleModeSwitch = useCallback(
    (mode: string) => {
      if (effectiveWingmanId) {
        switchMode(relationshipId, effectiveWingmanId, mode);
      }
    },
    [relationshipId, effectiveWingmanId, switchMode],
  );

  const modeOptions = [
    { value: 'SOLO', label: '代聊' },
    { value: 'PRIVATE', label: '私聊' },
    { value: 'ASSIST', label: '辅助' },
  ];

  const handleAcceptFlirting = () => {
    transitionStatus(relationshipId, 'FLIRTING');
    clearFlirtingProposal();
  };

  const handleRejectFlirting = () => {
    clearFlirtingProposal();
  };

  // Room closed — exit and show overlay
  // Only apply roomClosedReason when it belongs to THIS room
  const isRoomClosed = roomClosedRelId === relationshipId;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('已复制', 'success')).catch(() => {});
  };

  if (isRoomClosed && (roomClosedReason === 'FLIRTING' || roomClosedReason === 'ENDED')) {
    const isFlirting = roomClosedReason === 'FLIRTING';
    return (
      <div className="h-screen flex items-center justify-center p-4 relative">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="ambient-bg">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <motion.div
          className="glass-float w-[400px] p-8 text-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isFlirting && <div className="text-4xl">🎉</div>}
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: isFlirting ? '#c47d8e' : '#7a829a', fontWeight: 600 }}>
            {isFlirting ? '恭喜进入暧昧期！' : '聊天已结束'}
          </h2>
          {isFlirting && exchangedContact && (
            <div className="text-left space-y-3">
              <div className="text-sm font-medium" style={{ color: '#3a405a' }}>对方的联系方式</div>
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: '#7a829a', width: 36 }}>微信</span>
                {exchangedContact.wechat ? (
                  <>
                    <span className="text-sm flex-1" style={{ color: '#3a405a' }}>{exchangedContact.wechat}</span>
                    <button
                      onClick={() => handleCopy(exchangedContact.wechat!)}
                      className="text-xs px-2 py-1 rounded-lg cursor-pointer"
                      style={{ background: 'rgba(140,160,255,0.1)', color: '#8ca0ff', border: 'none' }}
                    >复制</button>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: '#b0a8ba' }}>对方未设置</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: '#7a829a', width: 36 }}>QQ</span>
                {exchangedContact.qq ? (
                  <>
                    <span className="text-sm flex-1" style={{ color: '#3a405a' }}>{exchangedContact.qq}</span>
                    <button
                      onClick={() => handleCopy(exchangedContact.qq!)}
                      className="text-xs px-2 py-1 rounded-lg cursor-pointer"
                      style={{ background: 'rgba(140,160,255,0.1)', color: '#8ca0ff', border: 'none' }}
                    >复制</button>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: '#b0a8ba' }}>对方未设置</span>
                )}
              </div>
            </div>
          )}
          {isFlirting && !exchangedContact && (
            <p className="text-sm" style={{ color: '#5a627a' }}>
              可在关系列表中查看聊天记录
            </p>
          )}
          <button
            onClick={onExit}
            className="w-full h-10 rounded-2xl text-sm font-medium cursor-pointer"
            style={{ background: '#8ca0ff', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(140,160,255,0.3)' }}
          >
            返回
          </button>
        </motion.div>
      </div>
    );
  }

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
          {myRole && !isWingman && effectiveWingmanId && (
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

        {/* Chat Panels + Wingman Panel */}
        <div className="flex-1 flex min-h-0 relative">
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
                  readOnly={isReadOnly}
                  placeholder={isWingman ? '输入你想对当事人说的话...' : '输入你想对TA说的话...'}
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
                  targetUserId={effectivePrivateTargetId}
                  myUserId={userId}
                  accentColor="green"
                  readOnly={isReadOnly}
                  placeholder={isWingman ? '向当事人发送消息...' : '向军师求助...'}
                />
              </div>
            )}
          </div>

          {/* Wingman Panel — collapsible side panel */}
          {!isWingman && (
            <WingmanPanel
              relationshipId={relationshipId}
              userId={userId}
              isWingman={false}
              myRole={myRole ?? undefined}
              wingmanId1={room?.wingmanId1 ?? null}
              wingmanId2={room?.wingmanId2 ?? null}
              wingmanMode1={room?.wingmanMode1 ?? null}
              wingmanMode2={room?.wingmanMode2 ?? null}
              relationshipStatus={relationshipStatus}
            />
          )}
        </div>
      </div>

      {/* Flirting Proposal Modal */}
      <AnimatePresence>
        {flirtingProposal && flirtingProposal.relationshipId === relationshipId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(58, 64, 90, 0.3)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-3xl p-6 w-full max-w-xs space-y-4"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 20px 50px rgba(196,125,142,0.2)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center text-3xl">💕</div>
              <p className="text-sm text-center" style={{ color: '#3a405a' }}>
                对方希望进入暧昧期，<br />交换联系方式？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectFlirting}
                  className="flex-1 h-10 rounded-2xl text-sm cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.45)', color: '#7a829a', border: '1px solid rgba(255,255,255,0.7)' }}
                >
                  再想想
                </button>
                <button
                  onClick={handleAcceptFlirting}
                  className="flex-1 h-10 rounded-2xl text-sm font-medium cursor-pointer"
                  style={{ background: '#c47d8e', color: '#fff', boxShadow: '0 6px 20px rgba(196,125,142,0.3)', border: 'none' }}
                >
                  同意
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
