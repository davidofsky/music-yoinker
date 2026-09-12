import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function buildMetadataArgs(newMetadata: Record<string, string>): string[] {
  const args: string[] = [];

  for (const [key, value] of Object.entries(newMetadata)) {
    args.push('-metadata', `${key}=${value}`);
  }

  return args;
}

function isFlac(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.flac';
}

/**
 * lucida encodes its FLACs as a stream, which leaves `total samples = 0` in the
 * header, so the track length is seen as 0:00. The file has to be re-encoded in this case.
 */
async function hasUnknownDuration(filePath: string): Promise<boolean> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    filePath,
  ]);

  const duration = Number.parseFloat(stdout.trim());

  return !Number.isFinite(duration) || duration <= 0;
}

function isMp4Like(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  return ['.mp4', '.m4a', '.mov'].includes(extension);
}

export async function addMetadata(filePath: string): Promise<Record<string, string>> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    filePath,
  ]);

  const parsed = JSON.parse(stdout) as { format?: { tags?: Record<string, string> } };
  const tags = parsed.format?.tags || {};
  const metadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    metadata[key.toLowerCase()] = String(value);
  }

  return metadata;
}

export async function copyAudioWithMetadata(options: {
  inputPath: string;
  outputPath: string;
  metadata: Record<string, string>;
  coverPath?: string;
}): Promise<void> {
  const { inputPath, outputPath, metadata, coverPath } = options;
  const args: string[] = ['-y', '-i', inputPath];

  // Re-encoding rewrites the header with the real sample count; copying cannot.
  const audioCodec = isFlac(outputPath) && await hasUnknownDuration(inputPath) ? 'flac' : 'copy';

  if (coverPath) {
    args.push(
      '-i', coverPath,
      '-map', '0:a',
      '-map', '1:0',
      '-c:a', audioCodec,
      '-c:v', 'copy',
      '-disposition:v:0', 'attached_pic'
    );
  } else {
    args.push('-c:a', audioCodec);
  }

  args.push(...buildMetadataArgs(metadata));

  if (isMp4Like(outputPath)) {
    args.push('-movflags', 'use_metadata_tags');
  }

  args.push(outputPath);

  await execFileAsync('ffmpeg', args, { maxBuffer: 10 * 1024 * 1024 });
}

import path from 'path';