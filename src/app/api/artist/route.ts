import { NextResponse } from 'next/server';
import Hifi from '@/lib/hifi';
import Downloader from '@/lib/downloader';
import { getQueryParam, validateRequiredParam, addDownloadStatus, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const id = getQueryParam(req, 'id');
  const validationError = validateRequiredParam(id, 'id');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    async () => {
      const result = await Hifi.searchArtistAlbums(id!);
      return addDownloadStatus(result, (album) => Downloader.IsAlbumDownloaded(album));
    },
    'Retrieve failed'
  );

  return error || NextResponse.json(data);
}