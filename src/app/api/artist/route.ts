import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import musicRepository from '@/lib/music.repository';
import { getQueryParam, validateRequiredParam, addDownloadStatus, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const id = getQueryParam(req, 'id');
  const source = getQueryParam(req, 'source');
  const validationError = validateRequiredParam(id, 'id');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    async () => {
      const result = await musicRepository.searchArtistAlbums(id!, source);
      return addDownloadStatus(result, (album) => Downloader.IsAlbumDownloaded(album));
    },
    'Retrieve failed'
  );

  return error || NextResponse.json(data);
}
