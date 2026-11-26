import { decorateContent, heroDecoration } from '../../src/common/heroDecoration';
import type { HeroConfigs } from '../../src/common/types';

const assets = 'https://example.com/assets/extensions/walsgit-custom-heroes';
const image = { id: '3f2a9c1d7b4e6a05', width: 1440, height: 540, widths: [640, 1024, 1440] };

const configs: HeroConfigs = {
  global: { background: { image, position: { x: 50, y: 50 } }, overlay: { type: 'solid', color: '#00000080' } },
  'tag:12': { overlay: { type: 'none' } },
};

describe('heroDecoration', () => {
  it('returns null when nothing applies', () => {
    expect(heroDecoration({}, ['global'], 'global', assets)).toBeNull();
  });

  it('adds the classes, variables and image of the resolved config', () => {
    const decoration = heroDecoration(configs, ['global'], 'global', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--global wch-Hero--image wch-Hero--overlay');
    expect(decoration.style['--wch-overlay']).toBe('#00000080');
    expect((decoration.background as any).attrs.src).toBe(`${assets}/bg-global-${image.id}-1440.webp`);
  });

  it('uses the inherited image and drops the overlay a more specific config removes', () => {
    const decoration = heroDecoration(configs, ['global', 'tag', 'tag:12'], 'tag', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--tag wch-Hero--image');
    expect((decoration.background as any).attrs.src).toContain('bg-global-');
  });

  it('shows the image of the level above with the own position of an `inherit` background', () => {
    const own = {
      ...configs,
      tag: { background: { image: 'inherit', position: { x: 50, y: 0 } } },
      'tag:12': { background: { image: 'inherit', position: { x: 20, y: 80 } } },
    } as HeroConfigs;
    const decoration = heroDecoration(own, ['global', 'tag', 'tag:12'], 'tag', assets)!;

    expect((decoration.background as any).attrs.src).toBe(`${assets}/bg-global-${image.id}-1440.webp`);
    expect(decoration.style['--wch-bg-position']).toBe('20% 80%');
  });

  it('shows no image when `inherit` finds none above', () => {
    const none = { 'tag:12': { background: { image: 'inherit', position: { x: 20, y: 80 } } } } as HeroConfigs;
    const decoration = heroDecoration(none, ['global', 'tag', 'tag:12'], 'tag', assets)!;

    expect(decoration.background).toBeNull();
    expect(decoration.style).toEqual({});

    const removed = { ...configs, tag: { background: { image: null, position: { x: 50, y: 50 } } }, ...none } as HeroConfigs;
    expect(heroDecoration(removed, ['global', 'tag', 'tag:12'], 'tag', assets)!.background).toBeNull();
  });

  it('adds the text style classes', () => {
    const textStyle = { align: 'right', vAlign: 'bottom', titleSize: 'm', subtitleSize: 'm', color: '#fff' } as const;
    const decoration = heroDecoration({ discussion: { textStyle } }, ['global', 'discussion'], 'discussion', assets)!;

    expect(decoration.className).toBe(
      'wch-Hero wch-Hero--discussion wch-Hero--textColor wch-Hero--text wch-Hero--align-right wch-Hero--vAlign-bottom'
    );
  });

  it('marks a hidden tag icon and description', () => {
    expect(heroDecoration({ tag: { tagIcon: false } }, ['global', 'tag', 'tag:12'], 'tag', assets)!.className).toContain('wch-Hero--noTagIcon');
    expect(heroDecoration({ tag: { tagDescription: false } }, ['global', 'tag', 'tag:12'], 'tag', assets)!.className).toContain(
      'wch-Hero--noTagDescription'
    );
    expect(heroDecoration({ tag: { height: { preset: 'm' } } }, ['global', 'tag'], 'tag', assets)!.className).not.toContain('wch-Hero--noTagIcon');
  });

  it('marks a fixed height, but not the height of Flarum', () => {
    expect(heroDecoration({ global: { height: { preset: 'm' } } }, ['global'], 'global', assets)!.className).toContain('wch-Hero--fixedHeight');
    expect(heroDecoration({ global: { height: { preset: 'auto' } } }, ['global'], 'global', assets)!.className).not.toContain(
      'wch-Hero--fixedHeight'
    );
  });

  it('adds the logo of the config that defines it, and its classes', () => {
    const logo = { image: { id: '1b4f0e9851971998', width: 480, height: 240 }, side: 'right', size: 'l', alt: 'Forum', hideOnMobile: true } as const;
    const decoration = heroDecoration({ global: { logo } }, ['global', 'tag', 'tag:12'], 'tag', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--tag wch-Hero--logo wch-Hero--logo-right wch-Hero--logoHideMobile');
    expect(decoration.style['--wch-logo-height']).toBe('128px');
    expect((decoration.logo as any).attrs).toMatchObject({
      src: `${assets}/logo-global-${logo.image.id}.webp`,
      alt: 'Forum',
      width: logo.image.width,
      height: logo.image.height,
    });
  });

  it('adds the classes of the discussion tag options', () => {
    const className = heroDecoration({ discussion: { discussionTags: 'below', tagColor: false } }, ['global', 'discussion'], 'discussion', assets)!.className;

    expect(className).toContain('wch-Hero--tags-below');
    expect(className).toContain('wch-Hero--noTagColor');
  });

  it('puts the logo above a discussion title instead of replacing it', () => {
    const logo = { image: { id: '1b4f0e9851971998', width: 480, height: 240 }, side: 'title', size: 'm', alt: '', hideOnMobile: false } as const;

    expect(heroDecoration({ global: { logo } }, ['global', 'discussion'], 'discussion', assets)!.className).toContain('wch-Hero--logo-above');
    // The title of another extension's hero may not be `.Hero-title`.
    expect(heroDecoration({ global: { logo } }, ['global', 'other'], 'other', assets)!.className).toContain('wch-Hero--logo-above');
    expect(heroDecoration({ global: { logo } }, ['global', 'tag'], 'tag', assets)!.className).toContain('wch-Hero--logo-title');
  });

  it('shows no logo when a more specific config removes it', () => {
    const image = { id: '1b4f0e9851971998', width: 240, height: 120 };
    const logo = { side: 'left', size: 'm', alt: '', hideOnMobile: false } as const;
    const decoration = heroDecoration(
      { global: { logo: { ...logo, image } }, tag: { logo: { ...logo, image: null } } },
      ['global', 'tag'],
      'tag',
      assets
    )!;

    expect(decoration.logo).toBeNull();
    expect(decoration.className).not.toContain('wch-Hero--logo');
  });

  it('groups the logo with the content, apart from the close button', () => {
    const close = m('button', { className: 'Hero-close Button' });
    const content = m('.containerNarrow');
    const decoration = { logo: m('img.wch-Hero-logo'), belowText: null, corners: {} } as any;
    const [first, group] = decorateContent([close, content], decoration).content as any[];

    expect(first).toBe(close);
    expect(group.attrs.className).toBe('wch-Hero-group');
    expect(group.children[1].children[0]).toBe(content);
  });

  const socials = (placement: string, mobile = 'same') =>
    ({
      size: 'm',
      placement,
      color: null,
      mobile,
      items: [
        { icon: 'fab fa-github', url: 'https://github.com/example', label: 'GitHub' },
        { icon: 'fas fa-envelope', url: 'mailto:team@example.com', label: 'Email' },
      ],
    } as any);

  const button = (changes = {}) =>
    ({
      label: 'Docs',
      icon: null,
      action: 'link',
      url: 'https://example.com',
      newTab: false,
      visibility: 'all',
      style: 'primary',
      size: 'm',
      bg: null,
      color: null,
      ...changes,
    } as any);

  const buttons = (items: any[], placement = 'below-text', mobile = 'same') => ({ placement, mobile, items } as any);

  it('renders the social links, web links in a new tab', () => {
    const decoration = heroDecoration({ global: { socials: socials('below-text') } }, ['global'], 'global', assets)!;
    const [web, mail] = (decoration.belowText as any).children[0].children.map((item: any) => item.children[0].attrs);

    expect(decoration.style['--wch-socials-size']).toBe('24px');
    expect(decoration.corners).toEqual({});
    expect(web).toMatchObject({ href: 'https://github.com/example', 'aria-label': 'GitHub', target: '_blank', rel: 'noopener noreferrer' });
    expect(mail).toMatchObject({ href: 'mailto:team@example.com', 'aria-label': 'Email' });
    expect(mail.target).toBeUndefined();
  });

  it('puts corners in the header and what is below the text with the text', () => {
    const close = m('button', { className: 'Hero-close Button' });
    const content = m('.containerNarrow');
    const below = heroDecoration({ global: { socials: socials('below-text') } }, ['global'], 'global', assets)!;
    const [first, body] = decorateContent([close, content], below).content as any[];

    expect(first).toBe(close);
    expect(body.attrs.className).toBe('wch-Hero-body');
    expect(body.children.map((child: any) => child.attrs.className)).toEqual(['containerNarrow', 'wch-Hero-slot wch-Hero-slot--below-text']);

    const corner = heroDecoration({ global: { socials: socials('bottom-left') } }, ['global'], 'global', assets)!;
    const decorated = decorateContent([close, content], corner);

    expect(corner.className).toContain('wch-Hero--corners');
    expect(decorated.content).toEqual([close, content]);
    expect(decorated.corners.map((slot: any) => slot.attrs.className)).toEqual(['wch-Hero-slot wch-Hero-slot--bottom-left']);
  });

  it('moves the close button below what is in the top right corner', () => {
    const close = m('button', { className: 'Hero-close Button' });
    const content = m('.containerNarrow');
    const decoration = heroDecoration({ global: { socials: socials('top-right') } }, ['global'], 'global', assets)!;
    const { content: children, corners } = decorateContent([close, content], decoration);

    expect(children).toEqual([content]);
    expect((corners[0] as any).children[1]).toBe(close);
  });

  it('puts nothing below the text of fof/polls heroes', () => {
    const polls = (placement: string, mobile: string) =>
      heroDecoration({ global: { socials: socials(placement, mobile) }, polls: { socials: 'inherit' } }, ['global', 'polls'], 'polls', assets)!;

    expect(polls('below-text', 'same').belowText).toBeNull();
    expect(polls('below-text', 'same').corners).toEqual({});
    // Moved below the text on mobile: hidden there instead.
    expect(polls('top-left', 'below-text').belowText).toBeNull();
    expect((polls('top-left', 'below-text').corners['top-left']![0] as any).attrs.className).toBe('wch-Socials wch-Hero-hideMobile');
  });

  it('hides a part on mobile or moves it below the text', () => {
    const classes = (placement: string, mobile: string) => {
      const decoration = heroDecoration({ global: { socials: socials(placement, mobile) } }, ['global'], 'global', assets)!;
      const part = (slot: any) => slot?.children[0].attrs.className ?? null;

      return [part(decoration.belowText), ...Object.values(decoration.corners).map((parts: any) => parts[0].attrs.className)];
    };

    expect(classes('top-left', 'hide')).toEqual([null, 'wch-Socials wch-Hero-hideMobile']);
    expect(classes('top-left', 'below-text')).toEqual(['wch-Socials wch-Hero-mobileOnly', 'wch-Socials wch-Hero-hideMobile']);
    expect(classes('below-text', 'hide')).toEqual(['wch-Socials wch-Hero-hideMobile']);
    expect(classes('below-text', 'below-text')).toEqual(['wch-Socials']);
    // The slot itself is hidden where all its parts are, so that its margin does not move the text.
    const slotClass = (placement: string, mobile: string) =>
      (heroDecoration({ global: { socials: socials(placement, mobile) } }, ['global'], 'global', assets)!.belowText as any).attrs.className;
    expect(slotClass('top-left', 'below-text')).toBe('wch-Hero-slot wch-Hero-slot--below-text wch-Hero-mobileOnly');
    expect(slotClass('below-text', 'hide')).toBe('wch-Hero-slot wch-Hero-slot--below-text wch-Hero-hideMobile');
    expect(slotClass('below-text', 'same')).toBe('wch-Hero-slot wch-Hero-slot--below-text');

    // A config saved before `mobile` existed.
    expect(classes('top-left', undefined as any)).toEqual([null, 'wch-Socials']);

    // Mithril cannot render one vnode in two places.
    const both = heroDecoration({ global: { socials: socials('top-left', 'below-text') } }, ['global'], 'global', assets)!;
    expect((both.belowText as any).children[0]).not.toBe((both.corners['top-left'] as any)[0]);
  });

  it('adds nothing without social links', () => {
    const decoration = heroDecoration({ global: { socials: { ...socials('top-left'), items: [] } } }, ['global'], 'global', assets)!;

    expect(decoration.corners).toEqual({});
    expect(decoration.className).not.toContain('wch-Hero--corners');
  });

  it('renders link and dialog buttons with their style and colors', () => {
    const calls: string[] = [];
    const onAction = (action: string) => calls.push(action);
    const viewer = { guest: true, allowSignUp: true, onAction };
    const items = [
      button({ newTab: true, style: 'outline', size: 'l', bg: '#ff000080', icon: 'fas fa-book' }),
      button({ action: 'login', label: 'Log in', url: undefined, newTab: undefined, visibility: undefined, style: 'default' }),
    ];
    const decoration = heroDecoration({ global: { buttons: buttons(items) } }, ['global'], 'global', assets, viewer)!;
    const [link, login] = (decoration.belowText as any).children[0].children;

    expect(link.tag).toBe('a');
    expect(link.attrs).toMatchObject({ href: 'https://example.com', target: '_blank', rel: 'noopener noreferrer' });
    expect(link.attrs.className).toBe('Button wch-HeroButton wch-HeroButton--l wch-HeroButton--outline wch-HeroButton--bg');
    expect(link.attrs.style).toEqual({ '--wch-button-bg': '#ff000080' });
    expect(login.tag).toBe('button');
    expect(login.attrs.className).toBe('Button wch-HeroButton wch-HeroButton--m');

    login.attrs.onclick();
    expect(calls).toEqual(['login']);
  });

  it('shows each button to the right visitors', () => {
    const items = [
      button({ label: 'All' }),
      button({ label: 'Guests', visibility: 'guest' }),
      button({ label: 'Users', visibility: 'user' }),
      button({ label: 'Log in', action: 'login' }),
      button({ label: 'Sign up', action: 'signup' }),
    ];
    const labels = (viewer: any) => {
      const decoration = heroDecoration({ global: { buttons: buttons(items) } }, ['global'], 'global', assets, viewer)!;

      return ((decoration.belowText as any)?.children[0].children ?? []).map((b: any) => b.children[1].children[0].children);
    };
    const onAction = () => {};

    expect(labels({ guest: true, allowSignUp: true, onAction })).toEqual(['All', 'Guests', 'Log in', 'Sign up']);
    expect(labels({ guest: true, allowSignUp: false, onAction })).toEqual(['All', 'Guests', 'Log in']);
    expect(labels({ guest: false, allowSignUp: true, onAction })).toEqual(['All', 'Users']);
    // The admin preview shows them all.
    expect(labels(null)).toEqual(['All', 'Guests', 'Users', 'Log in', 'Sign up']);
  });

  it('stacks buttons above icons in a shared slot', () => {
    const decoration = heroDecoration(
      { tag: { socials: socials('top-left'), buttons: buttons([button()], 'top-left') } },
      ['global', 'tag'],
      'tag',
      assets
    )!;

    expect(decoration.corners['top-left']!.map((part: any) => part.attrs.className)).toEqual(['wch-HeroButtons', 'wch-Socials']);
  });
});
