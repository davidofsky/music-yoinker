const cache = new Map<string, Promise<string | null>>();

/**
 * Tidal only ships a vibrant colour for full albums (not singles) and Qobuz ships none at all,
 * so it is extracted here instead. This runs in the browser on purpose: the artwork is already
 * downloaded for display, and both CDNs allow cross-origin reads.
 */
export const getVibrantColor = (imageUrl: string): Promise<string | null> => {
  const cached = cache.get(imageUrl);
  if (cached) return cached;

  const pending = (async () => {
    try {
      const { Vibrant } = await import('node-vibrant/browser');
      const palette = await new Vibrant(imageUrl).getPalette();
      return palette.Vibrant?.hex ?? palette.Muted?.hex ?? null;
    } catch {
      // Unreadable or cross-origin-blocked artwork: the caller keeps its default.
      return null;
    }
  })();

  cache.set(imageUrl, pending);
  return pending;
};
