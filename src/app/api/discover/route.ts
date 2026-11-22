import { NextRequest, NextResponse } from 'next/server';
import LastFm from '@/lib/lastfm';
import { readLastFmSession } from '@/lib/lastfmSession';
import discovery, { DISCOVER_PERIODS, DiscoverPeriod } from '@/lib/discovery';

export async function GET(req: NextRequest) {
  if (!LastFm.enabled) return NextResponse.json({ error: 'Last.fm is not configured' }, { status: 503 });
  const session = readLastFmSession(req);
  if (!session) return NextResponse.json({ error: 'Not connected to Last.fm' }, { status: 401 });

  const requested = req.nextUrl.searchParams.get('period') as DiscoverPeriod;
  const period = DISCOVER_PERIODS.includes(requested) ? requested : '1month';
  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  try {
    return NextResponse.json(await discovery.getFeed(session, period, refresh));
  } catch (err) {
    logger.error('[Discovery] Building feed failed:', err);
    return NextResponse.json({ error: 'Could not build the discovery feed' }, { status: 502 });
  }
}
