# MUSIC YOINKER

Search for music using the [TIDAL API](https://tidal-music.github.io/tidal-api-reference/) and download it directly on the server using [HIFI](https://github.com/sachinsenal0x64/hifi).

Copy the `example.env` file to `.env` and fill in the required environment variables. If you use docker-compose, you can also copy `docker-compose.example.yml` to `docker-compose.yml`, it will use the `.env` file automatically.

## .env variables
- `HOST_MUSIC_DIRECTORY`: The absolute path to your music directory on the host machine.
- `DOWNLOAD_SOURCES`: Comma-separated list of download source URLs.
- `SEARCH_SOURCES`: Comma-separated list of search source URLs.
- `CLEAN_EXISTING_DOWNLOADS`: (optional) Whether to clean existing downloads before downloading new albums. Default is `false`.
- `CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS`: (optional) Time-to-live in seconds for cleaning existing downloads. Default is `3600` (1 hour).