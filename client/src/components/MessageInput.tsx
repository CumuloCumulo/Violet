import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
}

const EMOJIS = [
  '😊', '😂', '🥰', '😍', '😘', '😏', '🤔', '😅',
  '❤️', '💕', '💗', '✨', '🎉', '👍', '👋', '🙏',
  '🔥', '💪', '😎', '🤗', '😭', '🥺', '😋', '🌟',
];

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const insertEmoji = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="shrink-0 border-t"
      style={{ background: '#0c0a14', borderColor: 'rgba(139, 92, 246, 0.1)' }}
    >
      {showEmoji && (
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(139, 92, 246, 0.08)' }}>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl p-1 rounded-lg transition-colors"
                style={{ color: '#f5f0ff' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setShowEmoji((v) => !v)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg"
          style={{ color: 'rgba(245, 240, 255, 0.5)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {showEmoji ? '⌨️' : '😊'}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1 min-w-0 h-9 px-3 rounded-full text-sm outline-none transition-shadow"
          style={{
            background: '#1a1525',
            color: '#f5f0ff',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.4)';
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
          style={{ background: '#8b5cf6', color: '#f5f0ff' }}
          onMouseEnter={(e) => { if (text.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6'; }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
