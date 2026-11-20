/**
 * Hero colors are `#rrggbbaa`, but `<input type="color">` has no alpha: the
 * admin edits the color and its opacity separately.
 */

/** Splits a validated color into its `#rrggbb` part and its opacity (0–100). */
export function splitColor(color: string): { rgb: string; opacity: number } {
  let hex = color.toLowerCase().replace('#', '');

  if (hex.length === 3) {
    hex = hex.replace(/./g, '$&$&');
  }

  const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;

  return { rgb: `#${hex.slice(0, 6)}`, opacity: Math.round((alpha / 255) * 100) };
}

/** Joins a `#rrggbb` color and an opacity (0–100) into `#rrggbbaa`, or `#rrggbb` when opaque. */
export function joinColor(rgb: string, opacity: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(opacity)));

  if (clamped === 100) {
    return rgb.toLowerCase();
  }

  return (
    rgb.toLowerCase() +
    Math.round((clamped / 100) * 255)
      .toString(16)
      .padStart(2, '0')
  );
}
