import { NextRequest, NextResponse } from 'next/server';
import LastFm from '@/lib/lastfm';
import { readLastFmSession } from '@/lib/lastfmSession';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    enabled: LastFm.enabled,
    username: readLastFmSession(req)?.name ?? null,
  });
}
