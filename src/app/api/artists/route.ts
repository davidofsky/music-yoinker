import { NextResponse } from 'next/server';
import Hifi from '@/lib/hifi';
import { getQueryParam, validateRequiredParam, handleApiCall } from '@/lib/apiUtils';

export async function GET(req: Request) {
  const query = getQueryParam(req, 'query');
  const validationError = validateRequiredParam(query, 'query');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    () => Hifi.searchArtist(query!),
    'Search failed'
  );

  return error || NextResponse.json(data);
}