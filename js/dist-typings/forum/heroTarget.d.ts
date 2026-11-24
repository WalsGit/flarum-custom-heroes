import type Hero from 'flarum/forum/components/Hero';
import type { HeroScope } from '../common/types';
export interface HeroTarget {
    scope: HeroScope;
    scopeId: string | null;
    /** A child tag's parent, which it inherits from. */
    parentId?: string | null;
}
/**
 * Tells which config scope a hero belongs to, or null for the heroes the
 * extension does not customize (messages, user, …).
 */
export declare function heroTarget(hero: Hero): HeroTarget | null;
