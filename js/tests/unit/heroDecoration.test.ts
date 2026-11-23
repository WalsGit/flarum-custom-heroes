import { decorateContent, heroDecoration } from '../../src/common/heroDecoration';
import type { HeroConfigs } from '../../src/common/types';

const assets = 'https://example.com/assets/extensions/walsgit-custom-heroes';
const image = { id: '3f2a9c1d7b4e6a05', width: 1440, height: 540, widths: [640, 1024, 1440] };

const configs: HeroConfigs = {
  global: { background: { image, position: 'center' }, overlay: { type: 'solid', color: '#00000080' } },
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

  it('adds the text style classes', () => {
    const textStyle = { align: 'right', vAlign: 'bottom', titleSize: 'm', subtitleSize: 'm', color: '#fff' } as const;
    const decoration = heroDecoration({ discussion: { textStyle } }, ['global', 'discussion'], 'discussion', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--discussion wch-Hero--textColor wch-Hero--text wch-Hero--align-right wch-Hero--vAlign-bottom');
  });

  it('marks a fixed height, but not the height of Flarum', () => {
    expect(heroDecoration({ global: { height: { preset: 'm' } } }, ['global'], 'global', assets)!.className).toContain('wch-Hero--fixedHeight');
    expect(heroDecoration({ global: { height: { preset: 'auto' } } }, ['global'], 'global', assets)!.className).not.toContain('wch-Hero--fixedHeight');
  });

  it('adds the logo of the config that defines it, and its classes', () => {
    const logo = { image: { id: '1b4f0e9851971998', width: 240, height: 120 }, side: 'right', size: 'l', alt: 'Forum', hideOnMobile: true } as const;
    const decoration = heroDecoration({ global: { logo } }, ['global', 'tag', 'tag:12'], 'tag', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--tag wch-Hero--logo wch-Hero--logo-right wch-Hero--logoHideMobile');
    expect(decoration.style['--wch-logo-height']).toBe('128px');
    expect((decoration.logo as any).attrs).toMatchObject({ src: `${assets}/logo-global-${logo.image.id}.webp`, alt: 'Forum', width: 240, height: 120 });
  });

  it('shows no logo when a more specific config removes it', () => {
    const image = { id: '1b4f0e9851971998', width: 240, height: 120 };
    const logo = { side: 'left', size: 'm', alt: '', hideOnMobile: false } as const;
    const decoration = heroDecoration({ global: { logo: { ...logo, image } }, tag: { logo: { ...logo, image: null } } }, ['global', 'tag'], 'tag', assets)!;

    expect(decoration.logo).toBeNull();
    expect(decoration.className).not.toContain('wch-Hero--logo');
  });

  it('groups the logo with the content, apart from the close button', () => {
    const close = m('button', { className: 'Hero-close Button' });
    const content = m('.containerNarrow');
    const decoration = { logo: m('img.wch-Hero-logo'), belowText: null, corners: [] } as any;
    const [first, group] = decorateContent([close, content], decoration) as any[];

    expect(first).toBe(close);
    expect(group.attrs.className).toBe('wch-Hero-group');
    expect(group.children[1].children[0]).toBe(content);
  });

  const socials = (placement: string) =>
    ({
      size: 'm',
      placement,
      color: null,
      mobile: 'same',
      items: [
        { icon: 'fab fa-github', url: 'https://github.com/example', label: 'GitHub' },
        { icon: 'fas fa-envelope', url: 'mailto:team@example.com', label: 'Email' },
      ],
    }) as any;

  it('renders the social links, web links in a new tab', () => {
    const decoration = heroDecoration({ global: { socials: socials('below-text') } }, ['global'], 'global', assets)!;
    const [web, mail] = (decoration.belowText as any).children[0].children.map((item: any) => item.children[0].attrs);

    expect(decoration.className).toContain('wch-Hero--socials');
    expect(decoration.style['--wch-socials-size']).toBe('24px');
    expect(decoration.corners).toEqual([]);
    expect(web).toMatchObject({ href: 'https://github.com/example', 'aria-label': 'GitHub', target: '_blank', rel: 'noopener noreferrer' });
    expect(mail).toMatchObject({ href: 'mailto:team@example.com', 'aria-label': 'Email' });
    expect(mail.target).toBeUndefined();
  });

  it('puts corner icons over the content and icons below the text with it', () => {
    const corner = heroDecoration({ global: { socials: socials('top-right') } }, ['global'], 'global', assets)!;

    expect(corner.belowText).toBeNull();
    expect((corner.corners[0] as any).attrs.className).toBe('wch-Hero-slot wch-Hero-slot--top-right');

    const close = m('button', { className: 'Hero-close Button' });
    const content = m('.containerNarrow');
    const below = heroDecoration({ global: { socials: socials('below-text') } }, ['global'], 'global', assets)!;
    const [first, body] = decorateContent([close, content], below) as any[];

    expect(first).toBe(close);
    expect(body.attrs.className).toBe('wch-Hero-body');
    expect(body.children.map((child: any) => child.attrs.className)).toEqual(['containerNarrow', 'wch-Hero-slot wch-Hero-slot--below-text']);
    // Corners go in the header, not in the content.
    expect(decorateContent([content], corner)).toEqual([content]);
  });

  it('hides the icons on mobile or moves them below the text', () => {
    const classes = (placement: string, mobile: string) => {
      const decoration = heroDecoration({ global: { socials: { ...socials(placement), mobile } } }, ['global'], 'global', assets)!;

      return [(decoration.belowText as any)?.attrs.className ?? null, ...decoration.corners.map((corner: any) => corner.attrs.className)];
    };

    expect(classes('top-left', 'hide')).toEqual([null, 'wch-Hero-slot wch-Hero-slot--top-left wch-Hero-slot--hideMobile']);
    expect(classes('top-left', 'below-text')).toEqual([
      'wch-Hero-slot wch-Hero-slot--below-text wch-Hero-slot--mobileOnly',
      'wch-Hero-slot wch-Hero-slot--top-left wch-Hero-slot--hideMobile',
    ]);
    // Mithril cannot render one vnode in two places.
    const both = heroDecoration({ global: { socials: { ...socials('top-left'), mobile: 'below-text' } } }, ['global'], 'global', assets)!;
    expect((both.belowText as any).children[0]).not.toBe((both.corners[0] as any).children[0]);

    expect(classes('below-text', 'hide')).toEqual(['wch-Hero-slot wch-Hero-slot--below-text wch-Hero-slot--hideMobile']);
    expect(classes('below-text', 'below-text')).toEqual(['wch-Hero-slot wch-Hero-slot--below-text']);
  });

  it('adds nothing without social links', () => {
    const decoration = heroDecoration({ global: { socials: { ...socials('top-left'), items: [] } } }, ['global'], 'global', assets);

    expect(decoration?.corners ?? []).toEqual([]);
    expect(decoration?.className ?? '').not.toContain('wch-Hero--socials');
  });
});
