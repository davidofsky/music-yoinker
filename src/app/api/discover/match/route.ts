import { NextResponse } from 'next/server';
import discovery, { MatchResult } from '@/lib/discovery';
import Downloader from '@/lib/downloader';
import { handleApiCall } from '@/lib/apiUtils';

const MAX_BATCH = 20;

// Looks up [{ artist, title }, …]; "failed" isn't "missing".
export async function POST(req: Request) {
  const { data, error } = await handleApiCall(async () => {
    const items = await req.json();
    if (!Array.isArray(items) || items.length > MAX_BATCH) throw new Error('Invalid batch');
    const wanted = items.map(i => ({ artist: String(i?.artist ?? ''), title: String(i?.title ?? '') }));

    const results = await discovery.match(wanted);
    return Promise.all(results.map(async (r): Promise<MatchResult> =>
      r.status === 'found' ? { status: 'found', track: { ...r.track, isDownloaded: await Downloader.IsTrackDownloaded(r.track) } } : r
    ));
  }, 'Matching failed');

  return error || NextResponse.json(data);
}
