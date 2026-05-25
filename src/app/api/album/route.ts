import { NextResponse } from 'next/server';
import musicRepository from '@/lib/music.repository';
import { getQueryParam, validateRequiredParam, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const id = getQueryParam(req, 'id');
  const source = getQueryParam(req, 'source');
  const validationError = validateRequiredParam(id, 'id');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    () => musicRepository.searchAlbumTracks(id!, source),
    'Retrieve failed'
  );

  return error || NextResponse.json(data);
}
