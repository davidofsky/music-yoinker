import axios from "axios";

type AlbumRelease = {
  id: string,
  date: string
}

export default class Tidal {
  private static API_BASE = 'https://openapi.tidal.com/v2/';
  private static COUNTRY = 'US';

  private static readonly MAX_MEMORIZED_ALBUMS = 5;
  private static albumReleases: AlbumRelease[] = [];
  private static authToken = "";

  private static async getAuthToken () {
    console.info(process.env.TIDAL_CLIENT_ID,)
    console.info("retrieving authentication token from Tidal")
    const credentials = "basic " + btoa(`${process.env.TIDAL_CLIENT_ID}:${process.env.TIDAL_CLIENT_SECRET}`)
    const result = await axios.post('https://auth.tidal.com/v1/oauth2/token', 

    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        Authorization: credentials
      }
    })

    this.authToken = result.data.access_token;
  }

  public static async getReleaseData(albumId: string) {
    const memory = this.albumReleases.find(a => a.id === albumId);
    if (memory) return memory.date;

    try {
      if (this.authToken.trim() === "") await this.getAuthToken()

      console.info(`Fetching album from Tidal with ID: ${albumId}`);
      const result = await axios.get(`${this.API_BASE}albums/${albumId}`, {
        headers: {
          "accept": "application/vnd.api+json",
          "authorization": "bearer " + this.authToken
        },
        params: {
          countryCode: this.COUNTRY,
          explicitFilter: "include",
        }
      })

      const release = result.data.data.attributes.releaseDate
      console.info(`Fetched album with ID ${albumId}`);

      this.albumReleases.push({
        id: albumId,
        date: release
      });
      if (this.albumReleases.length > this.MAX_MEMORIZED_ALBUMS) {
        this.albumReleases.shift();
      }
      return release
    } catch (e) {
      console.error(`Error fetching album releasedate with ID ${albumId}:`, e);
      throw e;
    }
  }
} 
