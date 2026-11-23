import Icon from 'flarum/common/components/Icon';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs, logoImageUrl } from './backgroundImage';
import { heroStyle } from './heroStyle';
import { resolveConfig, sectionOwner } from './resolveConfig';
import type { ButtonItem, Corner, HeroConfig, HeroConfigs, HeroScope, MobileBehavior, Placement, SocialsSection } from './types';

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

const isCloseButton = (child: Mithril.Children) =>
  String((child as Mithril.Vnode<{ className?: string }>)?.attrs?.className ?? '')
    .split(' ')
    .includes('Hero-close');

const slot = (placement: Placement, content: Mithril.Children, className?: string) =>
  m(`.wch-Hero-slot.wch-Hero-slot--${placement}`, { className }, content);

/**
 * Adds the decoration to the children of a hero container: the logo grouped
 * with the content, then what goes below the text. Also returns the corner
 * slots, to put last in the header (corners of the hero, over everything).
 * The close button of the welcome banner goes below what is in the top right
 * corner, so that they never overlap.
 */
export function decorateContent(children: Mithril.ChildArray, decoration: HeroDecoration): { content: Mithril.Children[]; corners: Mithril.Vnode[] } {
  const close = children.filter(isCloseButton);
  let content: Mithril.Children[] = children.filter((child) => !isCloseButton(child));

  // Wrapped, so that the text and what is below it are placed (and cut by a fixed height) together.
  if (decoration.belowText) content = [m('.wch-Hero-body', [...content, decoration.belowText])];
  if (decoration.logo) content = [m('.wch-Hero-group', [decoration.logo, m('.wch-Hero-groupText', content)])];

  const topRight = !!decoration.corners['top-right'];
  const corners = (Object.entries(decoration.corners) as [Corner, Mithril.Vnode[]][]).map(([corner, parts]) =>
    slot(corner, corner === 'top-right' ? [...parts, ...close] : parts)
  );

  return { content: topRight ? content : [...close, ...content], corners };
}

/** The social icons: links named by their label, web links in a new tab. */
function socialLinks(socials: SocialsSection, className?: string): Mithril.Vnode {
  return m(
    'ul.wch-Socials',
    { className },
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

/** Whether the viewer sees a button: log in and sign up are for guests only. */
function isVisible(button: ButtonItem, viewer: HeroViewer | null): boolean {
  if (!viewer) return true;
  if (button.action === 'link') return button.visibility === 'all' || (button.visibility === 'guest') === viewer.guest;

  return viewer.guest && (button.action === 'login' || viewer.allowSignUp);
}

const BUTTON_STYLES = { primary: 'Button--primary', default: '', outline: 'wch-HeroButton--outline' } as const;

/** The buttons, styled as Flarum buttons; custom colors go through CSS variables. */
function heroButtons(items: ButtonItem[], viewer: HeroViewer | null, className?: string): Mithril.Vnode {
  return m(
    '.wch-HeroButtons',
    { className },
    items.map((button) => {
      const attrs = {
        className: classList('Button wch-HeroButton', `wch-HeroButton--${button.size}`, BUTTON_STYLES[button.style ?? 'primary'], {
          'wch-HeroButton--bg': !!button.bg,
          'wch-HeroButton--color': !!button.color,
        }),
        style: { ...(button.bg ? { '--wch-button-bg': button.bg } : {}), ...(button.color ? { '--wch-button-color': button.color } : {}) },
      };
      const content = [
        button.icon && m(Icon, { name: button.icon, className: 'Button-icon', noStyleOverride: true }),
        m('span.Button-label', button.label),
      ];

      if (button.action === 'link') {
        return m('a', { ...attrs, href: button.url, ...(button.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, content);
      }

      const action = button.action;

      return m('button', { ...attrs, type: 'button', onclick: () => viewer?.onAction(action) }, content);
    })
  );
}

/** A section shown in a slot, rendered by `render(className)`. */
interface SlotPart {
  placement: Placement;
  mobile: MobileBehavior;
  render: (className?: string) => Mithril.Vnode;
}

/**
 * Places the parts in their slots, in order (buttons, then icons). On
 * mobile, a part can be hidden, or moved below the text: rendered twice,
 * each copy shown on its own screens (Mithril cannot render one vnode twice).
 */
function placeParts(parts: SlotPart[]): Pick<HeroDecoration, 'belowText' | 'corners'> {
  const below: { vnode: Mithril.Vnode; className?: string }[] = [];
  const corners: HeroDecoration['corners'] = {};

  for (const { placement, mobile, render } of parts) {
    if (placement === 'below-text') {
      const className = mobile === 'hide' ? 'wch-Hero-hideMobile' : undefined;
      below.push({ vnode: render(className), className });
      continue;
    }

    // Compared to the moving values: a config saved before `mobile` existed behaves as `same`.
    const moved = mobile === 'below-text' || mobile === 'hide';
    (corners[placement] ??= []).push(render(moved ? 'wch-Hero-hideMobile' : undefined));
    if (mobile === 'below-text') below.push({ vnode: render('wch-Hero-mobileOnly'), className: 'wch-Hero-mobileOnly' });
  }

  // A slot whose parts are all hidden on some screens is hidden there too, so that its margin does not move the text.
  const shared = below.every((part) => part.className === below[0]?.className) ? below[0]?.className : undefined;

  return {
    belowText: below.length
      ? slot(
          'below-text',
          below.map((part) => part.vnode),
          shared
        )
      : null,
    corners,
  };
}

/**
 * Resolves the config of a hero from its chain (`['global', 'tag', 'tag:12']`),
 * or null when nothing is configured for it.
 */
export function heroDecoration(
  configs: HeroConfigs,
  chain: string[],
  scope: HeroScope,
  assetsUrl: string,
  viewer: HeroViewer | null = null
): HeroDecoration | null {
  const config = resolveConfig(configs, chain);

  if (Object.keys(config).length === 0) return null;

  // An inherited image belongs to the config that defines it.
  const owner = sectionOwner(configs, chain, 'background');
  const image = config.background?.image && owner ? backgroundImageAttrs(assetsUrl, owner, config.background.image) : null;
  const style = heroStyle(config);
  const logo = config.logo?.image ? config.logo : null;
  const logoOwner = sectionOwner(configs, chain, 'logo');
  const socials = config.socials?.items.length ? config.socials : null;
  const buttons = config.buttons?.items.filter((button) => isVisible(button, viewer)) ?? [];
  const slots = placeParts([
    ...(config.buttons && buttons.length
      ? [
          {
            placement: config.buttons.placement,
            mobile: config.buttons.mobile,
            render: (className?: string) => heroButtons(buttons, viewer, className),
          },
        ]
      : []),
    ...(socials ? [{ placement: socials.placement, mobile: socials.mobile, render: (className?: string) => socialLinks(socials, className) }] : []),
  ]);

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
      Object.keys(slots.corners).length > 0 && 'wch-Hero--corners'
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
    ...slots,
  };
}
