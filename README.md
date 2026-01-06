# Yoinker

Yoinker is a self-hosted tool for downloading [TIDAL API](https://tidal-music.github.io/tidal-api-reference/) audio from **TIDAL** using the [HIFI API](https://github.com/uimaxbai/hifi-api).  
It is intended to be used alongside self-hosted music servers such as **Navidrome**.

## Overview

- Audio downloads are handled via **hifi-api**
- Some metadata (e.g. album artist) is retrieved directly from **TIDAL**
- Downloads are processed through a queue
- **Redis** is used to persist sessions for Server-Sent Events
- **ffmpeg** is used to embed metadata and cover art into the final FLAC files
- The UI is designed to be **mobile-friendly** and straightforward 

## Tech Stack
- **Next.js**
- **TypeScript**
- **Redis**

## Requirements

- **ffmpeg** (required for embedding metadata and cover art)
- **Redis** (required for persisting SSE sessions)
- **hifi-api**
- [TIDAL developer account](https://developer.tidal.com/documentation) (used for downloads and metadata)

## Getting started
Copy the `example.env` file to `.env` and fill in the required environment variables. If you use docker-compose, you can also copy `docker-compose.example.yml` to `docker-compose.yml`, it will use the `.env` file automatically.

### .env variables
- `TIDAL_CLIENT_ID`: Your TIDAL API client ID. Can be fetched after creating an account and app [here](https://developer.tidal.com/dashboard/create).
- `TIDAL_CLIENT_SECRET`: Your TIDAL API client secret.
- `REDIS_HOST` Host of the Redis instance
- `REDIS_PORT` Port of the Redis instance
- `HOST_MUSIC_DIRECTORY`: The absolute path to your music directory on the host machine.
- `HIFI_SOURCES`: Comma-separated list of hifi-api source URLs.
- `CLEAN_EXISTING_DOWNLOADS`: (optional) Whether to clean existing downloads before downloading new albums. Default is `false`.
- `CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS`: (optional) Time-to-live in seconds for cleaning existing downloads. Default is `3600` (1 hour).
- `TRACK_DISC_SEPARATOR`: (optional) Separator used between disc number and track number in filenames. Default is `.`. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_TITLE_SEPARATOR`: (optional) Separator used between track number and track title in filenames. Default is ` `. When you want to use special characters or spaces, wrap the value in quotes (e.g., `" - "`).
- `TRACK_PAD_LENGTH`: (optional) Number of digits to pad track numbers to. Default is `1`.

## Disclaimer

This project is intended for **personal and educational use only**.  
Ensure compliance with TIDAL’s terms of service and applicable laws.

