import axios from "axios";
import logger from "./logger";

const SONGLINK_BASE = 'https://song.link/';
// Odesli queries every platform live for a recording it has not cached, which
// regularly runs past 15s; once warm the same lookup comes back in about one.
const REQUEST_TIMEOUT_MS = 45000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export default class Songlink {

  /**
   * Turns a track URL on any service Odesli knows into the Amazon Music track
   * URL lucida wants.
   *
   * Amazon's own catalogue is shut: it stopped issuing anonymous tokens, and its
   * search page renders nothing without one, not even driven by a real browser.
   * Odesli goes around that. Its API now answers PUBLIC_API_ACCESS_DEPRECATED,
   * but the song.link page it serves to browsers still renders the Amazon link,
   * and renders it as `/albums/<album>?trackAsin=<track>` - the form lucida
   * takes, with the ASIN sitting right in it.
   */
  public static async resolveAmazonUrl(trackUrl: string): Promise<string> {
    let page: string;
    try {
      // Concatenated, not resolved: song.link takes the whole URL as its path,
      // unencoded, and `new URL()` would resolve that away to the target service.
      const response = await axios.get<string>(SONGLINK_BASE + trackUrl, {
        headers: { 'user-agent': USER_AGENT, 'accept-language': 'en-US,en;q=0.9' },
        responseType: 'text',
        timeout: REQUEST_TIMEOUT_MS
      });
      page = response.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        throw new Error(`[Songlink] Odesli knows no track at ${trackUrl}`);
      }
      throw e;
    }

    const asin = this.amazonAsin(page);
    if (!asin) throw new Error(`[Songlink] Odesli lists no Amazon Music release for ${trackUrl}`);

    logger.debug(`[Songlink] Resolved ${trackUrl} to ASIN ${asin}`);

    return `https://music.amazon.com/tracks/${asin}`;
  }

  /**
   * Odesli renders Amazon as an album URL with the track hanging off a query
   * parameter, and as a store link. Either carries the ASIN.
   */
  private static amazonAsin(page: string): string | undefined {
    return /music\.amazon\.[a-z.]+\/albums\/[A-Z0-9]{10}\?trackAsin=([A-Z0-9]{10})/.exec(page)?.[1]
      ?? /music\.amazon\.[a-z.]+\/tracks\/([A-Z0-9]{10})/.exec(page)?.[1]
      ?? /amazon\.[a-z.]+\/dp\/([A-Z0-9]{10})/.exec(page)?.[1];
  }
}
