import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Parameter 'id' is required" }, { status: 400 });

  try {
    const errorMessage = Downloader.RemoveFromQueue(id);
    if (errorMessage) {
      return NextResponse.json({ status: 'Bad request', message: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ status: 'OK' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to remove from queue' }, { status: 500 });
  }
}

