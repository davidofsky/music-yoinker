import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import { getQueryParam, validateRequiredParam, handleApiCall } from '@/lib/apiUtils';

export async function DELETE(req: Request) {
  const id = getQueryParam(req, 'id');
  const validationError = validateRequiredParam(id, 'id');
  if (validationError) return validationError;

  const { data, error } = await handleApiCall(
    async () => {
      const errorMessage = Downloader.RemoveFromQueue(id!);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      return { status: 'OK' };
    },
    'Failed to remove from queue'
  );

  return error || NextResponse.json(data);
}