import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Keyboard } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
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
    items: ['(￣ω￣)', '(*´▽`*)', '(￣▽￣")', '¯\\_(ツ)_/¯', '(°▽°)', '(≧◡≦)', '(─‿─)', '(◐‿◉)'],
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

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecent);
  const [activeCategory, setActiveCategory] = useState(0);
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

  return (
    <div
      className="shrink-0"
      style={{ borderTop: '1px solid rgba(140, 160, 255, 0.08)' }}
    >
      {showPicker && (
        <div
          className="px-3 py-2.5"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(140, 160, 255, 0.08)',
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
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-all"
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
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-all"
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
                        ? { background: '#8ca0ff', color: '#ffffff' }
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
                    className="text-sm px-1.5 py-0.5 rounded-lg transition-all"
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
            style={{ color: '#8ca0ff', borderTop: '1px solid rgba(140, 160, 255, 0.08)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6b82f0'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8ca0ff'; }}
          >
            {expanded ? '收起' : '更多颜文字'}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => { setShowPicker((v) => !v); setExpanded(false); }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all"
          style={{ color: '#7a829a' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(140, 160, 255, 0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#6b82f0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#7a829a';
          }}
        >
          {showPicker ? <Keyboard size={18} /> : <Smile size={18} />}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1 min-w-0 h-9 px-3 rounded-full text-sm outline-none transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            color: '#3a405a',
            border: '1px solid rgba(140, 160, 255, 0.12)',
            backdropFilter: 'blur(8px)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.35)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(140, 160, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(140, 160, 255, 0.12)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-30"
          style={{
            background: '#8ca0ff',
            color: '#ffffff',
            boxShadow: text.trim() ? '0 4px 12px rgba(140, 160, 255, 0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (text.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#7b90f0';
          }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8ca0ff'; }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
