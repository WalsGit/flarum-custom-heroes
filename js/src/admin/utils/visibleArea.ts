import type { FocalPoint } from '../../common/types';

export type Device = 'desktop' | 'tablet' | 'mobile';

/** The width the hero is previewed at, for each device. */
export const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };

/** A part of the image, in fractions (0 to 1) of its width and height. */
export interface Area {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The part of an image a hero shows, cropped by `object-fit: cover` and
 * placed by `object-position: x% y%` (the point at x% of the image goes to
 * x% of the hero).
 */
export function visibleArea(image: { width: number; height: number }, hero: { width: number; height: number }, point: FocalPoint): Area {
  const scale = Math.max(hero.width / image.width, hero.height / image.height);
  const width = Math.min(1, hero.width / (image.width * scale));
  const height = Math.min(1, hero.height / (image.height * scale));

  return { left: ((1 - width) * point.x) / 100, top: ((1 - height) * point.y) / 100, width, height };
}
