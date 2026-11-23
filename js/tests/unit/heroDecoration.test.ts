import { heroDecoration } from '../../src/common/heroDecoration';
import type { HeroConfigs } from '../../src/common/types';

const assets = 'https://example.com/assets/extensions/walsgit-custom-heroes';
const image = { id: '3f2a9c1d7b4e6a05', width: 1440, height: 540, widths: [640, 1024, 1440] };

const configs: HeroConfigs = {
  global: { background: { image, position: 'center' }, overlay: { type: 'solid', color: '#00000080' } },
  'tag:12': { overlay: { type: 'none' } },
};

describe('heroDecoration', () => {
  it('returns null when nothing applies', () => {
    expect(heroDecoration({}, ['global', 'welcome'], 'welcome', assets)).toBeNull();
  });

  it('adds the classes, variables and image of the resolved config', () => {
    const decoration = heroDecoration(configs, ['global', 'welcome'], 'welcome', assets)!;

    expect(decoration.className).toBe('wch-Hero wch-Hero--welcome wch-Hero--image wch-Hero--overlay');
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
});
