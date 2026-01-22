import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import axios from 'axios';
import { tmpdir } from 'os';

export const PegTheFile = async (
  filePath: string, 
  metadata: Record<string, string>, 
  coverUrl: string, 
): Promise<string> => {
  const coverPath = path.join(tmpdir(), `cover-${Date.now()}.jpg`);
  let tempFile: string | null = null;
  
  try {
    // Download cover image
    const response = await axios.get(coverUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000 
    });
    fs.writeFileSync(coverPath, response.data);

    logger.debug(`retrieving extension from ${filePath}`)
    const extension:string = filePath.split(".").pop()||".flac";
    logger.debug(`Retrieved extension,  ${extension}`)
    tempFile = path.join(tmpdir(), `track-${Date.now()}.${extension}`);
    logger.debug(filePath, metadata, tempFile)
    
    const metadataArgs = Object.entries(metadata)
      .map(([k, v]) => {
        const escaped = String(v).replace(/"/g, '\\"');
        return `-metadata ${k}="${escaped}"`;
      })
      .join(' ');
    
    const cmd = `ffmpeg -y -i "${filePath}" -i "${coverPath}" ` +
                `-map 0:a -map 1:0 ` +
                `-c:a copy -c:v copy ` +
                `-disposition:v:0 attached_pic ` +
                `${metadataArgs} "${tempFile}"`;
    
    await new Promise<void>((resolve, reject) => {
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, _stdout, stderr) => {
        if (error) {
          logger.error(`FFmpeg stderr: ${stderr}`);
          return reject(error);
        }
        resolve();
      });
    });
    
    return tempFile;
    
  } finally {
    const filesToClean = [filePath, filePath, coverPath];
    
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
