import type { BackgroundSection, Corner, GradientStop, HeightSection, HeroConfig, OverlaySection } from './types';

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

const BACKGROUND_POSITIONS: Record<BackgroundSection['position'], string> = {
  center: 'center center',
  top: 'center top',
  bottom: 'center bottom',
};

/** A linear gradient from a corner goes to the opposite one. */
const OPPOSITE_CORNERS: Record<Corner, string> = {
  'top-left': 'bottom right',
  'top-right': 'bottom left',
  'bottom-left': 'top right',
  'bottom-right': 'top left',
};

const stopList = (stops: GradientStop[]) => stops.map((stop) => `${stop.color} ${stop.at}%`).join(', ');

/** The CSS background of the overlay, or null when there is none. */
function overlayBackground(overlay: OverlaySection): string | null {
  switch (overlay.type) {
    case 'solid':
      return overlay.color;
    case 'gradient': {
      const direction = 'corner' in overlay ? `to ${OPPOSITE_CORNERS[overlay.corner]}` : `${overlay.angle}deg`;

      return `linear-gradient(${direction}, ${stopList(overlay.stops)})`;
    }
    case 'radial':
      return `radial-gradient(${overlay.shape} at ${overlay.position.replace('-', ' ')}, ${stopList(overlay.stops)})`;
    case 'corners':
      // Each color fades out from its corner: the four meet and blend in the middle.
      return (
        [
          ['top left', overlay.topLeft],
          ['top right', overlay.topRight],
          ['bottom left', overlay.bottomLeft],
          ['bottom right', overlay.bottomRight],
        ] as const
      )
        .map(([corner, color]) => `radial-gradient(at ${corner}, ${color}, transparent 70%)`)
        .join(', ');
    default:
      return null;
  }
}

/**
 * The CSS variables of a resolved config, set on the hero element. Values
 * come from a validated config, never from raw CSS.
 */
export function heroStyle(config: HeroConfig): Record<string, string> {
  const overlay = config.overlay ? overlayBackground(config.overlay) : null;

  return {
    ...(config.height ? heightVariables(config.height) : {}),
    ...(config.background?.image ? { '--wch-bg-position': BACKGROUND_POSITIONS[config.background.position] } : {}),
    ...(overlay ? { '--wch-overlay': overlay } : {}),
  };
}
