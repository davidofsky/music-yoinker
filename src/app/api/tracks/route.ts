import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import Hifi from '@/lib/hifi';

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get('query');
  if (!query) {
    return NextResponse.json({ error: "Parameter 'query' is required" }, { status: 400 });
  }
  
  try {
    const result = await Hifi.searchTrack(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tracks = await req.json();
    
    if (!Array.isArray(tracks)) {
      return NextResponse.json({ error: 'Invalid tracks data' }, { status: 400 });
    }
    
    Downloader.AddToQueue(tracks);
    return NextResponse.json({ status: 'OK' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add to queue' }, { status: 500 });
  }
}
