import packageJson from '../../package.json';

class Version {
  private static instance: Version;
  public readonly APP_VERSION: string;

  private constructor() {
    this.APP_VERSION = packageJson.version;
  }

  public static getInstance(): Version {
    if (!Version.instance) {
      Version.instance = new Version();
    }
    return Version.instance;
  }

  /**
   * Compare two semantic version strings
   * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  public compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(n => parseInt(n, 10));
    const v2Parts = version2.split('.').map(n => parseInt(n, 10));

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }

    return 0;
  }

  public needsMigration(version?: string): boolean {
    if (!version) return true;
    return this.compareVersions(version, this.APP_VERSION) < 0;
  }
}

const versionInstance = Version.getInstance();

export default versionInstance;
export { Version };
