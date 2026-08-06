import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');

  if (!tagId) {
    return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
  }

  try {
    const data = await redis.get(`profile:${tagId}`);
    return NextResponse.json(data || { isReg: false });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tagId, ...profileData } = body;

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
    }

    // クラウド（Upstash KV）にデータをそのまま保存
    await redis.set(`profile:${tagId}`, profileData);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
