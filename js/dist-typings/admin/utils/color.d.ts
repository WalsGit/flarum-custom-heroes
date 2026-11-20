/**
 * Hero colors are `#rrggbbaa`, but `<input type="color">` has no alpha: the
 * admin edits the color and its opacity separately.
 */
/** Splits a validated color into its `#rrggbb` part and its opacity (0–100). */
export declare function splitColor(color: string): {
    rgb: string;
    opacity: number;
};
/** Joins a `#rrggbb` color and an opacity (0–100) into `#rrggbbaa`, or `#rrggbb` when opaque. */
export declare function joinColor(rgb: string, opacity: number): string;
