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
      const result = await Hifi.searchAlbum(query!);
      return addDownloadStatus(result, (album) => Downloader.IsAlbumDownloaded(album));
    },
    'Search failed'
  );

  return error || NextResponse.json(data);
}