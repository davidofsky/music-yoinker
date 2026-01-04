import { NextResponse } from 'next/server';
import Hifi from '@/lib/hifi';

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get('query');
  if (!query) return NextResponse.json({ error: "Parameter 'query' is required" }, { status: 400 });

  try {
    const result = await Hifi.searchArtist(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

