import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';

export async function GET() {
  try {
    const queue = Downloader.GetQueue();
    return NextResponse.json(queue);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to get queue' }, { status: 500 });
  }
}

