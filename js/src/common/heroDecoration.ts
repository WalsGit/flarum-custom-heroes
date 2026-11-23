import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs, logoImageUrl } from './backgroundImage';
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
  /** The logo, to put next to the content with `withLogo()`. */
  logo: Mithril.Vnode | null;
}

const isCloseButton = (child: Mithril.Children) =>
  String((child as Mithril.Vnode<{ className?: string }>)?.attrs?.className ?? '')
    .split(' ')
    .includes('Hero-close');

/**
 * Groups the logo with the content of a hero container, so that both are
 * placed together; the close button stays apart.
 */
export function withLogo(children: Mithril.ChildArray, logo: Mithril.Vnode): Mithril.Children[] {
  return [
    ...children.filter(isCloseButton),
    m('.wch-Hero-group', [
      logo,
      m(
        '.wch-Hero-groupText',
        children.filter((child) => !isCloseButton(child))
      ),
    ]),
  ];
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
  const logo = config.logo?.image ? config.logo : null;
  const logoOwner = sectionOwner(configs, chain, 'logo');

  return {
    className: classList(
      'wch-Hero',
      `wch-Hero--${scope}`,
      {
        'wch-Hero--image': !!image,
        'wch-Hero--overlay': '--wch-overlay' in style,
        'wch-Hero--fixedHeight': '--wch-height-desktop' in style,
        'wch-Hero--textColor': '--wch-text-color' in style,
      },
      config.textStyle && ['wch-Hero--text', `wch-Hero--align-${config.textStyle.align}`, `wch-Hero--vAlign-${config.textStyle.vAlign}`],
      logo && ['wch-Hero--logo', `wch-Hero--logo-${logo.side}`, logo.hideOnMobile && 'wch-Hero--logoHideMobile']
    ),
    style,
    // Decorative, behind the content. An <img> rather than a CSS background, so that the browser picks the size.
    background: image ? m('img.wch-Hero-background', { alt: '', fetchpriority: 'high', decoding: 'async', ...image }) : null,
    // Its own size (at most twice the displayed one) avoids a layout shift while it loads. Empty alt: decorative.
    logo:
      logo?.image && logoOwner
        ? m('img.wch-Hero-logo', {
            src: logoImageUrl(assetsUrl, logoOwner, logo.image),
            alt: logo.alt,
            width: logo.image.width,
            height: logo.image.height,
          })
        : null,
  };
}
