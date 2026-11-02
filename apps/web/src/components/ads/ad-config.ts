/**
 * Central advertising configuration.
 *
 * Publisher codes are intentionally kept here so placements, dimensions and
 * third-party URLs never drift apart. Build-time flags can disable any level
 * of the system without editing component code:
 *
 *   VITE_ADS_ENABLED=false
 *   VITE_ADS_DISPLAY_BANNER=false
 *   VITE_ADS_NATIVE_BANNER=false
 *   VITE_ADS_SOCIAL_BAR=false
 *   VITE_ADS_SMARTLINK=false
 *   VITE_ADS_PLACEMENT_HOME_LEADERBOARD=false
 *   VITE_ADS_PLACEMENT_HOME_MOBILE_BANNER=false
 *   VITE_ADS_PLACEMENT_DASHBOARD_BANNER=false
 *   VITE_ADS_PLACEMENT_HOME_RECTANGLE=false
 *   VITE_ADS_PLACEMENT_SITE_NATIVE=false
 *   VITE_ADS_PLACEMENT_HOME_SIDEBAR=false
 *   VITE_ADS_PLACEMENT_HOME_SMARTLINK=false
 *   VITE_ADS_PLACEMENT_SITE_SOCIAL_BAR=false
 */

export type AdFormat = 'display-banner' | 'native-banner' | 'social-bar' | 'smartlink';

export type AdPlacementId =
  | 'home-leaderboard'
  | 'home-mobile-banner'
  | 'dashboard-banner'
  | 'home-rectangle'
  | 'site-native'
  | 'home-sidebar'
  | 'home-smartlink'
  | 'site-social-bar';

export type DisplayBannerSize = '728x90' | '468x60' | '320x50' | '300x250' | '160x600' | '160x300';

export interface DisplayBannerConfig {
  readonly size: DisplayBannerSize;
  readonly key: string;
  readonly width: number;
  readonly height: number;
  readonly scriptSrc: string;
}

export interface NativeBannerConfig {
  readonly key: string;
  readonly containerId: string;
  readonly scriptSrc: string;
}

export const SOCIAL_BAR = {
  scriptSrc: 'https://pl32158799.profitableratecpmnetwork.com/16/72/e1/1672e18a434299ff101a75646099aa66.js',
} as const;

export const NATIVE_BANNER: NativeBannerConfig = {
  key: '01172eeac3fec1aa2688cd2353c20091',
  containerId: 'container-01172eeac3fec1aa2688cd2353c20091',
  scriptSrc:
    'https://pl32158800.profitableratecpmnetwork.com/01172eeac3fec1aa2688cd2353c20091/invoke.js',
};

export const SMARTLINK = {
  url: 'https://www.profitableratecpmnetwork.com/tkzx5mzr34?key=54997fdb6af0107e9fbbb2ccec5c6552',
} as const;

export const DISPLAY_BANNERS: Record<DisplayBannerSize, DisplayBannerConfig> = {
  '468x60': {
    size: '468x60',
    key: '0577b959c87d94640b8c1dcb214707e8',
    width: 468,
    height: 60,
    scriptSrc: 'https://www.highrevenueformat.com/0577b959c87d94640b8c1dcb214707e8/invoke.js',
  },
  '300x250': {
    size: '300x250',
    key: '79de0dfa7ca75109fde53a09034cde06',
    width: 300,
    height: 250,
    scriptSrc: 'https://www.highrevenueformat.com/79de0dfa7ca75109fde53a09034cde06/invoke.js',
  },
  '160x600': {
    size: '160x600',
    key: '1113bb33477a8a7b65f663417944ee60',
    width: 160,
    height: 600,
    scriptSrc: 'https://www.highrevenueformat.com/1113bb33477a8a7b65f663417944ee60/invoke.js',
  },
  '160x300': {
    size: '160x300',
    key: '2a9d3aac7fcb001a9a6cc647bdbbe801',
    width: 160,
    height: 300,
    scriptSrc: 'https://www.highrevenueformat.com/2a9d3aac7fcb001a9a6cc647bdbbe801/invoke.js',
  },
  '320x50': {
    size: '320x50',
    key: '36b036ba48ba6f32b725629e173f1a14',
    width: 320,
    height: 50,
    scriptSrc: 'https://www.highrevenueformat.com/36b036ba48ba6f32b725629e173f1a14/invoke.js',
  },
  '728x90': {
    size: '728x90',
    key: '6bb53be6eeea914dfa850468e90ae4a7',
    width: 728,
    height: 90,
    scriptSrc: 'https://www.highrevenueformat.com/6bb53be6eeea914dfa850468e90ae4a7/invoke.js',
  },
};

export interface AdPlacementConfig {
  readonly id: AdPlacementId;
  readonly format: AdFormat;
  readonly label: string;
  readonly enabled: boolean;
}

const env = import.meta.env as Record<string, string | undefined>;

/** Parse a build-time flag. Unset values use the supplied default. */
export function parseAdFlag(value: string | undefined, fallback = true): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  return !['0', 'false', 'off', 'no', 'disabled'].includes(normalized);
}

function formatEnabled(format: AdFormat): boolean {
  switch (format) {
    case 'display-banner':
      return parseAdFlag(env.VITE_ADS_DISPLAY_BANNER);
    case 'native-banner':
      return parseAdFlag(env.VITE_ADS_NATIVE_BANNER);
    case 'social-bar':
      return parseAdFlag(env.VITE_ADS_SOCIAL_BAR);
    case 'smartlink':
      return parseAdFlag(env.VITE_ADS_SMARTLINK);
  }
}

function placementEnabled(id: AdPlacementId, format: AdFormat): boolean {
  const key = `VITE_ADS_PLACEMENT_${id.toUpperCase().replace(/-/g, '_')}`;
  return formatEnabled(format) && parseAdFlag(env[key]);
}

const placementDefinitions: ReadonlyArray<Omit<AdPlacementConfig, 'enabled'>> = [
  { id: 'home-leaderboard', format: 'display-banner', label: '728 × 90 leaderboard' },
  { id: 'home-mobile-banner', format: 'display-banner', label: '320 × 50 mobile banner' },
  { id: 'dashboard-banner', format: 'display-banner', label: '468 × 60 dashboard banner' },
  { id: 'home-rectangle', format: 'display-banner', label: '300 × 250 rectangle' },
  { id: 'site-native', format: 'native-banner', label: 'Native banner' },
  { id: 'home-sidebar', format: 'display-banner', label: 'Desktop sidebar banner' },
  { id: 'home-smartlink', format: 'smartlink', label: 'Sponsored offers' },
  { id: 'site-social-bar', format: 'social-bar', label: 'Social bar' },
];

export const AD_PLACEMENTS: Record<AdPlacementId, AdPlacementConfig> = Object.fromEntries(
  placementDefinitions.map((placement) => [
    placement.id,
    { ...placement, enabled: placementEnabled(placement.id, placement.format) },
  ]),
) as Record<AdPlacementId, AdPlacementConfig>;

export const adConfig = {
  enabled: parseAdFlag(env.VITE_ADS_ENABLED),
  placements: AD_PLACEMENTS,
  formats: {
    'display-banner': formatEnabled('display-banner'),
    'native-banner': formatEnabled('native-banner'),
    'social-bar': formatEnabled('social-bar'),
    smartlink: formatEnabled('smartlink'),
  },
} as const;

/**
 * Homepage-only placements. Display banners and the smartlink are intentionally
 * scoped to `/`; the native banner and Social Bar live in the shared shell.
 */
export function isAdRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/';
}

export function isAdPlacementEnabled(id: AdPlacementId): boolean {
  return adConfig.enabled && adConfig.placements[id].enabled;
}

export function isAdFormatEnabled(format: AdFormat): boolean {
  return adConfig.enabled && adConfig.formats[format];
}
