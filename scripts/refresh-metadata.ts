import metadataRefreshService from '../src/lib/scripts/metadataRefresh';
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
const dryRun = hasFlag(args, '--dry-run');

function showHelp() {
  console.log(`
    Music Yoinker Metadata Refresh Tool v${version}

    Usage:
      npm run refresh-metadata [options]

    Options:
      --help, -h          Show this help message
      --dir <path>        Specify a custom directory to refresh (default: from config)
      --dry-run           Scan and resolve tracks without rewriting files

    Examples:
      npm run refresh-metadata
      npm run refresh-metadata -- --dir "/path/to/your/music"
      npm run refresh-metadata -- --dry-run
  `);
}

async function main() {
  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    showHelp();
    process.exit(0);
  }

  const customDir = resolveTargetDirectory(args, Config.MUSIC_DIRECTORY);

  printScriptHeader('Music Yoinker Metadata Refresh Tool', version, customDir, [
    `Mode: ${dryRun ? 'dry-run' : 'rewrite'}`,
  ]);

  try {
    const startTime = Date.now();
    const stats = await metadataRefreshService.refreshDirectory(customDir, dryRun);
    const elapsed = formatElapsedSeconds(startTime);

    printScriptFooter('Metadata Refresh Complete!', [
      `   Files scanned: ${stats.scanned}`,
      `   Files refreshed: ${stats.refreshed}`,
      `   Files skipped: ${stats.skipped}`,
      `   Files failed: ${stats.failed}`,
      `   Time elapsed: ${elapsed}s`,
    ]);

    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Metadata refresh failed:', error);
    process.exit(1);
  }
}

main();