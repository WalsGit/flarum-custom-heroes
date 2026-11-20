import type Mithril from 'mithril';
import type { HeroConfigs, HeroScope } from './types';
/**
 * Everything the extension adds to a hero header, from a resolved config.
 * Shared by the forum and the admin preview, so that both render the same.
 */
export interface HeroDecoration {
    className: string;
    /** CSS variables, added to the hero's own style. */
    style: Record<string, string>;
    /** The background image, to put first in the header. */
    background: Mithril.Vnode | null;
}
/**
 * Resolves the config of a hero from its chain (`['global', 'tag', 'tag:12']`),
 * or null when nothing is configured for it.
 */
export declare function heroDecoration(configs: HeroConfigs, chain: string[], scope: HeroScope, assetsUrl: string): HeroDecoration | null;
