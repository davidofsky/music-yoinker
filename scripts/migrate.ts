import MigrationService from '../src/lib/scripts/migration';
import PackageJson from '../package.json';
import Config from '../src/lib/config';
import {
  formatElapsedSeconds,
  getScriptArgs,
  hasFlag,
  printScriptFooter,
  printScriptHeader,
  resolveTargetDirectory,
} from './script-utils';

const args = getScriptArgs();
const version = PackageJson.version;

function showHelp() {
  console.log(`
    Music Yoinker - Migration Tool v${version}

    Usage:
      npm run migrate [options]

    Options:
      --help, -h          Show this help message
      --dir <path>        Specify a custom directory to migrate (default: from config)

    Examples:
      npm run migrate
      npm run migrate -- --dir "/path/to/music"
  `);
}

async function main() {
  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    showHelp();
    process.exit(0);
  }

  const customDir = resolveTargetDirectory(args, Config.MUSIC_DIRECTORY);
  const forceRun = hasFlag(args, '--force');

  printScriptHeader('Music Yoinker Migration Tool', version, customDir);

  try {
    if (!forceRun && !MigrationService.needsMigration(version)) {
      console.log('No migrations needed (package version unchanged)');
      process.exit(0);
    }

    const startTime = Date.now();
    const count = await MigrationService.migrateDirectory(customDir);
    const elapsed = formatElapsedSeconds(startTime);

    MigrationService.saveLastMigratedVersion(version);

    printScriptFooter('Migration Complete!', [
      `   Files migrated: ${count}`,
      `   Time elapsed: ${elapsed}s`,
    ]);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
