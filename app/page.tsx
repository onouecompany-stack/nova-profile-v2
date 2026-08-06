'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ProfileContent() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get('tagId') || 'default-user';

  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    links: [] as { label: string; url: string }[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // データ取得
  useEffect(() => {
    fetch(`/api/profile?tagId=${tagId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setProfile({
            name: data.name || '',
            bio: data.bio || '',
            avatarUrl: data.avatarUrl || '',
            links: data.links || [],
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile', err);
        setLoading(false);
      });
  }, [tagId]);

  // データ保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, ...profile }),
      });
      if (res.ok) {
        setIsEdit(false);
      } else {
        alert('保存に失敗しました');
      }
    } catch (err) {
      console.error('Save error', err);
      alert('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading NOVA...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', background: '#141414', border: '1px solid #222', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        
        {/* 編集切り替えボタン */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={() => setIsEdit(!isEdit)}
            style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {isEdit ? 'プレビューに戻る' : '編集する'}
          </button>
        </div>

        {!isEdit ? (
          /* ── プレビュー画面（NOVAデザイン） ── */
          <div style={{ textAlign: 'center' }}>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #444', marginBottom: '1rem' }}
              />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#222', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                No Image
              </div>
            )}
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{profile.name || '名無しさん'}</h1>
            <p style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>{profile.bio || '自己紹介がまだ設定されていません。'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', background: '#1f1f1f', color: '#fff', padding: '12px', borderRadius: '10px', textDecoration: 'none', border: '1px solid #333', transition: 'background 0.2s' }}
                >
                  {link.label || link.url}
                </a>
              ))}
            </div>
          </div>
        ) : (
          /* ── 編集画面 ── */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>プロフィール編集</h2>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>名前</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>自己紹介</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>アバター画像URL</label>
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>リンク (ラベルとURL)</label>
              {profile.links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="ラベル (例: Twitter)"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...profile.links];
                      newLinks[idx].label = e.target.value;
                      setProfile({ ...profile, links: newLinks });
                    }}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...profile.links];
                      newLinks[idx].url = e.target.value;
                      setProfile({ ...profile, links: newLinks });
                    }}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#1f1f1f', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = profile.links.filter((_, i) => i !== idx);
                      setProfile({ ...profile, links: newLinks });
                    }}
                    style={{ background: '#442222', color: '#ff8888', border: 'none', padding: '0 10px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setProfile({ ...profile, links: [...profile.links, { label: '', url: '' }] })}
                style={{ width: '100%', background: '#222', color: '#ccc', border: '1px dashed #444', padding: '8px', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}
              >
                + リンクを追加
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}
            >
              {saving ? '保存中...' : '変更を保存'}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
