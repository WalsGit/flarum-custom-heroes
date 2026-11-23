import Icon from 'flarum/common/components/Icon';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs, logoImageUrl } from './backgroundImage';
import { heroStyle } from './heroStyle';
import { resolveConfig, sectionOwner } from './resolveConfig';
import type { HeroConfig, HeroConfigs, HeroScope, Placement, SocialsSection } from './types';

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

const isCloseButton = (child: Mithril.Children) =>
  String((child as Mithril.Vnode<{ className?: string }>)?.attrs?.className ?? '')
    .split(' ')
    .includes('Hero-close');

/**
 * Adds the decoration to the children of a hero container: the logo grouped
 * with the content, then what goes below the text. The close button stays
 * apart.
 */
export function decorateContent(children: Mithril.ChildArray, decoration: HeroDecoration): Mithril.Children[] {
  let content: Mithril.Children[] = children.filter((child) => !isCloseButton(child));

  // Wrapped, so that the text and what is below it are placed (and cut by a fixed height) together.
  if (decoration.belowText) content = [m('.wch-Hero-body', [...content, decoration.belowText])];
  if (decoration.logo) content = [m('.wch-Hero-group', [decoration.logo, m('.wch-Hero-groupText', content)])];

  return [...children.filter(isCloseButton), ...content];
}

/** The social icons: links named by their label, web links in a new tab. */
function socialLinks(socials: SocialsSection): Mithril.Vnode {
  return m(
    'ul.wch-Socials',
    socials.items.map((item) =>
      m(
        'li',
        m(
          'a.wch-Socials-link',
          {
            href: item.url,
            'aria-label': item.label,
            title: item.label,
            ...(/^https?:/.test(item.url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
          // Brand icons only exist in their own style: never forced to the forum's icon style.
          m(Icon, { name: item.icon, noStyleOverride: true })
        )
      )
    )
  );
}

const slot = (placement: Placement, content: Mithril.Children, className?: string | false) =>
  m(`.wch-Hero-slot.wch-Hero-slot--${placement}`, { className: className || undefined }, content);

/** Where the social icons go: below the text and in a corner, each maybe only on some screens. */
function socialSlots(socials: SocialsSection | null): Pick<HeroDecoration, 'belowText' | 'corners'> {
  if (!socials) return { belowText: null, corners: [] };

  // A new list per slot: Mithril cannot render the same vnode in two places.
  const links = () => socialLinks(socials);

  if (socials.placement === 'below-text') {
    return { belowText: slot('below-text', links(), socials.mobile === 'hide' && 'wch-Hero-slot--hideMobile'), corners: [] };
  }

  return {
    belowText: socials.mobile === 'below-text' ? slot('below-text', links(), 'wch-Hero-slot--mobileOnly') : null,
    // Compared to the moving values: a config saved before `mobile` existed behaves as `same`.
    corners: [slot(socials.placement, links(), (socials.mobile === 'below-text' || socials.mobile === 'hide') && 'wch-Hero-slot--hideMobile')],
  };
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
  const socials = config.socials?.items.length ? config.socials : null;

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
      logo && ['wch-Hero--logo', `wch-Hero--logo-${logo.side}`, logo.hideOnMobile && 'wch-Hero--logoHideMobile'],
      socials && 'wch-Hero--socials'
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
    ...socialSlots(socials),
  };
}
