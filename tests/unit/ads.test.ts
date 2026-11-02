import { describe, expect, it } from 'vitest';
import {
  AD_PLACEMENTS,
  DISPLAY_BANNERS,
  NATIVE_BANNER,
  SMARTLINK,
  SOCIAL_BAR,
  adConfig,
  isAdFormatEnabled,
  isAdPlacementEnabled,
  isAdRoute,
  isEditorRoute,
  parseAdFlag,
} from '../../apps/web/src/components/ads/ad-config';

describe('Adsterra configuration', () => {
  it('keeps the exact publisher codes and dimensions', () => {
    expect(SOCIAL_BAR.scriptSrc).toBe(
      'https://pl32158799.profitableratecpmnetwork.com/16/72/e1/1672e18a434299ff101a75646099aa66.js',
    );
    expect(NATIVE_BANNER).toEqual({
      key: '01172eeac3fec1aa2688cd2353c20091',
      containerId: 'container-01172eeac3fec1aa2688cd2353c20091',
      scriptSrc:
        'https://pl32158800.profitableratecpmnetwork.com/01172eeac3fec1aa2688cd2353c20091/invoke.js',
    });
    expect(SMARTLINK.url).toBe(
      'https://www.profitableratecpmnetwork.com/tkzx5mzr34?key=54997fdb6af0107e9fbbb2ccec5c6552',
    );

    expect(DISPLAY_BANNERS).toEqual({
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
    });
  });

  it('exposes one enabled placement per requested surface', () => {
    expect(Object.keys(AD_PLACEMENTS).sort()).toEqual(
      [
        'app-rectangle',
        'dashboard-banner',
        'home-rectangle',
        'home-sidebar',
        'home-smartlink',
        'site-leaderboard',
        'site-mobile-banner',
        'site-native',
        'site-social-bar',
      ].sort(),
    );
    expect(isAdPlacementEnabled('site-leaderboard')).toBe(true);
    expect(isAdPlacementEnabled('app-rectangle')).toBe(true);
    expect(isAdFormatEnabled('display-banner')).toBe(true);
    expect(adConfig.formats.smartlink).toBe(true);
  });

  it('allows display placements on content routes and excludes editor routes', () => {
    expect(isAdRoute('/')).toBe(true);
    expect(isAdRoute('//')).toBe(true);

    for (const path of ['/word', '/sheets', '/slides', '/privacy', '/licenses', '/compatibility', '/404']) {
      expect(isEditorRoute(path), path).toBe(false);
      expect(isAdRoute(path), path).toBe(true);
    }

    for (const path of ['/word/edit', '/sheets/edit', '/slides/edit', '/word/edit/']) {
      expect(isEditorRoute(path), path).toBe(true);
      expect(isAdRoute(path), path).toBe(false);
    }
  });

  it('parses explicit enable/disable flags without treating typos as enabled', () => {
    expect(parseAdFlag(undefined)).toBe(true);
    expect(parseAdFlag('')).toBe(true);
    expect(parseAdFlag('true')).toBe(true);
    expect(parseAdFlag('1')).toBe(true);
    expect(parseAdFlag('false')).toBe(false);
    expect(parseAdFlag('FALSE')).toBe(false);
    expect(parseAdFlag('0')).toBe(false);
    expect(parseAdFlag('off')).toBe(false);
    expect(parseAdFlag('no')).toBe(false);
    expect(parseAdFlag('disabled')).toBe(false);
    expect(parseAdFlag(undefined, false)).toBe(false);
  });
});
