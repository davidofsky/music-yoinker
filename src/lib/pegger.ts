import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { tmpdir } from 'os';
import { copyAudioWithMetadata } from './scripts/media-commands';

export const PegTheFile = async (
  filePath: string,
  metadata: Record<string, string>,
  coverUrl: string,
): Promise<string> => {
  const coverPath = path.join(tmpdir(), `cover-${Date.now()}.jpg`);
  let tempFile: string | null = null;
  let hasCover = false;

  try {
    if (coverUrl) {
      const response = await axios.get(coverUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      fs.writeFileSync(coverPath, response.data);
      hasCover = true;
    }

    logger.debug(`retrieving extension from ${filePath}`)
    const extension:string = filePath.split(".").pop()||".flac";
    logger.debug(`Retrieved extension,  ${extension}`)
    tempFile = path.join(tmpdir(), `track-${Date.now()}.${extension}`);
    logger.info(filePath, metadata, tempFile)

    await copyAudioWithMetadata({
      inputPath: filePath,
      outputPath: tempFile,
      metadata,
      coverPath: hasCover ? coverPath : undefined,
    });

    return tempFile;

  } finally {
    const filesToClean = [filePath, coverPath];

    for (const file of filesToClean) {
      try {
        if (file && fs.existsSync(file)) {
          logger.debug("Removing file: " + file)
          fs.rmSync(file)
        }
      } catch (err) {
        logger.error(`Failed to clean up ${file}:`, err);
      }
    }
  }
}
