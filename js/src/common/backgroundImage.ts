import type { ImageRef } from './types';

/**
 * The `<img>` attributes of a background image. `owner` is the key of the
 * config that defines it (`global`, `tag:12`…): files are named after it,
 * like `ImagePaths::background()` on the server (keep both in sync).
 */
export function backgroundImageAttrs(assetsUrl: string, owner: string, image: ImageRef) {
  const target = owner.replace(':', '-');
  const url = (width: number) => `${assetsUrl}/bg-${target}-${image.id}-${width}.webp`;
  const widths = image.widths ?? [];

  return {
    src: url(widths[widths.length - 1]),
    // A source narrower than the smallest width is stored in that file at its own size.
    srcset: widths.map((width) => `${url(width)} ${Math.min(width, image.width)}w`).join(', '),
    sizes: '100vw',
  };
}
