import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import Hifi from '@/lib/hifi';
import { getQueryParam, validateRequiredParam, addDownloadStatus, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const query = getQueryParam(req, 'query');
  const validationError = validateRequiredParam(query, 'query');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    async () => {
      const result = await Hifi.searchTrack(query!);
      return addDownloadStatus(result, (track) => Downloader.IsTrackDownloaded(track));
    },
    'Search failed'
  );

  return error || NextResponse.json(data);
}

export async function POST(req: Request) {
  const { data, error } = await handleApiCall(
    async () => {
      const tracks = await req.json();

      if (!Array.isArray(tracks)) {
        throw new Error('Invalid tracks data');
      }

      Downloader.AddToQueue(tracks);
      return { status: 'OK' };
    },
    'Failed to add to queue'
  );

  return error || NextResponse.json(data);
}