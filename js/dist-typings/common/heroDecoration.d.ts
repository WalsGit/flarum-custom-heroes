import type Mithril from 'mithril';
import type { Corner, HeroConfigs, HeroScope } from './types';
/**
 * Who sees the hero, for the buttons. Without it (admin preview), every
 * button is shown.
 */
export interface HeroViewer {
    guest: boolean;
    allowSignUp: boolean;
    /** Opens Flarum's log in or sign up modal. */
    onAction: (action: 'login' | 'signup') => void;
}
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
    /** What goes in each corner, made into slots by `decorateContent()`. */
    corners: Partial<Record<Corner, Mithril.Vnode[]>>;
}
/**
 * Adds the decoration to the children of a hero container: the logo grouped
 * with the content, then what goes below the text. Also returns the corner
 * slots, to put last in the header (corners of the hero, over everything).
 * The close button of the welcome banner goes below what is in the top right
 * corner, so that they never overlap.
 */
export declare function decorateContent(children: Mithril.ChildArray, decoration: HeroDecoration): {
    content: Mithril.Children[];
    corners: Mithril.Vnode[];
};
/**
 * Resolves the config of a hero from its chain (`['global', 'tag', 'tag:12']`),
 * or null when nothing is configured for it.
 */
export declare function heroDecoration(configs: HeroConfigs, chain: string[], scope: HeroScope, assetsUrl: string, viewer?: HeroViewer | null): HeroDecoration | null;
