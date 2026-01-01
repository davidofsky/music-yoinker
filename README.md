# MUSIC YOINKER

Search for music using the [TIDAL API](https://tidal-music.github.io/tidal-api-reference/) and download it directly on the server using [HIFI](https://github.com/sachinsenal0x64/hifi).

Copy the `example.env` file to `.env` and fill in the required environment variables. If you use docker-compose, you can also copy `docker-compose.example.yml` to `docker-compose.yml`, it will use the `.env` file automatically.

## .env variables
- `TIDAL_CLIENT_ID`: Your TIDAL API client ID. Can be fetched after creating an account and app [here](https://developer.tidal.com/dashboard/create).
- `TIDAL_CLIENT_SECRET`: Your TIDAL API client secret.
- `HOST_MUSIC_DIRECTORY`: The absolute path to your music directory on the host machine.
- `DOWNLOAD_SOURCES`: Comma-separated list of download source URLs.
- `SEARCH_SOURCES`: Comma-separated list of search source URLs.
- `CLEAN_EXISTING_DOWNLOADS`: (optional) Whether to clean existing downloads before downloading new albums. Default is `false`.
- `CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS`: (optional) Time-to-live in seconds for cleaning existing downloads. Default is `3600` (1 hour).
- `TRACK_DISC_SEPARATOR`: (optional) Separator used between disc number and track number in filenames. Default is `.`. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_TITLE_SEPARATOR`: (optional) Separator used between track number and track title in filenames. Default is ` `. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_PAD_LENGTH`: (optional) Number of digits to pad track numbers to. Default is `1`.