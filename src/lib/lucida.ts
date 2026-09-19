import Config from "./config";
import logger from "./logger";
import Songlink from "./songlink";
import { ITrack } from "@/app/interfaces/track.interface";

export default class Lucida {

  /**
   * song.link keys off a public track URL, and Qobuz tracks carry none
   * (`qobuzDl` maps `url: ''`), so build one from the id. An unset `source`
   * means tidal, the same assumption `MusicRepository.getProvider` makes.
   */
  private static trackUrl(track: ITrack): string {
    return track.source === 'qobuz'
      ? `https://open.qobuz.com/track/${track.id}`
      : `https://tidal.com/track/${track.id}`;
  }

  public async getDownloadUrl(track: ITrack): Promise<string> {
    const baseUrl = Config.LUCIDA_API_URL.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('LUCIDA_API_URL is not configured.');

    logger.info(`[Lucida] Resolving ${track.title} by ${track.artist.name}`);

    const amazonUrl = await Songlink.resolveAmazonUrl(Lucida.trackUrl(track));

    return `${baseUrl}/download?url=${encodeURIComponent(amazonUrl)}&metadata=false&private=true`;
  }
}
