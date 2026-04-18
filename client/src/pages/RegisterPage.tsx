import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const setPage = useAuthStore((s) => s.setPage);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!email.endsWith('@smail.nju.edu.cn')) {
      setError('仅支持南大 smail 邮箱注册');
      return;
    }
    if (nickname.trim().length < 1) {
      setError('请输入昵称');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), nickname.trim(), password);
    } catch (e: any) {
      setError(e.message ?? '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = email.trim() && nickname.trim() && password && confirmPassword && !submitting;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1
            className="text-ink text-[56px] font-light tracking-wide"
            style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}
          >
            Violet
          </h1>
          <p className="mt-2 text-sm font-light" style={{ color: '#5a627a' }}>
            创建账号，开启心动之旅
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div
          className="glass rounded-[28px] p-6 space-y-4"
          style={{ boxShadow: '0 20px 50px rgba(140, 160, 255, 0.08)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              南大邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@smail.nju.edu.cn"
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: '#3a405a',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="给自己取个名字"
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: '#3a405a',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: '#3a405a',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: '#3a405a',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleRegister()}
            />
          </div>

          {error && (
            <motion.p
              className="text-xs text-center"
              style={{ color: '#c47d8e' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <button
            onClick={handleRegister}
            disabled={!canSubmit}
            className="w-full h-11 rounded-2xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: '#8ca0ff',
              color: '#ffffff',
              boxShadow: canSubmit ? '0 8px 24px rgba(140, 160, 255, 0.35)' : 'none',
            }}
          >
            {submitting ? '注册中...' : '注册'}
          </button>

          <div className="text-center pt-1">
            <button
              onClick={() => setPage('login')}
              className="text-xs font-light transition-colors"
              style={{ color: '#7a829a' }}
            >
              已有账号？<span style={{ color: '#8ca0ff' }}>去登录</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
