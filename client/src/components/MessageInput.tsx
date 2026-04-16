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

  // Sync recent from other tabs
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
      className="shrink-0 border-t"
      style={{ background: '#0c0a14', borderColor: 'rgba(139, 92, 246, 0.1)' }}
    >
      {showPicker && (
        <div
          className="px-3 py-2.5 border-b"
          style={{ borderColor: 'rgba(139, 92, 246, 0.08)' }}
        >
          {/* Recent */}
          {recent.length > 0 && (
            <div className="mb-2.5">
              <span className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(245, 240, 255, 0.3)' }}>
                最近
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded transition-colors"
                    style={{ color: '#f5f0ff' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.15)'; }}
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
              <span className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'rgba(245, 240, 255, 0.3)' }}>
                热门
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded transition-colors"
                    style={{ color: '#f5f0ff' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.15)'; }}
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
              {/* Category tabs */}
              <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(i)}
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full transition-colors"
                    style={
                      activeCategory === i
                        ? { background: '#8b5cf6', color: '#f5f0ff' }
                        : { background: 'rgba(139, 92, 246, 0.1)', color: 'rgba(245, 240, 255, 0.5)' }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {/* Category items */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES[activeCategory].items.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertKaomoji(k)}
                    className="text-sm px-1.5 py-0.5 rounded transition-colors"
                    style={{ color: '#f5f0ff' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.15)'; }}
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
            className="w-full text-[11px] mt-2 pt-1.5 border-t transition-colors"
            style={{ color: '#a78bfa', borderColor: 'rgba(139, 92, 246, 0.1)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c4b5fd'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
          >
            {expanded ? '收起' : '更多颜文字'}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => { setShowPicker((v) => !v); setExpanded(false); }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'rgba(245, 240, 255, 0.5)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
