import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { TAG_CATEGORIES, MAX_INTEREST_TAGS } from '../lib/tags';

export function ProfileSetupPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setPage = useAuthStore((s) => s.setPage);

  const [gender, setGender] = useState(user?.gender ?? '');
  const [campus, setCampus] = useState(user?.campus ?? '');
  const [grade, setGrade] = useState(user?.grade ?? '');
  const [major, setMajor] = useState(user?.major ?? '');
  const [declaration, setDeclaration] = useState(user?.declaration ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(user?.interests ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagShake, setTagShake] = useState(false);

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

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      await updateProfile({
        gender: gender || undefined,
        campus: campus || undefined,
        grade: grade || undefined,
        major: major || undefined,
        declaration: declaration || undefined,
        interests: selectedTags,
      } as any);
      setPage('discovery');
    } catch (e: any) {
      setError(e.message ?? '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Page Header */}
      <motion.div
        className="profile-page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: '#3a405a', fontWeight: 500, marginBottom: 8 }}>
          完善你的画像
        </h1>
        <p style={{ fontSize: 14, color: '#7a829a', fontWeight: 300, letterSpacing: 1 }}>
          让别人透过标签，遇见真实的你
        </p>
      </motion.div>

      {/* Canvas Container */}
      <motion.div
        className="profile-canvas"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* Left: Basic Info */}
        <div className="profile-section-left">
          {/* Gender */}
          <div className="profile-form-group">
            <label className="profile-form-label">你的性别</label>
            <div className="profile-pill-group">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`profile-pill ${gender === g ? 'active' : ''}`}
                >
                  {g === 'male' ? '男生' : '女生'}
                </button>
              ))}
            </div>
          </div>

          {/* Campus */}
          <div className="profile-form-group">
            <label className="profile-form-label">所在校区</label>
            <input
              type="text"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
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
                onChange={(e) => setGrade(e.target.value)}
                placeholder="例如：大二"
                className="profile-minimal-input"
              />
            </div>
            <div className="profile-form-group" style={{ flex: 1 }}>
              <label className="profile-form-label">专业方向</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="例如：软件工程"
                className="profile-minimal-input"
              />
            </div>
          </div>

          {/* Declaration */}
          <div className="profile-quote-input">
            <label className="profile-form-label">恋爱宣言 (写下你的期许)</label>
            <textarea
              value={declaration}
              onChange={(e) => setDeclaration(e.target.value)}
              placeholder="在这里写下那些不经意的心动..."
              className="profile-quote-textarea"
            />
          </div>
        </div>

        {/* Right: Tags */}
        <div className="profile-section-right">
          <div className="profile-tag-header">
            <label style={{ fontSize: 14, color: '#3a405a', fontWeight: 500 }}>点亮你的兴趣光晕</label>
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

          {/* Spacer for action bar */}
          <div style={{ height: 60 }} />
        </div>

        {/* Action Bar */}
        <div className="profile-action-bar">
          <button
            onClick={() => setPage('discovery')}
            className="profile-btn profile-btn-ghost"
          >
            稍后再说
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="profile-btn profile-btn-primary"
          >
            {submitting ? '保存中...' : '保存并开启邂逅'}
          </button>
        </div>

        {error && (
          <p className="profile-error">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
