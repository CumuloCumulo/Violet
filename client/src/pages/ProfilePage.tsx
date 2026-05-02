import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch, apiUpload } from '../lib/api';
import { TAG_CATEGORIES, MAX_INTEREST_TAGS } from '../lib/tags';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setPage = useAuthStore((s) => s.setPage);
  const logout = useAuthStore((s) => s.logout);

  const [gender, setGender] = useState(user?.gender ?? '');
  const [campus, setCampus] = useState(user?.campus ?? '');
  const [grade, setGrade] = useState(user?.grade ?? '');
  const [major, setMajor] = useState(user?.major ?? '');
  const [declaration, setDeclaration] = useState(user?.declaration ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.interests ?? []);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ balance: number; reward: number } | null>(null);
  const [tagShake, setTagShake] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Debounced auto-save for profile fields
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSaveProfile = (updates: Partial<any>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile(updates as any);
      } catch (e: any) {
        console.error('自动保存失败:', e.message);
      }
    }, 800);
  };

  const handleGenderChange = (g: string) => {
    setGender(g);
    autoSaveProfile({ gender: g });
  };

  const handleCampusChange = (v: string) => {
    setCampus(v);
    autoSaveProfile({ campus: v });
  };

  const handleGradeChange = (v: string) => {
    setGrade(v);
    autoSaveProfile({ grade: v });
  };

  const handleMajorChange = (v: string) => {
    setMajor(v);
    autoSaveProfile({ major: v });
  };

  const handleDeclarationChange = (v: string) => {
    setDeclaration(v);
    autoSaveProfile({ declaration: v });
  };

  // Modal state
  const [nicknameModal, setNicknameModal] = useState(false);
  const [declarationModal, setDeclarationModal] = useState(false);
  const [editNickname, setEditNickname] = useState(user?.nickname ?? '');
  const [editDeclaration, setEditDeclaration] = useState(user?.declaration ?? '');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [declarationSaving, setDeclarationSaving] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const openNicknameModal = () => {
    setEditNickname(user?.nickname ?? '');
    setNicknameModal(true);
  };

  const openDeclarationModal = () => {
    setEditDeclaration(user?.declaration ?? '');
    setDeclarationModal(true);
  };

  const handleSaveNickname = async () => {
    setNicknameSaving(true);
    try {
      await updateProfile({ nickname: editNickname || undefined } as any);
      setNicknameModal(false);
    } catch (e: any) {
      setAvatarError(e.message ?? '保存失败');
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleSaveDeclaration = async () => {
    setDeclarationSaving(true);
    try {
      await updateProfile({ declaration: editDeclaration || undefined } as any);
      setDeclarationModal(false);
    } catch (e: any) {
      setAvatarError(e.message ?? '保存失败');
    } finally {
      setDeclarationSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setAvatarError('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('图片大小不能超过 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const updated = await apiUpload<any>('/user/avatar', formData);
      useAuthStore.setState({ user: { ...user, ...updated } as any });
    } catch (err: any) {
      setAvatarError(err.message ?? '上传失败');
    } finally {
      setAvatarUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Account security state
  const [securityOpen, setSecurityOpen] = useState(false);
  const securityContentRef = useRef<HTMLDivElement>(null);
  const [securityHeight, setSecurityHeight] = useState(0);
  const [contactEmail, setContactEmail] = useState(user?.contactEmail ?? '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_INTEREST_TAGS) {
        setTagShake(true);
        setTimeout(() => setTagShake(false), 300);
        return prev;
      }
      return [...prev, tag];
    });
  };

  // Auto-save tags when changed
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await updateProfile({ interests: selectedTags } as any);
      } catch (e: any) {
        console.error('标签保存失败:', e.message);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedTags]);

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      const result = await apiFetch<{ balance: number; reward: number }>('/credit/checkin', { method: 'POST' });
      setCheckinResult(result);
      // Refresh user data
      await updateProfile({} as any);
    } catch (e: any) {
      console.error('签到失败:', e.message);
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleChangeContactEmail = async () => {
    setEmailMsg('');
    if (!contactEmail.trim()) {
      setEmailMsg('请输入常用邮箱');
      return;
    }
    setEmailSaving(true);
    try {
      const updatedUser = await apiFetch<any>('/user/contact-email', {
        method: 'PATCH',
        body: JSON.stringify({ newEmail: contactEmail.trim() }),
      });
      useAuthStore.setState({ user: { ...user, ...updatedUser } as any });
      setEmailMsg('常用邮箱已更新');
    } catch (e: any) {
      setEmailMsg(e.message ?? '修改失败');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('请填写所有密码字段');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('新密码长度至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('两次输入的新密码不一致');
      return;
    }
    setPasswordSaving(true);
    try {
      await apiFetch('/user/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg('密码已修改');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordMsg(e.message ?? '修改失败');
    } finally {
      setPasswordSaving(false);
    }
  };

  const roleLabels: Record<string, string> = { CLIENT: '当事人', WINGMAN: '军师', ADMIN: '管理员' };
  const certLabels: Record<string, string> = { NONE: '未申请', PENDING: '审核中', APPROVED: '已通过', REJECTED: '已驳回' };

  return (
    <div className="profile-center-page">
      {/* Header */}
      <motion.div
        className="profile-center-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <button onClick={() => setPage('discovery')} className="profile-center-back">
          ← 发现
        </button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#3a405a', fontWeight: 500 }}>
          个人中心
        </h1>
        <button onClick={logout} className="profile-center-logout">
          退出
        </button>
      </motion.div>

      {/* Canvas */}
      <motion.div
        className="profile-canvas"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="profile-canvas-body">
        {/* Left: Editable Info */}
        <div className="profile-section-left">
          {/* Avatar Upload & User Info */}
          <div className="profile-user-header">
            <div className="avatar-preview" onClick={handleAvatarClick}>
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {(user?.nickname ?? '?')[0].toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">
                {avatarUploading ? (
                  <svg className="avatar-spinner" viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2" strokeDasharray="31.4" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <div className="profile-user-info">
              <div className="profile-user-name" onClick={openNicknameModal}>{user?.nickname || '未设置昵称'}</div>
              <div className="profile-user-declaration" onClick={openDeclarationModal}>{user?.declaration || '写下你的恋爱宣言...'}</div>
            </div>
          </div>
          {avatarError && <p className="profile-error" style={{ textAlign: 'center', marginBottom: 12 }}>{avatarError}</p>}

          {/* Gender */}
          <div className="profile-form-group">
            <label className="profile-form-label">性别</label>
            <div className="profile-pill-group">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderChange(g)}
                  className={`profile-pill ${gender === g ? 'active' : ''}`}
                >
                  {g === 'male' ? '男生' : '女生'}
                </button>
              ))}
            </div>
          </div>

          {/* Campus */}
          <div className="profile-form-group">
            <label className="profile-form-label">校区</label>
            <input
              type="text"
              value={campus}
              onChange={(e) => handleCampusChange(e.target.value)}
              placeholder="例如：仙林校区"
              className="profile-minimal-input"
            />
          </div>

          {/* Grade & Major */}
          <div className="profile-row">
            <div className="profile-form-group" style={{ flex: 1 }}>
              <label className="profile-form-label">年级</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                placeholder="例如：大二"
                className="profile-minimal-input"
              />
            </div>
            <div className="profile-form-group" style={{ flex: 1 }}>
              <label className="profile-form-label">专业方向</label>
              <input
                type="text"
                value={major}
                onChange={(e) => handleMajorChange(e.target.value)}
                placeholder="例如：软件工程"
                className="profile-minimal-input"
              />
            </div>
          </div>

          {/* Declaration */}
          <div className="profile-quote-input">
            <label className="profile-form-label">恋爱宣言</label>
            <textarea
              value={declaration}
              onChange={(e) => handleDeclarationChange(e.target.value)}
              placeholder="写下你的期许..."
              className="profile-quote-textarea"
            />
          </div>
        </div>

        {/* Middle: Interest Tags */}
        <div className="profile-section-middle">
          <div className="profile-tag-header">
            <label style={{ fontSize: 14, color: '#3a405a', fontWeight: 500 }}>兴趣标签</label>
            <div
              className={`profile-tag-count ${tagShake ? 'shake' : ''}`}
              style={{
                color: selectedTags.length >= MAX_INTEREST_TAGS ? '#8ca0ff' : '#7a829a',
                fontWeight: selectedTags.length >= MAX_INTEREST_TAGS ? 500 : 400,
              }}
            >
              {selectedTags.length}/{MAX_INTEREST_TAGS}
            </div>
          </div>

          {TAG_CATEGORIES.map((cat) => (
            <div key={cat.title} className="profile-tag-category">
              <div className="profile-category-title">{cat.title}</div>
              <div className="profile-tag-cloud">
                {cat.tags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`profile-tag ${active ? 'active' : ''}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Status & Roles */}
        <div className="profile-section-right">
          {/* Credit Score */}
          <div className="profile-center-stat">
            <div className="credit-ring-left">
              <div className="credit-ring-container">
                <svg className="credit-ring" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(140, 160, 255, 0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#8ca0ff"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={326.73}
                    strokeDashoffset={326.73 - (326.73 * Math.min((user?.creditScore ?? 0), 100)) / 100}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <div className="credit-ring-value">{user?.creditScore ?? 0}</div>
              </div>
              <div className="profile-center-stat-label">信用分</div>
            </div>

            <div className="credit-right">
              {/* Wingman Cert */}
              {user?.roles.includes('WINGMAN') && (
                <div className="profile-center-cert">
                  <div className="profile-center-section-label">军师认证</div>
                  <span className="profile-center-cert-tag">{certLabels[user.wingmanCertStatus] ?? user.wingmanCertStatus}</span>
                </div>
              )}

              <button
                onClick={handleCheckin}
                disabled={checkinLoading || !!checkinResult}
                className="profile-center-checkin-btn"
                style={{
                  opacity: checkinResult ? 0.6 : 1,
                  cursor: checkinResult ? 'default' : 'pointer',
                }}
              >
                {checkinLoading ? '签到中...' : checkinResult ? `已签到 +${checkinResult.reward}` : '每日签到'}
              </button>
            </div>
          </div>

          {/* Roles */}
          <div className="profile-center-roles">
            <div className="profile-center-section-label">角色</div>
            <div className="flex flex-wrap gap-2">
              {user?.roles.map((role) => (
                <span key={role} className="profile-center-role-tag">
                  {roleLabels[role] ?? role}
                </span>
              ))}
            </div>
          </div>

          {/* Account Security */}
          <div className="profile-security-section">
            <button
              className="profile-security-toggle"
              onClick={() => {
                const isOpening = !securityOpen;
                setSecurityOpen(isOpening);
                if (isOpening && securityContentRef.current) {
                  requestAnimationFrame(() => {
                    if (securityContentRef.current) {
                      setSecurityHeight(securityContentRef.current.scrollHeight);
                    }
                  });
                } else {
                  setSecurityHeight(0);
                }
              }}
            >
              <span>账号安全</span>
              <span className={`profile-security-arrow ${securityOpen ? 'open' : ''}`}>▼</span>
            </button>

            <div
              className="profile-security-content"
              style={{
                maxHeight: securityOpen ? securityHeight : 0,
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div ref={securityContentRef} className="profile-security-inner">
                {/* Campus Email (read-only) */}
                <div className="profile-form-group">
                  <label className="profile-form-label">校园邮箱（不可修改）</label>
                  <div className="profile-security-readonly">{user?.email}</div>
                </div>

                {/* Contact Email */}
                <div className="profile-form-group">
                  <label className="profile-form-label">常用邮箱</label>
                  <div className="profile-security-row">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="输入常用邮箱"
                      className="profile-minimal-input"
                    />
                    <button
                      onClick={handleChangeContactEmail}
                      disabled={emailSaving}
                      className="profile-security-action-btn"
                    >
                      {emailSaving ? '保存中...' : '修改'}
                    </button>
                  </div>
                  {emailMsg && (
                    <div className={`profile-security-msg ${emailMsg.includes('已更新') ? 'success' : 'error'}`}>
                      {emailMsg}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="profile-security-divider" />

                {/* Change Password */}
                <div className="profile-form-group">
                  <label className="profile-form-label">当前密码</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="profile-minimal-input"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少 6 位"
                    className="profile-minimal-input"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">确认新密码</label>
                  <div className="profile-security-row">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
                      className="profile-minimal-input"
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      className="profile-security-action-btn"
                    >
                      {passwordSaving ? '修改中...' : '修改密码'}
                    </button>
                  </div>
                  {passwordMsg && (
                    <div className={`profile-security-msg ${passwordMsg.includes('已修改') ? 'success' : 'error'}`}>
                      {passwordMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 20 }} />
        </div>
        </div>
      </motion.div>

      {/* Nickname Modal */}
      {nicknameModal && (
        <div className="profile-modal-overlay" onClick={() => setNicknameModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-title">修改昵称</div>
            <input
              className="profile-modal-input"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              placeholder="输入新昵称"
              autoFocus
            />
            <div className="profile-modal-actions">
              <button className="profile-modal-btn-cancel" onClick={() => setNicknameModal(false)}>取消</button>
              <button className="profile-modal-btn-confirm" onClick={handleSaveNickname} disabled={nicknameSaving}>
                {nicknameSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declaration Modal */}
      {declarationModal && (
        <div className="profile-modal-overlay" onClick={() => setDeclarationModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-title">修改恋爱宣言</div>
            <textarea
              className="profile-modal-textarea"
              value={editDeclaration}
              onChange={(e) => setEditDeclaration(e.target.value)}
              placeholder="写下你的恋爱宣言..."
              autoFocus
            />
            <div className="profile-modal-actions">
              <button className="profile-modal-btn-cancel" onClick={() => setDeclarationModal(false)}>取消</button>
              <button className="profile-modal-btn-confirm" onClick={handleSaveDeclaration} disabled={declarationSaving}>
                {declarationSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
