import { NextRequest, NextResponse } from 'next/server';
import LastFm from '@/lib/lastfm';
import { publicOrigin } from '@/lib/lastfmSession';

export async function GET(req: NextRequest) {
  if (!LastFm.enabled) return NextResponse.json({ error: 'Last.fm is not configured' }, { status: 503 });
  return NextResponse.redirect(LastFm.authUrl(`${publicOrigin(req)}/api/lastfm/callback`));
}
