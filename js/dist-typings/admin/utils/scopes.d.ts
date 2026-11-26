import type { HeroScope } from '../../common/types';
/** A config row target, as the API expects it. */
export interface Target {
    scope: HeroScope;
    scopeId: string;
}
/** `global`, `discussion`, `tag:12`… to `{ scope, scopeId }`. */
export declare function targetOf(key: string): Target;
/**
 * The keys of the configs a target inherits from, from the most general to
 * the closest. For example `['global', 'tag']` for `tag:12`, or
 * `['global', 'tag', 'tag:3']` when tag 12 is a child of tag 3.
 */
export declare function parentChain(key: string, parentId?: string | null): string[];
/** What `tagOrder()` needs to know about a tag. */
export interface TagInfo {
    id: string;
    name: string;
    position: number | null;
    parentId: string | null;
}
/**
 * Tag ids in Flarum's order: primary tags by position, each followed by its
 * children, then secondary tags (no position) by name.
 */
export declare function tagOrder(tags: TagInfo[]): string[];
/** Targets with one config per page: the extension and the store type of their pages. */
export declare const PAGE_TARGETS: {
    readonly pages: {
        readonly extension: "fof-pages";
        readonly type: "pages";
    };
    readonly advancedPages: {
        readonly extension: "tryhackx-advanced-pages";
        readonly type: "advanced-pages";
    };
};
/** The page of a page target (`pages:3`), if loaded. */
export declare function targetPage(scope: HeroScope, scopeId: string): import("flarum/common/Model").default | undefined;
