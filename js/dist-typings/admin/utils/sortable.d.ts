/**
 * Drag and drop of a list's rows by a handle, with core's sortablejs chunk
 * (lazy-loaded, like Flarum's own pages). `onmove` reorders the data.
 */
export declare function makeSortable(list: HTMLElement, handle: string, onmove: (from: number, to: number) => void): void;
/** The list with one item moved. */
export declare function moved<T>(items: T[], from: number, to: number): T[];
