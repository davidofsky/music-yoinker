import { NextResponse } from 'next/server';
import Downloader from '@/lib/downloader';
import Hifi from '@/lib/hifi';
import logger from '@lib/logger';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ 
      error: "Parameter 'query' is required" }, 
      { status: 400 });
  }

  try {
    const result = await Hifi.searchAlbum(query);

    const albumsWithStatus = await Promise.all(
      result.map(async (album) => {
        const isDownloaded = await Downloader.IsAlbumDownloaded(album);
        return { ...album, isDownloaded };
      })
    );

    return NextResponse.json(albumsWithStatus);
  } catch (err) {
    logger.error(err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

