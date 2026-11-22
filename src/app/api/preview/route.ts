import { NextRequest, NextResponse } from 'next/server';
import musicRepository from '@/lib/music.repository';
import { DownloadTrackSource } from '@/lib/hifi';

// Proxies a preview stream to <audio>; Range is forwarded for seeking.

// Every seek is a new request, so don't resolve the stream URL each time.
const URL_TTL_MS = 10 * 60 * 1000;
const resolved = new Map<string, { at: number; source: Promise<DownloadTrackSource> }>();

function resolve(id: string, source: string | null, fresh: boolean): Promise<DownloadTrackSource> {
  const key = `${source}|${id}`;
  for (const [k, v] of resolved) if (Date.now() - v.at > URL_TTL_MS) resolved.delete(k);
  const cached = resolved.get(key);
  if (cached && !fresh) return cached.source;

  const src = musicRepository.previewTrack(id, source);
  src.catch(() => resolved.delete(key));
  resolved.set(key, { at: Date.now(), source: src });
  return src;
}

const PASSTHROUGH = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

// Lossy previews are single files; DASH isn't supported.
async function fetchUpstream(src: DownloadTrackSource, range: string | null): Promise<Response> {
  if (src.type !== 'direct') throw new Error(`Unsupported preview stream type: ${src.type}`);
  return fetch(src.url, { headers: { ...src.fetchHeaders, ...(range ? { Range: range } : {}) } });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const source = req.nextUrl.searchParams.get('source');
  if (!id) return NextResponse.json({ error: "Parameter 'id' is required" }, { status: 400 });
  const range = req.headers.get('range');

  try {
    let upstream = await fetchUpstream(await resolve(id, source, false), range);
    // Stream URLs expire: retry once with a fresh one.
    if (upstream.status === 403 || upstream.status === 404 || upstream.status === 410) {
      upstream = await fetchUpstream(await resolve(id, source, true), range);
    }
    if (!upstream.ok) {
      logger.warn(`[Preview] Upstream returned HTTP ${upstream.status} for ${source}:${id}`);
      return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    }

    const headers = new Headers({ 'Cache-Control': 'private, no-store' });
    for (const h of PASSTHROUGH) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    logger.error(`[Preview] Failed for ${source}:${id}:`, err);
    return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
  }
}
