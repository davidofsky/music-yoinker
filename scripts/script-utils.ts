import Config from '../src/lib/config';

export function getScriptArgs(): string[] {
  return process.argv.slice(2);
}

export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

export function getOptionValue(args: string[], optionName: string): string | null {
  const optionIndex = args.indexOf(optionName);
  if (optionIndex === -1) return null;

  const value = args[optionIndex + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}

export function resolveTargetDirectory(args: string[], defaultDirectory: string = Config.MUSIC_DIRECTORY): string {
  return getOptionValue(args, '--dir') ?? defaultDirectory;
}

export function printScriptHeader(title: string, version: string, targetDirectory: string, extraLines: string[] = []): void {
  console.log('========================================');
  console.log(`${title} v${version}`);
  console.log(`Target Directory: ${targetDirectory}`);

  for (const line of extraLines) {
    console.log(line);
  }

  console.log('========================================\n');
}

export function printScriptFooter(title: string, lines: string[]): void {
  console.log('\n=========================');
  console.log(`   ${title}`);

  for (const line of lines) {
    console.log(line);
  }

  console.log('==========================\n');
}

export function formatElapsedSeconds(startTime: number): string {
  return ((Date.now() - startTime) / 1000).toFixed(2);
}