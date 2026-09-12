import axios from "axios";
import Config from "./config";
import logger from "./logger";

type TrackMatch = {
  id: string
  title: string
  artist: string
  url: string
}

export default class Lucida {

  /**
   * Strips cosmetic differences so titles from two catalogs can be compared:
   * remove accents (NFD), lowercases, and collapses whitespace.
   */
  private static normalize(value: string): string {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  public async getDownloadUrl(artist: string, title: string): Promise<string> {
    const baseUrl = Config.LUCIDA_API_URL.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('LUCIDA_API_URL is not configured.');

    logger.info(`[Lucida] Searching for ${title} by ${artist}`);

    let matches: TrackMatch[] = [];
    try {
      const response = await axios.get<TrackMatch[]>(`${baseUrl}/search`, {
        params: { artist, track: title }
      });
      matches = response.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        logger.debug(`[Lucida] Search returned no results for ${title} by ${artist}`);
      } else {
        throw e;
      }
    }

    const match = matches.find(m =>
      Lucida.normalize(m.artist) === Lucida.normalize(artist) &&
      Lucida.normalize(m.title) === Lucida.normalize(title)
    );

    if (!match) throw new Error(`No valid match found in amazon for ${title} by ${artist}`);

    return `${baseUrl}/download?url=${encodeURIComponent(match.url)}&metadata=false&private=true`;
  }
}