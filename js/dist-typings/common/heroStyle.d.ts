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
 * The CSS variables of a resolved config, set on the hero element. Values
 * come from a validated config, never from raw CSS.
 */
export declare function heroStyle(config: HeroConfig): Record<string, string>;
