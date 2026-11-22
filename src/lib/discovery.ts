import LastFm, { LastFmPeriod, LastFmSession, LastFmTrack } from './lastfm';
import musicRepository from './music.repository';
import { ITrack } from '@/app/interfaces/track.interface';

// Suggestions from your Last.fm listening. See docs/discovery.md.

export type DiscoverPeriod = Extract<LastFmPeriod, '7day' | '1month' | '3month'>;
export const DISCOVER_PERIODS: DiscoverPeriod[] = ['7day', '1month', '3month'];

export interface DiscoverTrack {
  artist: string;
  title: string;
  score: number;
  // Seed that contributed most.
  because: string;
}

export interface DiscoverArtist {
  name: string;
  score: number;
  because: string;
}

// "failed" (search error) is not the same as "missing".
export type MatchResult = { status: 'found'; track: ITrack } | { status: 'missing' } | { status: 'failed' };

export interface DiscoverFeed {
  username: string;
  period: DiscoverPeriod;
  generatedAt: number;
  tracks: DiscoverTrack[];
  artists: DiscoverArtist[];
}

const TOP_SEEDS = 30;
const RECENT_SEEDS = 20;
const ARTIST_SEEDS = 20;
const SIMILAR_TRACKS_PER_SEED = 30;
const SIMILAR_ARTISTS_PER_SEED = 20;
const KNOWN_TRACKS = 1000;
const KNOWN_ARTISTS = 500;
const MAX_PER_ARTIST = 2;
const FEED_TRACKS = 50;
const FEED_ARTISTS = 20;
const LASTFM_CONCURRENCY = 4; // Last.fm allows ~5 requests/s
const FEED_TTL_MS = 6 * 60 * 60 * 1000;
const NO_MATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// normalising

const stripAccents = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
const NOISE = /\b(remaster(ed)?|radio edit|single version|album version|edit|mono|stereo|deluxe|explicit|clean|bonus track|feat\.?|ft\.?|featuring|with)\b/i;
const VARIANT = /\b(live|remix|acoustic|instrumental|karaoke|demo|cover|sped up|slowed|reverb)\b/i;

// "Song (Remastered) - Radio Edit" equals "song"; "Song (Live)" doesn't.
export function normTitle(title: string): string {
  return stripAccents(title.toLowerCase())
    .replace(/\s*[([]([^)\]]*)[)\]]/g, (_, inner: string) => (NOISE.test(inner) ? '' : ` ${inner}`))
    .replace(/\s+-\s+(.*)$/, (_, rest: string) => (NOISE.test(rest) ? '' : ` ${rest}`))
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normArtist(name: string): string {
  return stripAccents(name.toLowerCase())
    .replace(/\s+(feat\.?|ft\.?|featuring)\s.*$/, '')
    .replace(/^the\s+/, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const trackKey = (t: { artist: string; title: string }) => `${normArtist(t.artist)}|${normTitle(t.title)}`;

// helpers

// At most `limit` in flight; failures become null.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        logger.warn(`[Discovery] ${(err as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface Scored { score: number; because: string; bestContribution: number }

function addScore<T extends Scored>(map: Map<string, T>, key: string, contribution: number, seed: string, create: () => T) {
  const entry = map.get(key) ?? create();
  entry.score += contribution;
  if (contribution > entry.bestContribution) {
    entry.bestContribution = contribution;
    entry.because = seed;
  }
  map.set(key, entry);
}


class Discovery {
  private feeds = new Map<string, { at: number; feed: Promise<DiscoverFeed> }>();
  // Memory only: a restart clears it.
  private matches = new Map<string, { at: number; track: ITrack | null }>();

  getFeed(session: LastFmSession, period: DiscoverPeriod, refresh = false): Promise<DiscoverFeed> {
    // Include the key: the cookie is unsigned, so a username alone can be forged.
    const key = `${session.name}|${session.key}|${period}`;
    const cached = this.feeds.get(key);
    if (cached && !refresh && Date.now() - cached.at < FEED_TTL_MS) return cached.feed;

    const feed = this.buildFeed(session, period);
    feed.catch(() => this.feeds.delete(key)); // don't cache failures
    this.feeds.set(key, { at: Date.now(), feed });
    return feed;
  }

  private async buildFeed(session: LastFmSession, period: DiscoverPeriod): Promise<DiscoverFeed> {
    const started = Date.now();
    const [top, recent, topArtists, knownTracks, knownArtists] = await Promise.all([
      LastFm.getTopTracks(session, period, TOP_SEEDS),
      LastFm.getRecentTracks(session, RECENT_SEEDS),
      LastFm.getTopArtists(session, period, ARTIST_SEEDS),
      LastFm.getTopTracks(session, 'overall', KNOWN_TRACKS),
      LastFm.getTopArtists(session, 'overall', KNOWN_ARTISTS),
    ]);

    // Seeds, weighted by plays.
    const seeds = new Map<string, LastFmTrack & { weight: number }>();
    for (const t of top) seeds.set(trackKey(t), { ...t, weight: Math.log1p(t.playcount ?? 0) });
    for (const t of recent) if (!seeds.has(trackKey(t))) seeds.set(trackKey(t), { ...t, weight: 1 });

    const known = new Set([...knownTracks, ...recent].map(trackKey));
    for (const k of seeds.keys()) known.add(k);

    // Similar tracks, scored by weight(amount) * match(seed, track).
    const candidates = new Map<string, DiscoverTrack & Scored>();
    const seedList = [...seeds.values()];
    const similar = await mapLimit(seedList, LASTFM_CONCURRENCY, s => LastFm.getSimilarTracks(s.artist, s.title, SIMILAR_TRACKS_PER_SEED));
    similar.forEach((list, i) => {
      const seed = seedList[i];
      for (const t of list ?? []) {
        const key = trackKey(t);
        if (known.has(key) || !t.artist || !t.title) continue;
        addScore(candidates, key, seed.weight * (t.match ?? 0), `${seed.artist} – ${seed.title}`,
          () => ({ artist: t.artist, title: t.title, score: 0, because: '', bestContribution: 0 }));
      }
    });

    const perArtist = new Map<string, number>();
    const tracks: DiscoverTrack[] = [];
    for (const c of [...candidates.values()].sort((a, b) => b.score - a.score)) {
      const a = normArtist(c.artist);
      if ((perArtist.get(a) ?? 0) >= MAX_PER_ARTIST) continue;
      perArtist.set(a, (perArtist.get(a) ?? 0) + 1);
      tracks.push({ artist: c.artist, title: c.title, score: c.score, because: c.because });
      if (tracks.length >= FEED_TRACKS) break;
    }

    // Similar artists you don't already listen to.
    const knownArtistSet = new Set([...knownArtists, ...topArtists].map(a => normArtist(a.name)));
    const artistCandidates = new Map<string, DiscoverArtist & Scored>();
    const similarArtists = await mapLimit(topArtists, LASTFM_CONCURRENCY, a => LastFm.getSimilarArtists(a.name, SIMILAR_ARTISTS_PER_SEED));
    similarArtists.forEach((list, i) => {
      const seed = topArtists[i];
      for (const a of list ?? []) {
        const key = normArtist(a.name);
        if (!key || knownArtistSet.has(key)) continue;
        addScore(artistCandidates, key, Math.log1p(seed.playcount ?? 0) * (a.match ?? 0), seed.name,
          () => ({ name: a.name, score: 0, because: '', bestContribution: 0 }));
      }
    });
    const artists = [...artistCandidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, FEED_ARTISTS)
      .map(({ name, score, because }) => ({ name, score, because }));

    logger.info(`[Discovery] Feed for ${session.name} (${period}): ${seeds.size} seeds, ${candidates.size} candidates, ${tracks.length} tracks, ${artists.length} artists in ${Date.now() - started}ms`);
    return { username: session.name, period, generatedAt: Date.now(), tracks, artists };
  }

  // matching

  // Same title and artist, and no live/remix unless asked for.
  private pick(results: ITrack[], wanted: { artist: string; title: string }): ITrack | null {
    const title = normTitle(wanted.title);
    const artist = normArtist(wanted.artist);
    const wantsVariant = VARIANT.test(wanted.title);

    const same = results.filter(r => {
      if (normTitle(r.title) !== title) return false;
      const names = [r.artist, ...(r.artists ?? [])].filter(Boolean).map(a => normArtist(a.name));
      return names.some(n => n === artist || artist.startsWith(`${n} `));
    });
    const isVariant = (r: ITrack) => VARIANT.test(`${r.title} ${r.version ?? ''}`);
    return same.find(r => isVariant(r) === wantsVariant) ?? (wantsVariant ? same[0] : null) ?? null;
  }

  private async matchOne(wanted: { artist: string; title: string }): Promise<ITrack | null> {
    const cache = this.matches;
    const key = trackKey(wanted);
    const hit = cache.get(key);
    if (hit && (hit.track || Date.now() - hit.at < NO_MATCH_TTL_MS)) return hit.track;

    const query = `${wanted.artist} ${wanted.title.replace(/\s*[([][^)\]]*[)\]]/g, '')}`;
    for (const source of musicRepository.sources) {
      // A failed search throws, so it isn't cached as missing.
      const track = this.pick(await musicRepository.matchTrack(query, source), wanted);
      if (track) {
        cache.set(key, { at: Date.now(), track });
        return track;
      }
    }
    cache.set(key, { at: Date.now(), track: null });
    return null;
  }

  // Looks each suggestion up on Tidal/Qobuz.
  async match(items: { artist: string; title: string }[]): Promise<MatchResult[]> {
    const results = await mapLimit(items, 2, async (item): Promise<MatchResult> => {
      const track = await this.matchOne(item);
      return track ? { status: 'found', track } : { status: 'missing' };
    });
    return results.map(r => r ?? { status: 'failed' }); // null = search threw
  }
}

declare global {
  var discovery: Discovery;
}

if (!global.discovery) {
  global.discovery = new Discovery();
}

export default global.discovery;