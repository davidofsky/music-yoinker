import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import Hifi from '@/lib/hifi';
import { getQueryParam, validateRequiredParam, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const id = getQueryParam(req, 'id');
  const validationError = validateRequiredParam(id, 'id');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    () => Hifi.searchAlbumTracks(id!),
    'Retrieve failed'
  );

  return error || NextResponse.json(data);
}