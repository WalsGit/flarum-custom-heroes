import type { HeroScope } from '../../common/types';
/** A config row target, as the API expects it. */
export interface Target {
    scope: HeroScope;
    scopeId: string;
}
/** `global`, `welcome`, `tag:12`… to `{ scope, scopeId }`. */
export declare function targetOf(key: string): Target;
/**
 * The keys of the configs a target inherits from, from the most general to
 * the closest. For example `['global', 'tag']` for `tag:12`.
 */
export declare function parentChain(key: string): string[];
