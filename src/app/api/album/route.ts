import { NextResponse } from 'next/server';
import Hifi from '@/lib/hifi';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Parameter 'id' is required" }, { status: 400 });

  try {
    const result = await Hifi.searchAlbumTracks(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Retrieve failed' }, { status: 500 });
  }
}

