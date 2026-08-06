'use client';

import React, { useState, useEffect, Suspense } from 'react';

function ProfileMain() {
  const [tagId, setTagId] = useState('default');
  const [path, setPath] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [base64Image, setBase64Image] = useState('');

  // URLパラメータの安全な取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTagId(params.get('tagId') || 'default');
    setPath(params.get('path') || '');
  }, []);

  // データ取得
  useEffect(() => {
    if (!tagId) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/profile?tagId=${tagId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.image) setBase64Image(json.image);
        }
      } catch (err) {
        console.error('Failed to load', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tagId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    );
  }

  const authKey = 'nova_auth_' + tagId;
  const editAuthKey = 'nova_edit_auth_' + tagId;

  // 未登録ならセットアップ
  if (!data || !data.isReg) {
    return <EditScreen data={data || {}} tagId={tagId} base64Image={base64Image} setBase64Image={setBase64Image} isNew={true} />;
  }

  // あいことば確認
  if (path === 'forgot') {
    return <ForgotScreen data={data} tagId={tagId} />;
  }

  // 編集画面
  if (path === 'edit') {
    if (typeof window !== 'undefined' && sessionStorage.getItem(editAuthKey) !== 'true') {
      return <EditAuthScreen data={data} tagId={tagId} />;
    }
    return <EditScreen data={data} tagId={tagId} base64Image={base64Image} setBase64Image={setBase64Image} isNew={false} />;
  }

  // 通常閲覧の認証
  if (typeof window !== 'undefined' && sessionStorage.getItem(authKey) !== 'true') {
    return <AuthScreen data={data} tagId={tagId} />;
  }

  return <ProfileScreen data={data} tagId={tagId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <ProfileMain />
    </Suspense>
  );
}

// ---------------- 認証画面 ----------------
function AuthScreen({ data, tagId }: { data: any; tagId: string }) {
  const [pin, setPin] = useState('');
  const handleAuth = () => {
    if (pin === data.pin) {
      sessionStorage.setItem('nova_auth_' + tagId, 'true');
      window.location.href = `?tagId=${tagId}`;
    } else {
      alert('パスワードが違います');
    }
  };
  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <h2>🔒 プロフィール保護</h2>
        <p style={{ color: '#aaa', fontSize: '13px' }}>数字4桁のパスワードを入力</p>
        <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" style={inputStyle} />
        <button onClick={handleAuth} style={btnStyle}>表示する</button>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <a href={`?tagId=${tagId}&path=forgot`} style={{ color: '#ff007f', fontSize: '12px' }}>パスワードを忘れた場合</a>
        </div>
      </div>
    </div>
  );
}

function EditAuthScreen({ data, tagId }: { data: any; tagId: string }) {
  const [pin, setPin] = useState('');
  const handleAuth = () => {
    if (pin === data.pin) {
      sessionStorage.setItem('nova_edit_auth_' + tagId, 'true');
      window.location.href = `?tagId=${tagId}&path=edit`;
    } else {
      alert('パスワードが違います');
    }
  };
  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <h2>🔒 編集認証</h2>
        <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" style={inputStyle} />
        <button onClick={handleAuth} style={btnStyle}>認証する</button>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <a href={`?tagId=${tagId}`} style={{ color: '#888', fontSize: '12px' }}>← 戻る</a>
        </div>
      </div>
    </div>
  );
}

function ForgotScreen({ data, tagId }: { data: any; tagId: string }) {
  const [word, setWord] = useState('');
  const handleCheck = () => {
    if (word.trim() === data.secretWord) {
      alert('パスワードは 【 ' + data.pin + ' 】 です');
      window.location.href = `?tagId=${tagId}`;
    } else {
      alert('あいことばが違います');
    }
  };
  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <h2>🔑 あいことば確認</h2>
        <input type="text" value={word} onChange={e => setWord(e.target.value)} placeholder="あいことばを入力" style={inputStyle} />
        <button onClick={handleCheck} style={btnStyle}>確認</button>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <a href={`?tagId=${tagId}`} style={{ color: '#888', fontSize: '12px' }}>← 戻る</a>
        </div>
      </div>
    </div>
  );
}

// ---------------- 編集・登録画面 ----------------
function EditScreen({ data, tagId, base64Image, setBase64Image, isNew }: any) {
  const [form, setForm] = useState({
    ig: data.ig || '',
    tk: data.tk || '',
    x: data.x || '',
    yt: data.yt || '',
    color: data.color || '#ff007f',
    pin: data.pin || '',
    secretWord: data.secretWord || '',
    igShow: data.igShow !== false,
    tkShow: data.tkShow !== false,
    xShow: data.xShow !== false,
    ytShow: data.ytShow !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBase64Image(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.pin)) {
      alert('パスワードは半角数字4桁で入力してください');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, ...form, isReg: true, image: base64Image })
      });
      if (res.ok) {
        sessionStorage.setItem('nova_auth_' + tagId, 'true');
        window.location.href = `?tagId=${tagId}`;
      } else {
        alert('保存失敗');
        setSaving(false);
      }
    } catch {
      alert('通信エラー');
      setSaving(false);
    }
  };

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2>{isNew ? '✨ NOVA Setup' : '✨ NOVA Edit'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            {base64Image ? (
              <img src={base64Image} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#222', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>No Image</div>
            )}
            <input type="file" accept="image/*" onChange={handleImage} style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }} />
          </div>

          {[
            { key: 'ig', label: 'Instagram ID', show: 'igShow' },
            { key: 'tk', label: 'TikTok ID', show: 'tkShow' },
            { key: 'x', label: 'X (Twitter) ID', show: 'xShow' },
            { key: 'yt', label: 'YouTube ID', show: 'ytShow' },
          ].map(item => (
            <div key={item.key} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                <span>{item.label}</span>
                <label><input type="checkbox" checked={form[item.show]} onChange={e => setForm({...form, [item.show]: e.target.checked})} /> 表示</label>
              </div>
              <input type="text" value={form[item.key]} onChange={e => setForm({...form, [item.key]: e.target.value})} style={inputStyle} />
            </div>
          ))}

          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>テーマカラー</div>
            <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} style={{ width: '100%', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>パスワード（数字4桁）</div>
            <input type="password" maxLength={4} required value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} placeholder="1234" style={inputStyle} />
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>あいことば（パスワード忘れ防止）</div>
            <input type="text" required value={form.secretWord} onChange={e => setForm({...form, secretWord: e.target.value})} placeholder="例: 飼い犬の名前" style={inputStyle} />
          </div>

          <button type="submit" disabled={saving} style={btnStyle}>{saving ? '保存中...' : (isNew ? '登録する' : '更新する')}</button>
        </form>
      </div>
    </div>
  );
}

// ---------------- プロフィール表示画面 ----------------
function ProfileScreen({ data, tagId }: { data: any; tagId: string }) {
  const color = data.color || '#ff007f';
  const links = [
    { show: data.ig && data.igShow, url: `https://instagram.com/${data.ig?.replace('@','')}`, name: 'Instagram' },
    { show: data.tk && data.tkShow, url: `https://tiktok.com/@${data.tk?.replace('@','')}`, name: 'TikTok' },
    { show: data.x && data.xShow, url: `https://x.com/${data.x?.replace('@','')}`, name: 'X (Twitter)' },
    { show: data.yt && data.ytShow, url: `https://youtube.com/${data.yt}`, name: 'YouTube' },
  ];

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        {data.image ? (
          <img src={data.image} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: `2px solid ${color}` }} />
        ) : (
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#222', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>No Image</div>
        )}
        <h1 style={{ fontSize: '18px', marginBottom: '5px' }}>💎 NOVA Profile</h1>
        <p style={{ fontSize: '11px', color: '#777', marginBottom: '20px' }}>ID: {tagId}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
          {links.map((l, i) => l.show && (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: color, color: '#fff', padding: '14px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>
              {l.name}
            </a>
          ))}
        </div>

        <a href={`?tagId=${tagId}&path=edit`} style={{ fontSize: '12px', color: '#aaa', textDecoration: 'underline' }}>情報を編集する</a>
      </div>
    </div>
  );
}

// 共通スタイル
const wrapStyle = { minHeight: '100vh', background: '#111', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif' } as const;
const cardStyle = { background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '15px', marginBottom: '12px', boxSizing: 'border-box', textAlign: 'left' } as const;
const inputStyle = { width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' } as const;
const btnStyle = { width: '100%', background: '#ff007f', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' } as const;
