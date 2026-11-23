import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs } from './backgroundImage';
import { heroStyle } from './heroStyle';
import { resolveConfig, sectionOwner } from './resolveConfig';
import type { HeroConfig, HeroConfigs, HeroScope } from './types';

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
export function heroDecoration(configs: HeroConfigs, chain: string[], scope: HeroScope, assetsUrl: string): HeroDecoration | null {
  const config: HeroConfig = resolveConfig(configs, chain);

  if (Object.keys(config).length === 0) return null;

  // An inherited image belongs to the config that defines it.
  const owner = sectionOwner(configs, chain, 'background');
  const image = config.background?.image && owner ? backgroundImageAttrs(assetsUrl, owner, config.background.image) : null;
  const style = heroStyle(config);

  return {
    className: classList(
      'wch-Hero',
      `wch-Hero--${scope}`,
      {
        'wch-Hero--image': !!image,
        'wch-Hero--overlay': '--wch-overlay' in style,
        'wch-Hero--textColor': '--wch-text-color' in style,
      },
      config.textStyle && ['wch-Hero--text', `wch-Hero--align-${config.textStyle.align}`, `wch-Hero--vAlign-${config.textStyle.vAlign}`]
    ),
    style,
    // Decorative, behind the content. An <img> rather than a CSS background, so that the browser picks the size.
    background: image ? m('img.wch-Hero-background', { alt: '', fetchpriority: 'high', decoding: 'async', ...image }) : null,
  };
}
