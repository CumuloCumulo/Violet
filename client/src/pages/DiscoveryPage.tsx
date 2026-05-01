import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { apiFetch } from '../lib/api';
import '../discovery-gallery.css';

gsap.registerPlugin(ScrollTrigger);

// ─── Types ──────────────────────────────────────────────────

interface DiscoverUser {
  id: string;
  gender: string | null;
  campus: string | null;
  grade: string | null;
  interests: string[];
  declaration: string | null;
  isActive: boolean;
  lastActiveAt: string;
  avatar: string | null;
}

interface MatchRequestWithUser {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  fromUser?: DiscoverUser;
  toUser?: DiscoverUser;
}

interface RelationshipInfo {
  id: string;
  status: string;
  role: 'client' | 'wingman';
  createdAt: string;
  otherUser?: {
    id: string; nickname: string; gender: string | null; campus: string | null;
    grade: string | null; interests: string[]; declaration: string | null;
    wechat: string | null; qq: string | null; avatar: string | null;
  };
  myWingman?: { id: string; nickname: string; mode: string } | null;
  otherWingman?: { id: string; nickname: string; mode: string } | null;
  wingmanSide?: number;
  wingmanMode?: string;
  client1?: { id: string; nickname: string; gender: string | null; campus: string | null; grade: string | null; interests: string[]; declaration: string | null; avatar: string | null };
  client2?: { id: string; nickname: string; gender: string | null; campus: string | null; grade: string | null; interests: string[]; declaration: string | null; avatar: string | null };
}

type Tab = 'discover' | 'sent' | 'received' | 'relationships';

// ─── Aura Gradients ─────────────────────────────────────────

const AURA_FEMALE: [string, string][] = [
  ['#fecfef', '#ff9a9e'],
  ['#fbc2eb', '#a6c1ee'],
  ['#fecfef', '#a6c1ee'],
];
const AURA_MALE: [string, string][] = [
  ['#a1c4fd', '#c2e9fb'],
  ['#d4eda4', '#a1c4fd'],
  ['#d4eda4', '#c2e9fb'],
];
const AURA_OTHER: [string, string][] = [
  ['#a1c4fd', '#c2e9fb'],
  ['#d4eda4', '#c2e9fb'],
];

function getAuraGradient(userId: string, gender: string | null): [string, string] {
  const pool = gender === 'female' ? AURA_FEMALE : gender === 'male' ? AURA_MALE : AURA_OTHER;
  return pool[userId.charCodeAt(userId.length - 1) % pool.length];
}

// timeAgo kept for potential future use in card status
// timeAgo utility reserved for future card status display
void function _timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return '刚刚活跃';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return '1天前';
};

// ─── Constants ──────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  discover: '发现', sent: '已发起', received: '收到心动', relationships: '关系',
};

const STAT_ITEMS = [
  { label: '活跃灵魂', value: '128', progress: 0.82 },
  { label: '今日心动', value: '43', progress: 0.54 },
  { label: '已成功匹配', value: '17', progress: 0.35 },
  { label: '覆盖校区', value: '3', progress: 0.25 },
  { label: '平均破冰时长', value: '4.2h', progress: 0.45 },
];

// Track rows cycle for clip-deco vertical variety
const CLIP_TRACK_ROWS = [8, 3, 9, 7, 5, 3, 8, 5, 3, 8, 5];

// Track index cycle for soul card vertical offset
const TI_CYCLE = [0, 3, 1, 2, 4, 1];

// ─── Seeded random for consistent decorations ───────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════

export function DiscoveryPage() {
  const user = useAuthStore((s) => s.user);
  const enterChat = useAuthStore((s) => s.enterChat);
  const logout = useAuthStore((s) => s.logout);
  const setPage = useAuthStore((s) => s.setPage);
  const connect = useChatStore((s) => s.connect);
  const joinRoom = useChatStore((s) => s.joinRoom);

  const [tab, setTab] = useState<Tab>('discover');
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sentRequests, setSentRequests] = useState<MatchRequestWithUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MatchRequestWithUser[]>([]);
  const [relationships, setRelationships] = useState<RelationshipInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<DiscoverUser | null>(null);

  // ── API Fetches ──────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ users: DiscoverUser[]; total: number }>('/discovery/users');
      setUsers(res.users);
      setTotalUsers(res.total);
    } catch {}
    setLoading(false);
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const res = await apiFetch<MatchRequestWithUser[]>('/discovery/match-requests/sent');
      setSentRequests(res);
    } catch {}
  }, []);

  const fetchReceived = useCallback(async () => {
    try {
      const res = await apiFetch<MatchRequestWithUser[]>('/discovery/match-requests/received');
      setReceivedRequests(res);
    } catch {}
  }, []);

  const fetchRelationships = useCallback(async () => {
    try {
      const res = await apiFetch<RelationshipInfo[]>('/discovery/relationships');
      setRelationships(res);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'discover') fetchUsers();
    else if (tab === 'sent') fetchSent();
    else if (tab === 'received') fetchReceived();
    else fetchRelationships();
  }, [tab, fetchUsers, fetchSent, fetchReceived, fetchRelationships]);

  useEffect(() => { fetchReceived(); }, [fetchReceived]);

  // ── Actions ──────────────────────────────────────────────

  const sendMatchRequest = async (toUserId: string) => {
    setConfirmTarget(null);
    setActionError('');
    try {
      await apiFetch('/discovery/match-request', { method: 'POST', body: JSON.stringify({ toUserId }) });
      fetchUsers();
    } catch (e: any) { setActionError(e.message); }
  };

  const acceptRequest = async (id: string) => {
    setActionError('');
    try {
      const res = await apiFetch<{ relationship: { id: string } }>(`/discovery/match-request/${id}/accept`, { method: 'POST' });
      connect(user!.id);
      setTimeout(() => { joinRoom(res.relationship.id); enterChat(res.relationship.id); }, 300);
    } catch (e: any) { setActionError(e.message); }
  };

  const rejectRequest = async (id: string) => {
    setActionError('');
    try { await apiFetch(`/discovery/match-request/${id}/reject`, { method: 'POST' }); fetchReceived(); }
    catch (e: any) { setActionError(e.message); }
  };

  const handleEnterRelationship = (relId: string) => {
    connect(user!.id);
    setTimeout(() => { joinRoom(relId); enterChat(relId); }, 300);
  };

  // ── Gallery Refs ─────────────────────────────────────────

  const galleryRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipsRef = useRef<HTMLDivElement>(null);
  const wapperRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // ── Nav entrance (independent of gallery, never reverted on tab switch) ──
  useEffect(() => {
    const nav = navRef.current;
    if (nav) gsap.to(nav, { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' });
  }, []);

  // ── GSAP Gallery Effect ──────────────────────────────────

  useEffect(() => {
    if (tab !== 'discover') return;

    const container = containerRef.current;
    const clips = clipsRef.current;
    const wapper = wapperRef.current;
    const gallery = galleryRef.current;
    const scrollbar = scrollbarRef.current;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    const nav = navRef.current;
    if (!container || !clips || !wapper || !gallery || !scrollbar || !thumb || !track || !nav) return;

    let lenis: Lenis | null = null;
    const revealedCards = new Set<number>();
    const sectionRevealed: Record<string, boolean> = {};

    const ctx = gsap.context(() => {
      // ── Allow body to scroll freely (gallery needs wapper to set scroll height) ──
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overflowY = 'auto';

      // ── Lenis ──
      try {
        lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((t) => lenis!.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      } catch {}

      // ── Build Track Lines ──
      track.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const line = document.createElement('div');
        line.className = 'track-line';
        track.appendChild(line);
      }

      // ── Build Header Blocks ──
      const blocksEl = container.querySelector('.sec-header-blocks');
      if (blocksEl) {
        blocksEl.innerHTML = '';
        const rng = seededRandom(42);
        for (let i = 0; i < 20; i++) {
          const b = document.createElement('div');
          b.style.setProperty('--o', String(Math.floor(rng() * 10) + 1));
          blocksEl.appendChild(b);
        }
      }

      // ── Build About Blocks ──
      const aboutBlocksEl = container.querySelector('.sec-about-blocks');
      if (aboutBlocksEl) {
        aboutBlocksEl.innerHTML = '';
        const rng = seededRandom(77);
        for (let i = 0; i < 8; i++) {
          const b = document.createElement('div');
          b.style.setProperty('--d', (rng() * 2).toFixed(2) + 's');
          aboutBlocksEl.appendChild(b);
        }
      }

      // ── Dimensions, Clips & Scroll Setup ──
      function setup() {
        ScrollTrigger.getAll().forEach((t) => t.kill());

        const c = container!;
        const w = wapper!;
        const th = thumb!;
        const sb = scrollbar!;
        const cl = clips!;

        const totalWidth = c.scrollWidth;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = totalWidth - vw;
        const trackHeight = vh - 8 * (Math.min(vw, vh) / 100);

        // ── Build Clip Decorations (distributed across full scrollable width) ──
        cl.style.width = totalWidth + 'px';
        cl.innerHTML = '';
        const clipRng = seededRandom(123);
        const clipCount = Math.max(4, Math.min(14, Math.round(totalWidth / (vw * 0.35))));
        for (let i = 0; i < clipCount; i++) {
          const el = document.createElement('div');
          el.className = 'clip-deco';

          const baseCx = ((i + 0.5) / clipCount) * 100;
          const jitter = (clipRng() - 0.5) * (60 / clipCount);
          const cx = Math.max(2, Math.min(98, baseCx + jitter));
          const cy = CLIP_TRACK_ROWS[i % CLIP_TRACK_ROWS.length];

          el.style.setProperty('--cx', cx.toFixed(1) + '%');
          el.style.setProperty('--cy', String(cy));

          const svgW = 20 + clipRng() * 15;
          const lineCount = Math.floor(svgW / 0.3);
          let lines = '';
          for (let j = 0; j < lineCount; j++) {
            const x = (j / lineCount) * svgW;
            const amp = 1 + Math.sin(x * 0.8) * 0.5 + (clipRng() - 0.5) * 1.2;
            const y1 = 5 - amp, y2 = 5 + amp;
            lines += `<line x1="${x.toFixed(1)}" y1="${y1.toFixed(2)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(2)}" vector-effect="non-scaling-stroke"/>`;
          }
          el.innerHTML = `<svg viewBox="0 0 ${svgW.toFixed(0)} 10">${lines}</svg>`;
          cl.appendChild(el);
        }

        w.style.height = maxX + vh + 'px';
        const thumbH = Math.max(30, (vh / (maxX + vh)) * trackHeight);
        th.style.setProperty('--thumb-h', String(thumbH));

        ScrollTrigger.create({
          trigger: gallery,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(c, { x: -p * maxX });
            gsap.set(cl, { x: -p * maxX * 0.1 });
            th.style.setProperty('--thumb-h', String(thumbH));
            th.style.setProperty('--thumb-y', String(p * (trackHeight - thumbH)));
            if (p > 0.001) sb.classList.add('visible');
            checkCardReveals(-p * maxX, vw);
            checkSectionReveals(-p * maxX, vw);
          },
        });
      }

      // ── Card Reveal ──
      function checkCardReveals(containerX: number, vw: number) {
        const cards = container!.querySelectorAll('.soul-card');
        cards.forEach((card, i) => {
          if (revealedCards.has(i)) return;
          const cardLeft = (card as HTMLElement).offsetLeft + containerX + parseFloat(getComputedStyle(container!).paddingLeft);
          if (cardLeft < vw * 0.85) {
            revealedCards.add(i);
            revealCard(card as HTMLElement);
          }
        });
      }

      function revealCard(card: HTMLElement) {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        const aura = card.querySelector('.soul-card-aura');
        const quoteEl = card.querySelector('.soul-card-quote');
        const quoteLines = card.querySelectorAll('.soul-card-quote .lw div');
        const cross = card.querySelector('.soul-card-cross div');
        const tagsEl = card.querySelector('.soul-card-tags');
        const tagLines = card.querySelectorAll('.soul-card-tags .lw div');
        const meta = card.querySelector('.soul-card-meta p');

        tl.to(aura, { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 0.9, ease: 'power2.inOut' }, 0);
        tl.to(meta, { y: 0, duration: 0.5 }, 0.3);
        tl.to(quoteEl, { opacity: 1, duration: 0.01 }, 0.4);
        tl.to(quoteLines, { y: 0, stagger: 0.08, duration: 0.5 }, 0.4);
        tl.to(cross, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, 0.5);
        tl.to(tagsEl, { opacity: 1, duration: 0.01 }, 0.55);
        tl.to(tagLines, { y: 0, stagger: 0.06, duration: 0.4 }, 0.55);
      }

      // ── Section Reveals ──
      function checkSectionReveals(containerX: number, vw: number) {
        const paddingLeft = parseFloat(getComputedStyle(container!).paddingLeft);
        const sections: { key: string; sel: string; anim: () => void }[] = [
          { key: 'featured', sel: '.sec-featured', anim: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl.to('.sec-featured-tip > div', { x: 0, duration: 0.6 }, 0);
            tl.to('.sec-featured-aura', { scale: 1, duration: 0.8 }, 0.1);
            tl.to('.sec-featured-edges', { opacity: 0.5, scale: 1, duration: 0.6 }, 0.3);
            tl.to('.sec-featured-aura-glass .quote', { opacity: 1, duration: 0.6 }, 0.4);
            tl.to('.sec-featured-aura-glass .author', { opacity: 1, duration: 0.5 }, 0.6);
          }},
          { key: 'about', sel: '.sec-about', anim: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl.to('.sec-about-tip p', { y: 0, duration: 0.7 }, 0);
            tl.to('.sec-about-content', { opacity: 1, duration: 0.6 }, 0.2);
            tl.to('.sec-about-blocks div', { opacity: 1, stagger: 0.06, duration: 0.3 }, 0.4);
          }},
          { key: 'stats', sel: '.sec-stats', anim: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl.to('.sec-stats-title div', { y: 0, duration: 0.5 }, 0);
            tl.to('.stat-row > div', { y: 0, stagger: 0.1, duration: 0.5 }, 0.2);
            tl.to('.stat-row-bar div', { scaleX: (_i: number, el: Element) => (el as HTMLElement).style.getPropertyValue('--p') || '0.5', stagger: 0.1, duration: 0.8, ease: 'power2.out' }, 0.5);
          }},
          { key: 'souls', sel: '.sec-souls', anim: () => {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
            tl.to('.sec-souls-title svg', { x: 0, duration: 0.5 }, 0);
            tl.to('.sec-souls-title-content p', { y: 0, stagger: 0.1, duration: 0.5 }, 0.1);
          }},
        ];
        for (const sec of sections) {
          if (sectionRevealed[sec.key]) continue;
          const el = container!.querySelector(sec.sel) as HTMLElement | null;
          if (!el) continue;
          const x = el.offsetLeft + containerX + paddingLeft;
          if (x < vw * (sec.key === 'souls' ? 0.9 : 0.8)) {
            sectionRevealed[sec.key] = true;
            sec.anim();
          }
        }
      }

      // ── Entrance Animation ──
      function entranceAnimation() {
        const masterTL = gsap.timeline({ delay: 0.3, defaults: { ease: 'power2.out' } });
        masterTL.to('.track-line', { scaleX: 1, stagger: 0.05, duration: 0.8, ease: 'power2.inOut' }, 0);
        masterTL.to('.playhead-line', { scaleY: 1, duration: 1, ease: 'power2.inOut' }, 0.3);
        masterTL.to('.sec-header-eyebrow p', { y: 0, duration: 0.6 }, 0.6);
        masterTL.to('.sec-header-title .line-1 p', { y: 0, duration: 0.8 }, 0.7);
        masterTL.to('.sec-header-title .line-2 p', { y: 0, duration: 0.8 }, 0.85);
        masterTL.to('.sec-header-desc p', { y: 0, duration: 0.6 }, 1.0);
        masterTL.to('.sec-header-blocks div', { opacity: 1, stagger: 0.03, duration: 0.3 }, 1.1);
        masterTL.to('.clip-deco', { opacity: 1, x: 0, stagger: 0.06, duration: 0.6 }, 0.8);
        masterTL.add(() => scrollbar!.classList.add('visible'), 1.5);

        const featured = container!.querySelector('.sec-featured') as HTMLElement | null;
        if (featured && featured.offsetLeft < window.innerWidth) {
          masterTL.to('.sec-featured-tip > div', { x: 0, duration: 0.6 }, 1.2);
          masterTL.to('.sec-featured-aura', { scale: 1, duration: 0.8 }, 1.3);
          masterTL.to('.sec-featured-edges', { opacity: 0.5, scale: 1, duration: 0.6 }, 1.5);
          masterTL.to('.sec-featured-aura-glass .quote', { opacity: 1, duration: 0.6 }, 1.6);
          masterTL.to('.sec-featured-aura-glass .author', { opacity: 1, duration: 0.5 }, 1.8);
        }
      }

      setup();
      entranceAnimation();

      const onResize = () => {
        revealedCards.clear();
        Object.keys(sectionRevealed).forEach((k) => delete sectionRevealed[k]);
        setup();
        ScrollTrigger.refresh();
      };
      window.addEventListener('resize', onResize);
    });

    return () => {
      ctx.revert();
      if (lenis) {
        gsap.ticker.remove((lenis.raf as any));
        lenis.destroy();
      }
      // Restore body styles
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = '';
      document.body.style.height = '';
    };
  }, [tab, users]);

  // ── Pick a featured quote ────────────────────────────────

  const featuredQuote = users.find((u) => u.declaration && u.declaration.length > 4);

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <>
      {/* ── Nav Bar ── */}
      <nav className="dg-nav-bar" ref={navRef}>
        <div className="dg-nav-left">
          <div className="dg-nav-logo">Violet</div>
          <div className="dg-nav-tabs">
            {(['discover', 'sent', 'received', 'relationships'] as Tab[]).map((t) => (
              <button
                key={t}
                className={`dg-nav-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {TAB_LABELS[t]}
                {t === 'received' && receivedRequests.length > 0 && (
                  <span className="dg-nav-badge">{receivedRequests.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="dg-nav-right">
          <span className="dg-nav-score">{user?.creditScore ?? 0} 分</span>
          {user?.roles.includes('WINGMAN') && (
            <button className="dg-nav-btn btn-junshi" onClick={() => setPage('wingman-hall')}>军师大厅</button>
          )}
          {user?.roles.includes('ADMIN') && (
            <button className="dg-nav-btn btn-admin" onClick={() => setPage('admin')}>管理</button>
          )}
          <button className="dg-nav-btn btn-profile" onClick={() => setPage('profile')}>个人中心</button>
          <button className="dg-nav-btn btn-logout" onClick={logout}>退出</button>
        </div>
      </nav>

      {/* ── Error ── */}
      {actionError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
          background: 'rgba(196,125,142,0.15)', color: '#c47d8e', padding: '8px 20px', borderRadius: 20,
          fontSize: 12, backdropFilter: 'blur(12px)', border: '1px solid rgba(196,125,142,0.2)',
        }}>
          {actionError}
        </div>
      )}

      {/* ── Gallery (discover tab) ── */}
      {tab === 'discover' && (
        <div className="dg">
          <div className="scrollbar" ref={scrollbarRef}><div className="scrollbar-thumb" ref={thumbRef} /></div>

          <section className="gallery" ref={galleryRef}>
            <div className="track" ref={trackRef} />
            <div className="playhead"><div className="playhead-line" /></div>

            <div className="wapper" ref={wapperRef}>
              <div className="container" ref={containerRef}>
                <div className="container-clips" ref={clipsRef} />

                {/* Header */}
                <div className="sec-header">
                  <div className="sec-header-eyebrow"><p>Violet · Discovery</p></div>
                  <div className="sec-header-title">
                    <div className="line-wrap line-1"><p>Soul</p></div>
                    <div className="line-wrap line-2"><p>Gallery</p></div>
                  </div>
                  <div className="sec-header-desc">
                    <p>每一个灵魂都值得被看见。在这里，没有照片，没有标签的偏见——只有心声与光晕，等待一场温柔的共鸣。</p>
                  </div>
                  <div className="sec-header-blocks" />
                </div>

                {/* Featured */}
                <div className="sec-featured">
                  <div className="sec-featured-tip">
                    <div>
                      <div className="dot" />
                      <p>Featured</p>
                    </div>
                  </div>
                  <div className="sec-featured-aura">
                    <div className="sec-featured-aura-inner" />
                    <div className="sec-featured-aura-glass">
                      <div className="quote">
                        "{featuredQuote?.declaration ?? '有一种浪漫的爱\n是浪费时间'}"
                      </div>
                      <div className="author">
                        —— {featuredQuote?.campus ?? '仙林校区'} · 某位灵魂
                      </div>
                    </div>
                    <div className="sec-featured-edges" />
                  </div>
                </div>

                {/* About */}
                <div className="sec-about">
                  <div className="sec-about-tip"><p>About</p></div>
                  <div className="sec-about-content">
                    <p>Violet 是一场发生在校园里的浪漫实验。我们相信：真正的心动不需要滤镜。在这个匿名的灵魂画廊中，你看到的不是外貌，而是思想的光谱、性格的温度、和藏在文字里的真诚。每一张卡片都是一扇半掩的门——推开它，也许就是一段故事的开始。</p>
                  </div>
                  <div className="sec-about-blocks" />
                </div>

                {/* Stats */}
                <div className="sec-stats">
                  <div className="sec-stats-title">
                    <div>
                      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                      <p>Campus Pulse</p>
                    </div>
                  </div>
                  {STAT_ITEMS.map((item, i) => (
                    <div className="stat-row" key={i}>
                      <div>
                        <div className="stat-row-label">
                          <p>{item.label}</p>
                          <span>{i === 0 ? totalUsers || item.value : item.value}</span>
                        </div>
                        <div className="stat-row-bar">
                          <div style={{ '--p': item.progress } as React.CSSProperties} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Soul Cards */}
                <div className="sec-souls">
                  <div className="sec-souls-title">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    <div className="sec-souls-title-content">
                      <div className="tw"><p>Soul Cards</p></div>
                      <div className="tw"><p style={{ color: 'var(--ink-muted)', fontSize: 'calc(var(--scale) * 1.4vmin)' }}>滑动探索每一个灵魂</p></div>
                    </div>
                  </div>
                  <div className="souls-box">
                    {loading ? (
                      <p style={{ fontSize: 'calc(var(--scale) * 1.6vmin)', color: 'var(--ink-muted)' }}>加载中...</p>
                    ) : users.length === 0 ? (
                      <p style={{ fontSize: 'calc(var(--scale) * 1.6vmin)', color: 'var(--ink-muted)' }}>暂无活跃灵魂</p>
                    ) : (
                      users.map((u, i) => {
                        const [g0, g1] = getAuraGradient(u.id, u.gender);
                        const quote = u.declaration ?? '...';
                        return (
                          <div
                            key={u.id}
                            className="soul-card"
                            style={{ '--ti': TI_CYCLE[i % TI_CYCLE.length], '--cd': (i * 0.3 % 2).toFixed(1) } as React.CSSProperties}
                            onClick={() => setConfirmTarget(u)}
                          >
                            <div className="soul-card-aura" style={{ '--aura': `linear-gradient(135deg,${g0},${g1})` } as React.CSSProperties}>
                              <div className="soul-card-aura-bg" style={{ background: `linear-gradient(135deg,${g0},${g1})` }} />
                              <div className="soul-card-aura-glass" />
                              <span className="gender-icon">{u.gender === 'female' ? '♀' : u.gender === 'male' ? '♂' : '?'}</span>
                            </div>
                            <div className="soul-card-content">
                              <div className="soul-card-meta">
                                <p>{u.campus ?? ''}{u.campus && u.grade ? ' · ' : ''}{u.grade ?? ''}</p>
                              </div>
                              <div className="soul-card-quote">
                                {quote.split('\n').map((line, li) => (
                                  <div className="lw" key={li}><div>{line}</div></div>
                                ))}
                              </div>
                              <div className="soul-card-cross" style={{ '--cd': (i * 0.3 % 2).toFixed(1) } as React.CSSProperties}>
                                <div />
                              </div>
                              <div className="soul-card-tags">
                                <div className="lw">
                                  <div>
                                    {u.interests.slice(0, 5).map((tag) => (
                                      <span className="tag" key={tag}>{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab Content (non-discover) ── */}
      {tab !== 'discover' && (
        <div className="dg-tab-content">
          <div className="dg-tab-grid">
            {tab === 'sent' && (
              sentRequests.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', gridColumn: '1/-1', padding: 48 }}>
                  还没有发起过牵线
                </p>
              ) : (
                sentRequests.map((r) => {
                  const u = r.toUser!;
                  const [g0, g1] = getAuraGradient(u.id, u.gender);
                  const statusInfo: Record<string, { text: string; color: string }> = {
                    PENDING: { text: '等待中', color: '#c4a35a' }, ACCEPTED: { text: '已接受', color: '#6b8c5a' },
                    REJECTED: { text: '已拒绝', color: '#c47d8e' }, EXPIRED: { text: '已过期', color: '#9e98aa' },
                  };
                  const si = statusInfo[r.status] ?? { text: r.status, color: '#9e98aa' };
                  return (
                    <div key={r.id} className="dg-tab-card">
                      <div className="dg-tab-card-aura" style={{ background: `linear-gradient(135deg,${g0},${g1})` }} />
                      <div className="dg-tab-card-meta">
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 500, background: u.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)', color: u.gender === 'male' ? '#6b82f0' : '#c47d8e' }}>
                          {u.gender === 'male' ? '男' : u.gender === 'female' ? '女' : '?'}
                        </span>
                        <span style={{ fontSize: 13, color: '#7a829a' }}>{u.campus}{u.campus && u.grade ? ' · ' : ''}{u.grade}</span>
                      </div>
                      <p className="dg-tab-card-quote">{u.declaration ? `"${u.declaration}"` : '"..."'}</p>
                      {u.interests.length > 0 && (
                        <div className="dg-tab-card-tags">
                          {u.interests.slice(0, 5).map((tag) => <span key={tag} className="dg-tab-card-tag">{tag}</span>)}
                        </div>
                      )}
                      <div className="dg-tab-card-action">
                        <span className="dg-tab-card-status" style={{ color: si.color }}>{si.text}</span>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {tab === 'received' && (
              receivedRequests.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', gridColumn: '1/-1', padding: 48 }}>
                  暂无收到的牵线请求
                </p>
              ) : (
                receivedRequests.map((r) => {
                  const u = r.fromUser!;
                  const [g0, g1] = getAuraGradient(u.id, u.gender);
                  return (
                    <div key={r.id} className="dg-tab-card">
                      <div className="dg-tab-card-aura" style={{ background: `linear-gradient(135deg,${g0},${g1})` }} />
                      <div className="dg-tab-card-meta">
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 500, background: u.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)', color: u.gender === 'male' ? '#6b82f0' : '#c47d8e' }}>
                          {u.gender === 'male' ? '男' : u.gender === 'female' ? '女' : '?'}
                        </span>
                        <span style={{ fontSize: 13, color: '#7a829a' }}>{u.campus}{u.campus && u.grade ? ' · ' : ''}{u.grade}</span>
                      </div>
                      <p className="dg-tab-card-quote">{u.declaration ? `"${u.declaration}"` : '"..."'}</p>
                      {u.interests.length > 0 && (
                        <div className="dg-tab-card-tags">
                          {u.interests.slice(0, 5).map((tag) => <span key={tag} className="dg-tab-card-tag">{tag}</span>)}
                        </div>
                      )}
                      <div className="dg-tab-card-actions-row">
                        <button className="dg-tab-card-reject" onClick={() => rejectRequest(r.id)}>不合适</button>
                        <button className="dg-tab-card-accept" onClick={() => acceptRequest(r.id)}>接受心动</button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {tab === 'relationships' && (
              relationships.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', gridColumn: '1/-1', padding: 48 }}>
                  暂无进行中的关系
                </p>
              ) : (
                relationships.map((rel) => {
                  const statusLabel: Record<string, { text: string; color: string }> = {
                    ICEBREAKING: { text: '破冰中', color: '#8ca0ff' }, FLIRTING: { text: '暧昧期', color: '#c47d8e' },
                    MATCHING: { text: '牵线中', color: '#c4a35a' },
                  };
                  const info = statusLabel[rel.status] ?? { text: rel.status, color: '#9e98aa' };

                  if (rel.role === 'wingman') {
                    const c1 = rel.client1!, c2 = rel.client2!;
                    return (
                      <div key={rel.id} className="dg-tab-card">
                        <div className="dg-tab-card-meta">
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'rgba(212,237,164,0.35)', color: '#5a7332', border: '1px solid rgba(212,237,164,0.6)' }}>军师身份</span>
                          <span style={{ fontSize: 13, color: '#7a829a' }}>
                            {rel.wingmanMode === 'SOLO' ? '代聊' : rel.wingmanMode === 'PRIVATE' ? '私聊' : '辅助'}模式
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#3a405a' }}>{c1.nickname}</p>
                            <p style={{ fontSize: 10, color: '#9e98aa' }}>{c1.gender === 'male' ? '男' : '女'}{c1.campus ? ` · ${c1.campus}` : ''}</p>
                          </div>
                          <span style={{ color: '#8ca0ff' }}>↔</span>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#3a405a' }}>{c2.nickname}</p>
                            <p style={{ fontSize: 10, color: '#9e98aa' }}>{c2.gender === 'male' ? '男' : '女'}{c2.campus ? ` · ${c2.campus}` : ''}</p>
                          </div>
                        </div>
                        <div className="dg-tab-card-action">
                          <span className="dg-tab-card-status" style={{ color: info.color }}>{info.text}</span>
                          <button className="dg-tab-card-btn" onClick={() => handleEnterRelationship(rel.id)}>
                            进入聊天 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const ou = rel.otherUser!;
                  const [g0, g1] = getAuraGradient(ou.id, ou.gender);
                  return (
                    <div key={rel.id} className="dg-tab-card">
                      <div className="dg-tab-card-aura" style={{ background: `linear-gradient(135deg,${g0},${g1})` }} />
                      <div className="dg-tab-card-meta">
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 500, background: ou.gender === 'male' ? 'rgba(140,160,255,0.15)' : 'rgba(196,125,142,0.15)', color: ou.gender === 'male' ? '#6b82f0' : '#c47d8e' }}>
                          {ou.gender === 'male' ? '男' : ou.gender === 'female' ? '女' : '?'}
                        </span>
                        <span style={{ fontSize: 13, color: '#7a829a' }}>{ou.campus}{ou.campus && ou.grade ? ' · ' : ''}{ou.grade}</span>
                      </div>
                      <p className="dg-tab-card-quote">{ou.declaration ? `"${ou.declaration}"` : '"..."'}</p>
                      {ou.interests.length > 0 && (
                        <div className="dg-tab-card-tags">
                          {ou.interests.slice(0, 5).map((tag) => <span key={tag} className="dg-tab-card-tag">{tag}</span>)}
                        </div>
                      )}
                      <div className="dg-tab-card-action">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="dg-tab-card-status" style={{ color: info.color }}>{info.text}</span>
                          {rel.myWingman && <span style={{ fontSize: 10, color: '#5a7332' }}>军师: {rel.myWingman.nickname} ({rel.myWingman.mode})</span>}
                        </div>
                        <button className="dg-tab-card-btn" onClick={() => handleEnterRelationship(rel.id)}>
                          {rel.status === 'FLIRTING' ? '查看' : '进入聊天'}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'rgba(58,64,90,0.3)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 20px 50px rgba(140,160,255,0.15)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320,
            }}
          >
            <p style={{ fontSize: 14, textAlign: 'center', color: '#3a405a', marginBottom: 8 }}>
              确认向 TA 发起牵线？
            </p>
            <p style={{ fontSize: 12, textAlign: 'center', color: '#9e98aa', marginBottom: 16 }}>
              消耗 5 信用分
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmTarget(null)}
                style={{ flex: 1, height: 40, borderRadius: 16, fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.45)', color: '#7a829a', border: '1px solid rgba(255,255,255,0.7)' }}
              >
                取消
              </button>
              <button
                onClick={() => sendMatchRequest(confirmTarget.id)}
                style={{ flex: 1, height: 40, borderRadius: 16, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#8ca0ff', color: '#fff', boxShadow: '0 6px 20px rgba(140,160,255,0.3)', border: 'none' }}
              >
                确认牵线
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
