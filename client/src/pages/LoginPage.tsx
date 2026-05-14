import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';

const EMAIL_SUFFIX = '@smail.nju.edu.cn';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const email = studentId.trim() + EMAIL_SUFFIX;

  const handleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) {
      setError(e.message ?? '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = studentId.trim() && password.trim() && !submitting;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <motion.div
          className="text-center mb-10"
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
            对话即心跳 — 校园恋爱代聊平台
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="glass rounded-[28px] p-6 space-y-4"
          style={{ boxShadow: '0 20px 50px rgba(140, 160, 255, 0.08)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              南大学号
            </label>
            <div
              className="flex items-center h-11 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
            >
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="学号"
                className="flex-1 h-full px-4 text-sm outline-none bg-transparent"
                style={{ color: '#3a405a' }}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleLogin()}
              />
              <span
                className="shrink-0 px-3 text-xs whitespace-nowrap"
                style={{ color: '#8ca0ff' }}
              >
                {EMAIL_SUFFIX}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: '#3a405a',
                border: '1px solid rgba(140, 160, 255, 0.15)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleLogin()}
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
            onClick={handleLogin}
            disabled={!canSubmit}
            className="w-full h-11 rounded-2xl text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: '#8ca0ff',
              color: '#ffffff',
              boxShadow: canSubmit ? '0 8px 24px rgba(140, 160, 255, 0.35)' : 'none',
            }}
          >
            {submitting ? '登录中...' : '登录'}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => navigate('/reset-password')}
              className="text-xs font-light transition-colors"
              style={{ color: '#7a829a' }}
            >
              <span style={{ color: '#8ca0ff' }}>忘记密码？</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-xs font-light transition-colors"
              style={{ color: '#7a829a' }}
            >
              还没有账号？<span style={{ color: '#8ca0ff' }}>立即注册</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
