import type { ImageRef } from './types';
/**
 * The `<img>` attributes of a background image. `owner` is the key of the
 * config that defines it (`global`, `tag:12`…): files are named after it,
 * like `ImagePaths::background()` on the server (keep both in sync).
 */
export declare function backgroundImageAttrs(assetsUrl: string, owner: string, image: ImageRef): {
    src: string;
    srcset: string;
    sizes: string;
};
