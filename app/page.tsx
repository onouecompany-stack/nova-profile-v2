'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile?tagId=default')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('データ取得エラー:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>読み込み中...</div>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>{profile?.name}</h1>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>{profile?.bio}</p>
      <hr style={{ margin: '1.5rem 0', border: '0', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: '0.85rem', color: '#888' }}>現在のTag ID: {profile?.tagId}</p>
    </main>
  );
}
