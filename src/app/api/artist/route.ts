import { NextResponse } from 'next/server';
import Hifi from '@/lib/hifi';
import Downloader from '@/lib/downloader';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Parameter 'id' is required" }, { status: 400 });

  try {
    const result = await Hifi.searchArtistAlbums(id);

    const albumsWithStatus = await Promise.all(
      result.map(async (album) => {
        const isDownloaded = await Downloader.IsAlbumDownloaded(album);
        return { ...album, isDownloaded };
      })
    );

    return NextResponse.json(albumsWithStatus);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Retrieve failed' }, { status: 500 });
  }
}

