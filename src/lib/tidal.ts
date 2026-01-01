import axios from "axios";

type TidalAlbum = {
  id: string,
  date: string
  albumArtist: string
}

export default class Tidal {
  private static API_BASE = 'https://openapi.tidal.com/v2/';
  private static COUNTRY = 'US';

  private static readonly MAX_MEMORIZED_ALBUMS = 5;
  private static tidalAlbums: TidalAlbum[] = [];
  
  private static authToken = "";
  private static tokenExpiry: number = 0;

  private static async getAuthToken() {
    console.info("Retrieving authentication token from Tidal");
    
    const credentials = btoa(`${process.env.TIDAL_CLIENT_ID}:${process.env.TIDAL_CLIENT_SECRET}`);
    
    const result = await axios.post('https://auth.tidal.com/v1/oauth2/token', 
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.authToken = result.data.access_token;

    try {
      const payload = this.authToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      this.tokenExpiry = (decoded.exp * 1000); // <-- x 1000 to convert to MS
    } catch (e) {
      console.error("Failed to get expiration date of tidal JWT token: ", e)
      this.tokenExpiry = Date.now();
    }

    console.error("Retrieved auth token from Tidal.")
  }

  // Returns false if authToken doesnt exist, or if the token expires within 10 seconds
  private static isTokenExpired(): boolean {
    return !this.authToken || Date.now() + 10000 >= this.tokenExpiry;
  }

  public static async getAlbum(albumId: string, firstAttempt = true) : Promise<TidalAlbum> {
    const memory = this.tidalAlbums.find(a => a.id === albumId);
    if (memory) return memory;

    if (this.isTokenExpired()) {
      await this.getAuthToken();
    }

    try {
      const result = await axios.get(`${this.API_BASE}albums/${albumId}`, {
        headers: {
          "accept": "application/vnd.api+json",
          "authorization": `Bearer ${this.authToken}`
        },
        params: { 
          countryCode: this.COUNTRY,
          include: "artists"
        }
      });

      const tidalAlbum: TidalAlbum = {
        id: albumId,
        date: result.data.data.attributes.releaseDate,
        albumArtist: result.data.included.find((i:any) => i.type ="artists").attributes.name
      }
      
      this.tidalAlbums.push(tidalAlbum);
      if (this.tidalAlbums.length > this.MAX_MEMORIZED_ALBUMS) {
        this.tidalAlbums.shift();
      }
      
      return tidalAlbum;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401 && firstAttempt) {
        console.warn(`401 Unauthorized for album ${albumId}.`);
        await this.getAuthToken();
        return this.getAlbum(albumId, false); 
      }

      console.error(`Error fetching album from Tidal with ID ${albumId}:`, e);
      throw e;
    }
  }
}
