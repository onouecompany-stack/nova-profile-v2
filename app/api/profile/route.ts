import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId') || 'default';

  const profileData = {
    tagId,
    name: 'NOVA プロフィール',
    bio: 'プロフィールページへようこそ！',
  };

  return NextResponse.json(profileData);
}
