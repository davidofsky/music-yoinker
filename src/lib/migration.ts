import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from "./logger";
import Version from './version';
import Config from './config';

const execAsync = promisify(exec);

const VERSION_FILE = path.join(Config.DATA_DIRECTORY, '.last-migration-version');

export interface MigrationMetadata {
  title?: string;
  album?: string;
  artist?: string;
  appVersion?: string;
  [key: string]: string | undefined;
}

export interface MigrationRule {
  /** Exclusive */
  fromVersion: string;
  /** Inclusive */
  toVersion: string;
  name: string;
  shouldMigrate: (metadata: MigrationMetadata, filePath: string) => boolean;
  migrate: (filePath: string, metadata: MigrationMetadata) => Promise<void>;
}

class MigrationService {
  private rules: MigrationRule[] = [];

  public registerRule(rule: MigrationRule): void {
    this.rules.push(rule);
    logger.info(`[Migration] Registered rule: ${rule.name} (${rule.fromVersion} -> ${rule.toVersion})`);
  }

  private async extractMetadata(filePath: string): Promise<MigrationMetadata> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format "${filePath}"`
      );

      const data = JSON.parse(stdout);
      const tags = data.format?.tags || {};

      const metadata: MigrationMetadata = {};
      for (const [key, value] of Object.entries(tags)) {
        metadata[key.toLowerCase()] = value as string;
      }

      return metadata;
    } catch (error) {
      logger.info(`[Migration] Failed to extract metadata from ${filePath}:`, error);
      return {};
    }
  }

  private async updateMetadata(
    filePath: string,
    newMetadata: Record<string, string>
  ): Promise<void> {
    const ext = path.extname(filePath);
    const tempFile = filePath.replace(ext, `.tmp${ext}`);

    try {
      const metadataArgs = Object.entries(newMetadata)
        .map(([k, v]) => {
          const escaped = String(v).replace(/"/g, '\\"');
          return `-metadata ${k}="${escaped}"`;
        })
        .join(' ');

      const isMP4 = ['.mp4', '.m4a', '.mov'].includes(ext.toLowerCase());
      const movflags = isMP4 ? '-movflags use_metadata_tags' : '';
      const cmd = `ffmpeg -y -i "${filePath}" -c copy ${metadataArgs} ${movflags} "${tempFile}"`;

      await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

      fs.copyFileSync(tempFile, filePath);
      fs.rmSync(tempFile);

      logger.info(`[Migration] Successfully updated metadata for ${path.basename(filePath)}`);
    } catch (error) {
      logger.error(`[Migration] Failed to update metadata for ${filePath}:`, error);

      // Cleanup temp file on error
      if (fs.existsSync(tempFile)) {
        fs.rmSync(tempFile);
      }

      throw error;
    }
  }

  public async checkAndMigrate(filePath: string): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
      logger.warn(`[Migration] File not found: ${filePath}`);
      return false;
    }

    const metadata = await this.extractMetadata(filePath);
    const fileVersion = metadata.appversion || metadata.appVersion;

    if (!Version.needsMigration(fileVersion)) {
      logger.debug(`[Migration] File is up-to-date: ${path.basename(filePath)} (v${fileVersion})`);
      return false;
    }

    const versionDisplay = fileVersion ? `V${fileVersion}` : 'unknown';
    logger.info(`[Migration] Checking migrations for ${path.basename(filePath)} (${versionDisplay} -> V${Version.APP_VERSION})`);

    let migrated = false;

    for (const rule of this.rules) {
      const shouldApply = this.shouldApplyRule(rule, fileVersion);

      if (shouldApply && rule.shouldMigrate(metadata, filePath)) {
        logger.info(`[Migration] Applying: ${rule.name}`);

        try {
          await rule.migrate(filePath, metadata);
          migrated = true;
        } catch (error) {
          logger.error(`[Migration] Failed to apply rule "${rule.name}":`, error);
        }
      }
    }

    if (migrated || Version.needsMigration(fileVersion)) {
      await this.updateMetadata(filePath, { appVersion: Version.APP_VERSION });
      logger.info(`[Migration] Updated ${path.basename(filePath)} to v${Version.APP_VERSION}`);
      return true;
    }

    return false;
  }


  private shouldApplyRule(rule: MigrationRule, currentVersion: string | undefined): boolean {
    if (!currentVersion) return true;

    const afterFrom = Version.compareVersions(currentVersion, rule.fromVersion) > 0;
    const beforeOrEqualTo = Version.compareVersions(currentVersion, rule.toVersion) <= 0;

    return afterFrom && beforeOrEqualTo;
  }

  public async migrateDirectory(dirPath: string): Promise<number> {
    if (!fs.existsSync(dirPath)) {
      logger.warn(`[Migration] Directory not found: ${dirPath}`);
      return 0;
    }

    let migratedCount = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        migratedCount += await this.migrateDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.flac', '.mp3', '.mp4', '.m4a'].includes(ext)) {
          try {
            const migrated = await this.checkAndMigrate(fullPath);
            if (migrated) migratedCount++;
          } catch (error) {
            logger.error(`[Migration] Error processing ${fullPath}:`, error);
          }
        }
      }
    }

    return migratedCount;
  }

  public async migrateAll(): Promise<number> {
    logger.info(`[Migration] Starting migration of all files in ${Config.MUSIC_DIRECTORY}`);
    const count = await this.migrateDirectory(Config.MUSIC_DIRECTORY);
    logger.info(`[Migration] Completed. Migrated ${count} file(s).`);
    return count;
  }

  public getLastMigratedVersion(): string | null {
    try {
      if (fs.existsSync(VERSION_FILE)) {
        return fs.readFileSync(VERSION_FILE, 'utf-8').trim();
      }
    } catch (error) {
      logger.error('[Migration] Failed to read last migrated version:', error);
    }
    return null;
  }

  public saveLastMigratedVersion(version: string): void {
    try {
      fs.writeFileSync(VERSION_FILE, version, 'utf-8');
    } catch (error) {
      logger.error('[Migration] Failed to save last migrated version:', error);
    }
  }

  public needsMigration(currentVersion: string): boolean {
    const lastVersion = this.getLastMigratedVersion();
    if (!lastVersion) {
      logger.info('[Migration] No previous migration found, migrations needed');
      return true;
    }
    const needsMigration = lastVersion !== currentVersion;
    if (!needsMigration) {
      logger.info(`[Migration] Already migrated at version ${lastVersion}, skipping migrations`);
    }
    return needsMigration;
  }
}

declare global {
  var migrationService: MigrationService;
}

if (!global.migrationService) {
  global.migrationService = new MigrationService();
  global.migrationService.registerRule({
    fromVersion: '0.0.0',
    toVersion: '1.0.0',
    name: 'Initial version tagging',
    shouldMigrate: (metadata) => !metadata.appversion && !metadata.appVersion,
    migrate: async () => { }
  });
}

export default global.migrationService;
export { MigrationService };
