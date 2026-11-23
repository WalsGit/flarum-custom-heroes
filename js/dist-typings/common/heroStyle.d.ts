import type { HeroConfig } from './types';
/** Heights of the presets in pixels, per breakpoint. */
export declare const HEIGHT_PRESETS: {
    readonly s: {
        readonly desktop: 160;
        readonly tablet: 140;
        readonly mobile: 120;
    };
    readonly m: {
        readonly desktop: 200;
        readonly tablet: 170;
        readonly mobile: 140;
    };
    readonly l: {
        readonly desktop: 240;
        readonly tablet: 200;
        readonly mobile: 160;
    };
};
/**
 * Text sizes in rem, on mobile then on tablet and desktop. `m` is the size
 * of the core.
 */
export declare const TEXT_SIZES: {
    readonly title: {
        readonly s: readonly [0.875, 1.125];
        readonly m: readonly [1, 1.375];
        readonly l: readonly [1.25, 1.75];
        readonly xl: readonly [1.5, 2.25];
    };
    readonly subtitle: {
        readonly s: readonly [0.75, 0.8125];
        readonly m: readonly [0.8125, 0.9375];
        readonly l: readonly [0.9375, 1.125];
    };
};
/** Social icon sizes in pixels. */
export declare const SOCIAL_SIZES: {
    readonly xs: 14;
    readonly s: 18;
    readonly m: 24;
};
/** Displayed logo heights in pixels (reduced on mobile by the CSS). */
export declare const LOGO_HEIGHTS: {
    readonly s: 64;
    readonly m: 96;
    readonly l: 128;
};
/**
 * The CSS variables of a resolved config, set on the hero element. Values
 * come from a validated config, never from raw CSS.
 */
export declare function heroStyle(config: HeroConfig): Record<string, string>;
