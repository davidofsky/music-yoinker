# Yoinker

Yoinker is a self-hosted tool for downloading [TIDAL API](https://tidal-music.github.io/tidal-api-reference/) audio from **TIDAL** using the [HIFI API](https://github.com/uimaxbai/hifi-api).
It is intended to be used alongside self-hosted music servers such as **Navidrome**.

## Overview

- Audio downloads are handled via **hifi-api**
- Some metadata (e.g. album artist) is retrieved directly from **TIDAL**
- Downloads are processed through a queue
- **ffmpeg** is used to embed metadata and cover art into the final FLAC files
- The UI is designed to be **mobile-friendly** and straightforward

## Tech Stack
- **Next.js**
- **TypeScript**

## Requirements

- **ffmpeg** (required for embedding metadata and cover art)
- **hifi-api**
- [TIDAL developer account](https://developer.tidal.com/documentation) (used for downloads and metadata)
  - This is where you get your `TIDAL_CLIENT_ID` and `TIDAL_CLIENT_SECRET`

## Getting started
Copy the `example.env` file to `.env` and fill in the required environment variables. If you use docker-compose, you can also copy `docker-compose.example.yml` to `docker-compose.yml`, it will use the `.env` file automatically.

### .env variables
#### Required
- `TIDAL_CLIENT_ID`: Your TIDAL API client ID.
- `TIDAL_CLIENT_SECRET`: Your TIDAL API client secret.
- `HIFI_SOURCES`: Comma-separated list of hifi-api source URLs.

#### Development
- `MUSIC_DIRECTORY`: The path where music files will be stored outside the container. Make sure to map this to a persistent volume on your host machine.
- `DATA_DIRECTORY`: The path where application data will be stored outside the container. Make sure to map this to a persistent volume on your host machine.

#### Optional
- `CLEAN_EXISTING_DOWNLOADS`: (optional) Whether to clean existing downloads before downloading new albums. Default is `false`.
- `CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS`: (optional) Time-to-live in seconds for cleaning existing downloads. Default is `3600` (1 hour).
- `TRACK_DISC_SEPARATOR`: (optional) Separator used between disc number and track number in filenames. Default is `.`. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_TITLE_SEPARATOR`: (optional) Separator used between track number and track title in filenames. Default is ` `. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_PAD_LENGTH`: (optional) Number of digits to pad track numbers to. Default is `1`.

## Migrator
A migration script is built to help migrate existing or old downloads to the new format used by Yoinker. You can run it with:

```bash
npm run migrate -- --dir "/path/to/your/music"
```

If no directory is specified, it will use the `HOST_MUSIC_DIRECTORY` from the `.env` file. For more options, run:
```bash
npm run migrate -- --h
```

The migrator will scan the specified directory (and its subdirectories) for existing downloads and update their filenames and metadata to match the congigured format.

To check whether or not a file needs to be migrated we add a custom tag `AppVersion` to each file. If the file's `AppVersion` is lower than the current app version, it will be migrated. The migrator will be ran automatically on app start to ensure all files are up to date.

## Disclaimer

This project is intended for **personal and educational use only**.
Ensure compliance with TIDAL’s terms of service and applicable laws.

