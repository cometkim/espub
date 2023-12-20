import browserslist from 'browserslist';
import semver from 'semver';

import { type Manifest } from './manifest';

type SupportedBrowser = keyof typeof browsersToTargets;
type EsbuildTarget = typeof browsersToTargets[SupportedBrowser];

const browsersToTargets = {
  'chrome': 'chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'edge': 'edge',
  'ios_saf': 'ios',
  'android': 'chrome',
  'and_chr': 'chrome',
  'and_ff': 'firefox',
} as const;

const supportedBrowsers = new Set(Object.keys(browsersToTargets));

function isSupportedBrowser(browser: string): browser is SupportedBrowser {
  return supportedBrowsers.has(browser);
}

type LoadTargetOptions = {
  basePath?: string,
  query?: string,
  manifest?: Manifest,
};

export function loadTargets(options?: LoadTargetOptions): string[] {
  const queries = browserslist(options?.query, {
    path: options?.basePath,
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

  let targets = Array.from(targetVersions.entries())
    .map(targetVersion => targetVersion.join(''));

  if (options?.manifest?.engines?.node) {
    const version = semver.minVersion(options.manifest.engines.node);
    if (version) {
      targets.push('node' + version.format());
    }
  } else {
    // latest officially supported version
    targets.push('node18');
  }

  if (options?.manifest?.engines?.deno) {
    const version = semver.minVersion(options.manifest.engines.deno);
    if (version) {
      targets.push('deno' + version.format());
    }
  } else {
    // minimum version supports ClassPrivateBrandCheck
    // See https://github.com/evanw/esbuild/issues/2940#issuecomment-1437818002
    targets.push('deno1.9');
  }

  return targets;
}
