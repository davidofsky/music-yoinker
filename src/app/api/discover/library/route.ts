import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import { handleApiCall } from '@/lib/apiUtils';
import { ITrack } from '@/app/interfaces/track.interface';

const MAX_BATCH = 20;

// Which matched tracks are in the library? No searches.
export async function POST(req: Request) {
  const { data, error } = await handleApiCall(async () => {
    const tracks = await req.json();
    if (!Array.isArray(tracks) || tracks.length > MAX_BATCH) throw new Error('Invalid batch');
    return Promise.all(tracks.map((t: ITrack) =>
      t?.artist?.name && t?.album?.title ? Downloader.IsTrackDownloaded(t) : Promise.resolve(false)
    ));
  }, 'Library check failed');

  return error || NextResponse.json(data);
}
