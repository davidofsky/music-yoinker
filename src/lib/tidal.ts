import process from 'process';
import axios from 'axios';
import { Album, Artist, Artwork, Track } from './interfaces';

export enum IncludeEnum {
  Albums="albums",
  Artists="artists",
  Tracks="tracks",
  CoverArt="coverArt",
  Artworks="artworks",
  Items="items"
} 

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Tidal {
  private static API_BASE = 'https://openapi.tidal.com/v2/';
  private static COUNTRY = 'US';

  private static async getAuthToken () {
    const credentials = "basic " + btoa(`${process.env.TIDAL_CLIENT_ID}:${process.env.TIDAL_CLIENT_SECRET}`)

    const result = await axios.post('https://auth.tidal.com/v1/oauth2/token', 
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        Authorization: credentials
      }
    })

    return result.data.access_token;
  }

  public static async GetAlbum (id: string, _authToken?: string) : Promise<Album> {
    const authToken = _authToken || await this.getAuthToken();

    const result = await axios.get(`${this.API_BASE}albums/${id}`, {
      headers: {
        "accept": "application/vnd.api+json",
        "authorization": "bearer " + authToken
      },
      params: {
        countryCode: this.COUNTRY,
        explicitFilter: "include",
        include: `${IncludeEnum.Artists},${IncludeEnum.CoverArt},${IncludeEnum.Items}`
      }
    })

    const tidalArtists = result.data.included.filter((i:any) => i.type === IncludeEnum.Artists)
    const artists: Artist[] = tidalArtists.map((t: any) => ({
      id: t.id,
      name: t.attributes.name
    }));

    // these contain the volume- and tracknumbers
    const tidalTrackItems = result.data.data.relationships.items.data; 

    const tidalTracks = result.data.included.filter((i:any) => i.type === IncludeEnum.Tracks)
    const tracks: Track[] = tidalTracks.map((t: any) => ({
      id: t.id,
      title: t.attributes.title,
      volumeNr: tidalTrackItems.find((i:any)=>i.id === t.id)?.meta.volumeNumber,
      trackNr: tidalTrackItems.find((i:any)=>i.id === t.id)?.meta.trackNumber
    }));

    const tidalArtwork = result.data.included.find((i:any) => i.type === IncludeEnum.Artworks && i.attributes.mediaType === "IMAGE")
    const artwork: Artwork = {
      id: tidalArtwork.id,
      file:tidalArtwork.attributes.files.find((f:any)=>f.meta.width===1280).href,
      thumbnail:tidalArtwork.attributes.files.find((f:any)=>f.meta.width===160).href
    }

    const album: Album = {
      id: id,
      title: result.data.data.attributes.title,
      releaseDate: result.data.data.attributes.releaseDate,
      artists,
      tracks,
      artwork
    }

    return album;
  } 


  public static async Search (query: string, include: IncludeEnum, _authToken?: string) : Promise<Album[]> {
    const authToken = _authToken || await this.getAuthToken();

    const result = await axios.get(`${this.API_BASE}searchResults/${encodeURI(query)}`, {
      headers: {
        "accept": "application/vnd.api+json",
        "authorization": "bearer " + authToken
      },
      params: {
        countryCode: this.COUNTRY,
        explicitFilter: "include",
        include: include.toString()
      }
    })

    const albums: Album[] = [];

       for (const i of result.data.included) {
        const album = await this.GetAlbum(i.id); albums.push(album);
        await delay(200); // add a delay because the api is rate limited
      }

    return albums;
  } 
}

export default Tidal;
