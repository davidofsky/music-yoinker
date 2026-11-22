import { NextRequest, NextResponse } from 'next/server';
import LastFm from '@/lib/lastfm';
import { publicOrigin, writeLastFmSession } from '@/lib/lastfmSession';

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const token = req.nextUrl.searchParams.get('token');
  if (!LastFm.enabled || !token) return NextResponse.redirect(`${origin}/discover?lastfm=error`);

  try {
    const session = await LastFm.getSession(token);
    const res = NextResponse.redirect(`${origin}/discover`);
    writeLastFmSession(res, req, session);
    return res;
  } catch (err) {
    logger.error('[LastFm] Sign-in failed:', err);
    return NextResponse.redirect(`${origin}/discover?lastfm=error`);
  }
}
