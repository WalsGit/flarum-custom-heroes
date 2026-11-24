import type { FocalPoint } from '../../common/types';
export type Device = 'desktop' | 'tablet' | 'mobile';
/** The width the hero is previewed at, for each device. */
export declare const DEVICE_WIDTHS: Record<Device, number>;
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
export declare function visibleArea(image: {
    width: number;
    height: number;
}, hero: {
    width: number;
    height: number;
}, point: FocalPoint): Area;
