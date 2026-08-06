'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ProfileApp() {
  const searchParams = useSearchParams();
  const tagId = searchParams.get('tagId') || 'default';
  const path = searchParams.get('path');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [base64Image, setBase64Image] = useState('');

  // 1. 初回マウント時にクラウド（API）からデータを取得
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/profile?tagId=${tagId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.image) setBase64Image(json.image);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tagId]);

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#888' }}>読み込み中...</p>
      </div>
    );
  }

  // セッション認証状態の管理
  const authSessionKey = 'nova_auth_' + tagId;
  const editAuthSessionKey = 'nova_edit_auth_' + tagId;

  // 未登録なら強制的にセットアップ画面へ
  if (!data || !data.isReg) {
    return <EditPage data={data || {}} tagId={tagId} base64Image={base64Image} setBase64Image={setBase64Image} isNew={true} />;
  }

  // パスワード忘れ画面
  if (path === 'forgot') {
    return <ForgotPage data={data} tagId={tagId} />;
  }

  // 編集画面（パスワード認証が必要）
  if (path === 'edit') {
    if (typeof window !== 'undefined' && sessionStorage.getItem(editAuthSessionKey) !== 'true') {
      return <EditAuthForm data={data} tagId={tagId} />;
    }
    return <EditPage data={data} tagId={tagId} base64Image={base64Image} setBase64Image={setBase64Image} isNew={false} />;
  }

  // 通常閲覧画面のパスワード認証
  if (typeof window !== 'undefined' && sessionStorage.getItem(authSessionKey) !== 'true') {
    return <AuthForm data={data} tagId={tagId} />;
  }

  return <ProfilePage data={data} tagId={tagId} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <ProfileApp />
    </Suspense>
  );
}

// --------------------------------------------------------- //
// 各画面コンポーネント
// --------------------------------------------------------- //

function AuthForm({ data, tagId }: { data: any; tagId: string }) {
  const [pInput, setPInput] = useState('');

  const verifyPin = () => {
    if (!pInput) {
      alert('パスワードを入力してください');
      return;
    }
    if (pInput === data.pin) {
      sessionStorage.setItem('nova_auth_' + tagId, 'true');
      window.location.href = `?tagId=${tagId}`;
    } else {
      alert('パスワードが間違っています');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...boxStyle, marginTop: '50px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🔒 プロフィール保護</h2>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>数字4桁のパスワードを入力してください。</p>
        <input
          type="password"
          value={pInput}
          onChange={(e) => setPInput(e.target.value)}
          placeholder="1234"
          maxLength={4}
          inputMode="numeric"
          style={inputStyle}
        />
        <button onClick={verifyPin} style={btnStyle}>プロフィールを表示</button>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <a href={`?tagId=${tagId}&path=forgot`} style={{ fontSize: '12px', color: '#ff007f', textDecoration: 'none' }}>
            パスワードを忘れた場合（あいことばで確認）
          </a>
        </div>
      </div>
    </div>
  );
}

function EditAuthForm({ data, tagId }: { data: any; tagId: string }) {
  const [editPInput, setEditPInput] = useState('');

  const verifyEditPin = () => {
    if (!editPInput) {
      alert('パスワードを入力してください');
      return;
    }
    if (editPInput === data.pin) {
      sessionStorage.setItem('nova_edit_auth_' + tagId, 'true');
      window.location.href = `?tagId=${tagId}&path=edit`;
    } else {
      alert('パスワードが間違っています');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...boxStyle, marginTop: '50px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🔒 編集認証</h2>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>プロフィールを編集するには数字4桁のパスワードを入力してください。</p>
        <input
          type="password"
          value={editPInput}
          onChange={(e) => setEditPInput(e.target.value)}
          placeholder="1234"
          maxLength={4}
          inputMode="numeric"
          style={inputStyle}
        />
        <button onClick={verifyEditPin} style={btnStyle}>認証して編集へ</button>
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <a href={`?tagId=${tagId}&path=forgot`} style={{ fontSize: '12px', color: '#ff007f', textDecoration: 'none' }}>
            パスワードを忘れた場合
          </a>
          <a href={`?tagId=${tagId}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>
            ← プロフィールに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

function ForgotPage({ data, tagId }: { data: any; tagId: string }) {
  const [sInput, setSInput] = useState('');

  const verifySecret = () => {
    if (!sInput.trim()) {
      alert('あいことばを入力してください');
      return;
    }
    if (sInput.trim() === data.secretWord) {
      alert('パスワードは 【 ' + data.pin + ' 】 です。');
      window.location.href = `?tagId=${tagId}`;
    } else {
      alert('あいことばが違います');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...boxStyle, marginTop: '50px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🔑 パスワードの確認</h2>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>登録した「あいことば」を入力してください。</p>
        <input
          type="text"
          value={sInput}
          onChange={(e) => setSInput(e.target.value)}
          placeholder="あいことばを入力"
          style={{ ...inputStyle, textAlign: 'left' }}
        />
        <button onClick={verifySecret} style={btnStyle}>確認する</button>
        <div style={{ marginTop: '15px' }}>
          <a href={`?tagId=${tagId}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>
            ← 戻る
          </a>
        </div>
      </div>
    </div>
  );
}

function EditPage({ data, tagId, base64Image, setBase64Image, isNew }: any) {
  const [form, setForm] = useState({
    ig: data.ig || '',
    tk: data.tk || '',
    x: data.x || '',
    yt: data.yt || '',
    bereal: data.bereal || '',
    line: data.line || '',
    customName: data.customName || '',
    customUrl: data.customUrl || '',
    color: data.color || '#ff007f',
    pin: data.pin || '',
    secretWord: data.secretWord || '',
    igShow: data.igShow !== false,
    tkShow: data.tkShow !== false,
    xShow: data.xShow !== false,
    ytShow: data.ytShow !== false,
    berealShow: data.berealShow !== false,
    lineShow: data.lineShow !== false,
    customShow: data.customShow !== false,
  });

  const [saving, setSaving] = useState(false);

  const previewFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.pin)) {
      alert('パスワードは必ず「半角数字4桁」で入力してください。');
      return;
    }
    setSaving(true);

    const payload = {
      tagId,
      ...form,
      isReg: true,
      image: base64Image,
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        sessionStorage.setItem('nova_auth_' + tagId, 'true');
        sessionStorage.removeItem('nova_edit_auth_' + tagId);
        window.location.href = `?tagId=${tagId}`;
      } else {
        alert('保存に失敗しました');
        setSaving(false);
      }
    } catch (err) {
      alert('通信エラーが発生しました');
      setSaving(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>
        {isNew ? "✨ NOVA Setup" : "✨ NOVA Edit"}
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          {base64Image ? (
            <img src={base64Image} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block', border: '2px solid #444' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#666', fontSize: '12px' }}>No Image</div>
          )}
          <input type="file" accept="image/*" onChange={previewFile} style={{ fontSize: '12px', color: '#aaa' }} />
        </div>

        {[
          { key: 'ig', label: 'Instagram ID', placeholder: 'username', showKey: 'igShow' },
          { key: 'tk', label: 'TikTok ID', placeholder: 'username', showKey: 'tkShow' },
          { key: 'x', label: 'X (Twitter) ID', placeholder: 'username', showKey: 'xShow' },
          { key: 'yt', label: 'YouTube ID / チャンネル名', placeholder: 'channel_name', showKey: 'ytShow' },
          { key: 'bereal', label: 'BeReal URL または ID', placeholder: 'https://...', showKey: 'berealShow' },
          { key: 'line', label: 'LINE URL または ID', placeholder: 'https://...', showKey: 'lineShow' },
        ].map((item) => (
          <div key={item.key} style={fieldCardStyle}>
            <div style={fieldLabelStyle}>
              <span>{item.label}</span>
              <label style={checkboxWrapStyle}>
                <input
                  type="checkbox"
                  checked={(form as any)[item.showKey]}
                  onChange={(e) => setForm({ ...form, [item.showKey]: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#ff007f' }}
                />
                表示
              </label>
            </div>
            <input
              type="text"
              value={(form as any)[item.key]}
              onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
              placeholder={item.placeholder}
              style={{ ...inputStyle, marginBottom: 0, textAlign: 'left' }}
            />
          </div>
        ))}

        <div style={fieldCardStyle}>
          <div style={fieldLabelStyle}>
            <span>カスタムリンク (名称 / URL)</span>
            <label style={checkboxWrapStyle}>
              <input
                type="checkbox"
                checked={form.customShow}
                onChange={(e) => setForm({ ...form, customShow: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#ff007f' }}
              />
              表示
            </label>
          </div>
          <input
            type="text"
            value={form.customName}
            onChange={(e) => setForm({ ...form, customName: e.target.value })}
            placeholder="リンク名 (例: note)"
            style={{ ...inputStyle, marginBottom: '8px', textAlign: 'left' }}
          />
          <input
            type="text"
            value={form.customUrl}
            onChange={(e) => setForm({ ...form, customUrl: e.target.value })}
            placeholder="https://..."
            style={{ ...inputStyle, marginBottom: 0, textAlign: 'left' }}
          />
        </div>

        <div style={{ ...fieldCardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#ccc' }}>テーマカラー</span>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #555', background: 'none', cursor: 'pointer' }}
          />
        </div>

        <div style={fieldCardStyle}>
          <div style={fieldLabelStyle}>パスワード（数字4桁）</div>
          <input
            type="password"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            placeholder="1234"
            maxLength={4}
            inputMode="numeric"
            required
            style={{ ...inputStyle, marginBottom: 0 }}
          />
        </div>

        <div style={fieldCardStyle}>
          <div style={fieldLabelStyle}>あいことば（パスワード忘れ防止用）</div>
          <input
            type="text"
            value={form.secretWord}
            onChange={(e) => setForm({ ...form, secretWord: e.target.value })}
            placeholder="例: 飼い犬の名前など"
            required
            style={{ ...inputStyle, marginBottom: 0, textAlign: 'left' }}
          />
        </div>

        <button type="submit" disabled={saving} style={{ ...btnStyle, marginTop: '10px' }}>
          {saving ? '保存中...' : (isNew ? '登録する' : '更新する')}
        </button>

        {!isNew && (
          <div style={{ marginTop: '15px' }}>
            <a href={`?tagId=${tagId}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>
              ← プロフィールに戻る
            </a>
          </div>
        )}
      </form>
    </div>
  );
}

function ProfilePage({ data, tagId }: { data: any; tagId: string }) {
  const hex = (data.color || '#ff007f').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const tc = (r * 299 + g * 587 + b * 114) / 1000 > 125 ? '#111' : '#fff';

  const links = [
    { show: data.ig && data.igShow, url: data.ig?.startsWith('http') ? data.ig : `https://instagram.com/${data.ig?.replace('@', '')}`, name: 'Instagram' },
    { show: data.tk && data.tkShow, url: data.tk?.startsWith('http') ? data.tk : `https://tiktok.com/@${data.tk?.replace('@', '')}`, name: 'TikTok' },
    { show: data.x && data.xShow, url: data.x?.startsWith('http') ? data.x : `https://x.com/${data.x?.replace('@', '')}`, name: 'X (Twitter)' },
    { show: data.yt && data.ytShow, url: data.yt?.startsWith('http') ? data.yt : `https://youtube.com/${data.yt}`, name: 'YouTube' },
    { show: data.bereal && data.berealShow, url: data.bereal?.startsWith('http') ? data.bereal : `https://${data.bereal}`, name: 'BeReal' },
    { show: data.line && data.lineShow, url: data.line?.startsWith('http') ? data.line : `https://${data.line}`, name: 'LINE' },
    { show: data.customUrl && data.customShow, url: data.customUrl?.startsWith('http') ? data.customUrl : `https://${data.customUrl}`, name: data.customName || 'カスタムリンク' },
  ];

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '20px' }}>
        {data.image ? (
          <img src={data.image} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block', border: `2px solid ${data.color || '#ff007f'}` }} />
        ) : (
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#666', fontSize: '12px' }}>No Image</div>
        )}
        <h1 style={{ fontSize: '18px', marginBottom: '4px', fontWeight: 'bold' }}>💎 NOVA Profile</h1>
        <p style={{ fontSize: '11px', color: '#777' }}>ID: {tagId}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        {links.map((link, idx) => link.show && (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: data.color || '#ff007f',
              color: tc,
              padding: '14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {link.name}
          </a>
        ))}
      </div>

      <div>
        <a
          href={`?tagId=${tagId}&path=edit`}
          style={{ fontSize: '12px', color: '#aaa', textDecoration: 'underline' }}
        >
          情報を編集する
        </a>
      </div>

      <div style={{ marginTop: '40px', fontSize: '10px', color: '#555' }}>
        Powered by NOVA
      </div>
    </div>
  );
}

const containerStyle = {
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto',
  textAlign: 'center',
  background: '#111',
  color: '#fff',
  minHeight: '100vh',
  padding: '30px 20px',
  boxSizing: 'border-box',
  fontFamily: 'sans-serif',
} as const;

const boxStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  boxSizing: 'border-box',
  textAlign: 'left',
} as const;

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: '#222',
  border: '1px solid #444',
  color: '#fff',
  borderRadius: '8px',
  fontSize: '16px',
  marginBottom: '15px',
  boxSizing: 'border-box',
  outline: 'none',
  textAlign: 'center',
} as const;

const btnStyle = {
  width: '100%',
  background: '#ff007f',
  color: '#fff',
  border: 'none',
  padding: '14px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
} as const;

const fieldCardStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '12px',
  marginBottom: '12px',
  boxSizing: 'border-box',
  textAlign: 'left',
} as const;

const fieldLabelStyle = {
  fontSize: '11px',
  color: '#aaa',
  marginBottom: '4px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
} as const;

const checkboxWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  color: '#ccc',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const;
