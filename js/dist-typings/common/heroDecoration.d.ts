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
    /** The logo, put next to the content by `decorateContent()`. */
    logo: Mithril.Vnode | null;
    /** Below the text, put by `decorateContent()`. */
    belowText: Mithril.Vnode | null;
    /** Corner slots, to put last in the header, over everything. */
    corners: Mithril.Vnode[];
}
/**
 * Adds the decoration to the children of a hero container: the logo grouped
 * with the content, then what goes below the text. The close button stays
 * apart.
 */
export declare function decorateContent(children: Mithril.ChildArray, decoration: HeroDecoration): Mithril.Children[];
/**
 * Resolves the config of a hero from its chain (`['global', 'tag', 'tag:12']`),
 * or null when nothing is configured for it.
 */
export declare function heroDecoration(configs: HeroConfigs, chain: string[], scope: HeroScope, assetsUrl: string): HeroDecoration | null;
