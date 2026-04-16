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
    <div className="shrink-0 border-t border-gray-200/60 bg-white">
      {showEmoji && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl p-1 rounded-lg hover:bg-light-gray transition-colors"
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
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-light-gray transition-colors text-lg"
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
          className="flex-1 min-w-0 h-9 px-3 rounded-full bg-light-gray text-sm text-near-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-apple-blue/30 transition-shadow"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-apple-blue text-white disabled:opacity-30 hover:bg-apple-blue-hover transition-colors"
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
