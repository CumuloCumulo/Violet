import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Keyboard } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  accentColor?: 'violet' | 'green';
}

const STORAGE_KEY = 'violet-recent-kaomoji';
const MAX_RECENT = 6;

const CATEGORIES = [
  {
    name: '开心',
    items: ['(≧▽≦)', '(*^ω^*)', '(◕‿◕)', '(●\'◡\'●)', 'o(*≧▽≦)ツ', 'ヾ(≧▽≦*)o', '(ノ>ω<)ノ', '(*≧▽≦)', '(￣▽￣)', '(*^▽^*)'],
  },
  {
    name: '撒娇',
    items: ['(〃\'▽\'〃)', '(*╹▽╹*)', '(´▽`ʃ♡ƪ)', '╰(*´︶`*)╯', '(✿◡‿◡)', '(｡◕‿◕｡)', '(◕ᴗ◕✿)', '(✧◡✧)'],
  },
  {
    name: '害羞',
    items: ['(*/ω＼*)', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', '(///▽///)', '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)', '(〃∀〃)ゞ', '(///￣ ￣///)', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)'],
  },
  {
    name: '生气',
    items: ['(╯°□°)╯', '(￣^￣)', '(╬ Ò ‸ Ó)', '(ꐦ°᷄д°᷅)', '(╬￣皿￣)', '(°ㅂ°╬)'],
  },
  {
    name: '哭泣',
    items: ['(╥﹏╥)', '(ಥ_ಥ)', '(Ｔ▽Ｔ)', 'o(╥﹏╥)o', '(ಥ﹏ಥ)', '(╥_╥)', '(>_<)'],
  },
  {
    name: '其他',
    items: ['(￣ω￣)', '(*´▽`*)', '(￣▽￣\")', '¯\\_(ツ)_/¯', '(°▽°)', '(≧◡≦)', '(─‿─)', '(◐‿◉)'],
  },
];

const POPULAR = [
  '(≧▽≦)', '(◕‿◕)', '(●\'◡\'●)', '(*/ω＼*)', 'o(*≧▽≦)ツ', 'ヾ(≧▽≦*)o',
  '(〃\'▽\'〃)', '(╥﹏╥)', '(╯°□°)╯', '(´▽`ʃ♡ƪ)', '(*^ω^*)', '(ノ>ω<)ノ',
];

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(kaomoji: string) {
  const prev = getRecent().filter((k) => k !== kaomoji);
  const next = [kaomoji, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function MessageInput({ onSend, accentColor = 'violet' }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecent);
  const [activeCategory, setActiveCategory] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecent(getRecent());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowPicker(false);
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

  const insertKaomoji = useCallback((kaomoji: string) => {
    setText((prev) => prev + kaomoji);
    saveRecent(kaomoji);
    setRecent(getRecent());
    inputRef.current?.focus();
  }, []);

  const isGreen = accentColor === 'green';

  // Per-reference: wingman input bg is more transparent
  const capsuleBg = isGreen
    ? (focused ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)')
    : (focused ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)');
  const capsuleShadow = focused
    ? 'inset 0 2px 4px rgba(0,0,0,0.01), 0 8px 24px rgba(140, 160, 255, 0.15)'
    : 'inset 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.03)';

  const sendBg = isGreen ? '#d4eda4' : '#8ca0ff';
  const sendBgHover = isGreen ? '#c4dda0' : '#758cf0';
  const sendColor = isGreen ? '#5a7332' : '#ffffff';
  const sendShadow = isGreen
    ? '0 4px 10px rgba(212, 237, 164, 0.4)'
    : '0 4px 10px rgba(140, 160, 255, 0.4)';

  return (
    <div
      className="shrink-0 px-6 py-4"
      style={{
        background: 'linear-gradient(to top, rgba(255,255,255,0.4), transparent)',
      }}
    >
      {showPicker && (
        <div
          className="mb-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          {/* Recent */}
          {recent.length > 0 && (
            <div className="mb-2.5">
              <span className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: '#9e98aa' }}>
                最近
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-colors"
                    style={{ color: '#3a405a' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular */}
          {!expanded && (
            <div>
              <span className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: '#9e98aa' }}>
                热门
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-colors"
                    style={{ color: '#3a405a' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expanded categories */}
          {expanded && (
            <div>
              <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(i)}
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full transition-all"
                    style={
                      activeCategory === i
                        ? { background: sendBg, color: sendColor }
                        : { background: 'rgba(140, 160, 255, 0.1)', color: '#5a627a' }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES[activeCategory].items.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-colors"
                    style={{ color: '#3a405a' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.12)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle expand */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-[11px] mt-2 pt-1.5 transition-colors"
            style={{ color: sendBg, borderTop: '1px solid rgba(140, 160, 255, 0.08)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sendBgHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sendBg; }}
          >
            {expanded ? '收起' : '更多颜文字'}
          </button>
        </div>
      )}

      {/* Input capsule — matches reference .input-box exactly */}
      <div
        className="flex items-center rounded-[30px] transition-all"
        style={{
          background: capsuleBg,
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: capsuleShadow,
          padding: '6px 6px 6px 20px',
        }}
      >
        <button
          onClick={() => { setShowPicker((v) => !v); setExpanded(false); }}
          className="shrink-0 flex items-center justify-center p-2 transition-colors bg-transparent border-none"
          style={{ color: '#7a829a' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sendBg; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7a829a'; }}
        >
          {showPicker ? <Keyboard size={18} /> : <Smile size={18} />}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isGreen ? '向军师求助...' : '输入你想对TA说的话...'}
          className="flex-1 min-w-0 border-none bg-transparent outline-none text-sm"
          style={{ color: '#3a405a', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all disabled:opacity-30 border-none"
          style={{
            background: sendBg,
            color: sendColor,
            boxShadow: sendShadow,
          }}
          onMouseEnter={(e) => {
            if (text.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = sendBgHover;
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = sendBg;
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          <Send size={16} style={{ marginLeft: -2 }} />
        </button>
      </div>
    </div>
  );
}
