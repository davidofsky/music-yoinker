import { NextRequest, NextResponse } from 'next/server';
import { LastFmSession } from './lastfm';

const COOKIE = 'lastfm_session';

// Session lives in an httpOnly cookie; nothing is stored server-side.
export function readLastFmSession(req: NextRequest): LastFmSession | null {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString());
    return parsed?.name && parsed?.key ? { name: parsed.name, key: parsed.key } : null;
  } catch {
    return null;
  }
}

export function writeLastFmSession(res: NextResponse, req: NextRequest, session: LastFmSession) {
  res.cookies.set(COOKIE, Buffer.from(JSON.stringify(session)).toString('base64url'), {
    httpOnly: true,
    sameSite: 'lax',
    secure: publicOrigin(req).startsWith('https:'),
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 10, // Last.fm session keys don't expire.
  });
}

// Public URL; differs from Next.js's own behind a reverse proxy.
export function publicOrigin(req: NextRequest): string {
  if (process.env.AUTH_URL) return new URL(process.env.AUTH_URL).origin;
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0] ?? req.nextUrl.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host')?.split(',')[0] ?? req.headers.get('host') ?? req.nextUrl.host;
  return `${proto}://${host}`;
}
