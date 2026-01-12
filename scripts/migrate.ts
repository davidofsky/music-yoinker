import dotenv from 'dotenv';
import MigrationService from '../src/lib/migration';
import PackageJson from '../package.json';
import Config from '../src/lib/config';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const args = process.argv.slice(2);
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
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const customDir = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : Config.MUSIC_DIRECTORY;

  console.log('========================================');
  console.log(`Music Yoinker Migration Tool v${version}`);
  console.log(`Target Directory: ${customDir}`);
  console.log('========================================\n');

  try {
    const startTime = Date.now();
    const count = await MigrationService.migrateDirectory(customDir);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n=========================');
    console.log(`   Migration Complete!`);
    console.log(`   Files migrated: ${count}`);
    console.log(`   Time elapsed: ${elapsed}s`);
    console.log('==========================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
