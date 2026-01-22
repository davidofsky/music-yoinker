import { NextResponse } from 'next/server';
import logger from '@lib/logger';
import Downloader from '@/lib/downloader';

export async function GET() {
  try {
    const queue = Downloader.GetQueue();
    return NextResponse.json(queue);
  } catch (err) {
    logger.error(err);
    return NextResponse.json({ error: 'Failed to get queue' }, { status: 500 });
  }
}

