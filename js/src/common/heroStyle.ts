import type { HeightSection, HeroConfig } from './types';

/** Heights of the presets in pixels, per breakpoint. */
export const HEIGHT_PRESETS = {
  s: { desktop: 160, tablet: 140, mobile: 120 },
  m: { desktop: 200, tablet: 170, mobile: 140 },
  l: { desktop: 240, tablet: 200, mobile: 160 },
} as const;

function heightVariables(height: HeightSection): Record<string, string> {
  if (height.preset === 'auto') {
    return {};
  }

  const values = height.preset === 'custom' ? height : HEIGHT_PRESETS[height.preset];

  return {
    '--wch-height-desktop': `${values.desktop}px`,
    '--wch-height-tablet': `${values.tablet}px`,
    '--wch-height-mobile': `${values.mobile}px`,
  };
}

/**
 * The CSS variables of a resolved config, set on the hero element. Values
 * come from a validated config, never from raw CSS.
 */
export function heroStyle(config: HeroConfig): Record<string, string> {
  return {
    ...(config.height ? heightVariables(config.height) : {}),
  };
}
