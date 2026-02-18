import { MusicBrainzApi } from 'musicbrainz-api';
import { MbReleaseGroup } from './interfaces';
import Version from './version';

export default class MusicBrainz {
  private static mbApi = new MusicBrainzApi({
    appName: 'music-yoinker',
    appVersion: Version.APP_VERSION,
    appContactInfo: 'https://github.com/davidofsky/music-yoinker',
  });

  public static async getGenres(
    title: string,
    artist: string,
    year: string,
    limit = 6 // mb tags can be added by anyone, so there could potentially be a hundred unwanted tags
  ): Promise<string[]> {
    logger.info(`Retrieving release from MusicBrainz for '${title}' by '${artist}'.`)
    const query = `artist:"${artist}" AND releasegroup:"${title}" AND firstreleasedate:${year}`;
    const result = await this.mbApi.search('release-group', { query });

    if (!result['release-groups'] || result['release-groups'].length === 0) {
      logger.warn(`Failed to get release from MusicBrainz for '${title}' by '${artist}'.`)
      return [];
    }
    const releaseGroup: MbReleaseGroup = result['release-groups'][0];

    if (!releaseGroup.tags || releaseGroup.tags.length === 0) {
      logger.warn(`No tags included in release from MusicBrainz for '${title}' by '${artist}'.`)
      return [];
    }
    return (releaseGroup.tags ?? [])
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, limit)
      .map(g => g.name);
  }
}