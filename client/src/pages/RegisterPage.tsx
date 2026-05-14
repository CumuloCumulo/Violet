import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';

const EMAIL_SUFFIX = '@smail.nju.edu.cn';

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const sendCode = useAuthStore((s) => s.sendCode);
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const email = studentId.trim() + EMAIL_SUFFIX;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSendCode = async () => {
    setError('');
    if (!studentId.trim()) {
      setError('请输入学号');
      return;
    }
    try {
      await sendCode(email);
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message ?? '发送验证码失败');
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!studentId.trim()) {
      setError('请输入学号');
      return;
    }
    if (!code.trim()) {
      setError('请输入验证码');
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
      await register(email, nickname.trim(), password, code.trim());
      navigate('/setup');
    } catch (e: any) {
      setError(e.message ?? '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    studentId.trim() && code.trim() && nickname.trim() && password && confirmPassword && !submitting;

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
          {/* Student ID + Send Code */}
          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              南大学号
            </label>
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center h-11 rounded-2xl overflow-hidden"
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
                />
                <span
                  className="shrink-0 px-3 text-xs whitespace-nowrap"
                  style={{ color: '#8ca0ff' }}
                >
                  {EMAIL_SUFFIX}
                </span>
              </div>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || !studentId.trim()}
                className="shrink-0 h-11 px-3 rounded-2xl text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: countdown > 0 ? 'rgba(140, 160, 255, 0.1)' : '#8ca0ff',
                  color: countdown > 0 ? '#8ca0ff' : '#ffffff',
                  border: '1px solid rgba(140, 160, 255, 0.15)',
                }}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>

          {/* Verification Code */}
          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: '#7a829a' }}>
              验证码
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入邮箱收到的验证码"
              maxLength={6}
              className="w-full h-11 px-4 rounded-2xl text-sm outline-none transition-all tracking-widest"
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
              onClick={() => navigate('/login')}
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
