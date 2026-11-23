import { heroDecoration, withLogo } from '../../src/common/heroDecoration';
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
    const [first, group] = withLogo([close, content], m('img.wch-Hero-logo')) as any[];

    expect(first).toBe(close);
    expect(group.attrs.className).toBe('wch-Hero-group');
    expect(group.children[1].children[0]).toBe(content);
  });
});
