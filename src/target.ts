import browserslist from 'browserslist';

type SupportedBrowser = keyof typeof browsersToTargets;
type EsbuildTarget = typeof browsersToTargets[SupportedBrowser];

const browsersToTargets = {
  'chrome': 'chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'edge',
  'node': 'node',
  'ios_saf': 'ios',
  'android': 'chrome',
  'and_chr': 'chrome',
  'and_ff': 'firefox',

  // 'deno': 'deno',
} as const;

const supportedBrowsers = new Set(Object.keys(browsersToTargets));

function isSupportedBrowser(browser: string): browser is SupportedBrowser {
  return supportedBrowsers.has(browser);
}

type LoadTargetOptions = {
  basePath: string,
  query?: string,
};

export async function loadTargets(options: LoadTargetOptions): Promise<string[]> {
  const queries = browserslist(options.query, {
    path: options.basePath,
  });

  const targetVersions = new Map<EsbuildTarget, number>();

  for (const query of queries) {
    const [browser, versionString] = query.split(' ');

    if (!isSupportedBrowser(browser)) {
      continue;
    }

    let target = browsersToTargets[browser];
    let minVersion = +versionString.split('-')[0];

    if (browser === 'android') {
      // according to https://developer.android.com/guide/webapps/migrating
      if (minVersion > 4.4) {
        target = 'chrome';
        // "defaults" minimum chrome version
        // at 2022.02.26.
        minVersion = 96;
      } else {
        continue;
      }
    }

    const targetVersion = targetVersions.get(target);
    if (!targetVersion || targetVersion > minVersion) {
      targetVersions.set(target, minVersion);
    }
  }

  return Array.from(targetVersions.entries())
    .map(targetVersion => targetVersion.join(''));
}
