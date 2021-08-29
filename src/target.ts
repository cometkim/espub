import browserslist from 'browserslist';

const supportedPlatforms = ['chrome', 'firefox', 'safari', 'edge', 'node'] as const;
type SupportedPlatform = typeof supportedPlatforms[number];

function isSupported(platform: string): platform is SupportedPlatform {
  return supportedPlatforms.includes(platform as SupportedPlatform);
}

type LoadTargetOptions = {
  basePath: string,
  query?: string,
};

export async function loadTargets(options: LoadTargetOptions): Promise<string[]> {
  const baseTargets = browserslist(options.query, {
    path: options.basePath,
  });

  const targetVersions = new Map<SupportedPlatform, number>();

  for (const target of baseTargets) {
    const [platform, versionString] = target.split(' ');
    const minVersion = +versionString.split('-')[0];

    if (!isSupported(platform)) {
      continue;
    }

    const targetVersion = targetVersions.get(platform);
    if (!targetVersion || targetVersion > minVersion) {
      targetVersions.set(platform, minVersion);
    }
  }

  return Array.from(targetVersions.entries())
    .map(([platform, version]) => platform + version);
}
