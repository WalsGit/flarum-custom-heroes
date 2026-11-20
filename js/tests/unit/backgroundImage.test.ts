import { backgroundImageAttrs } from '../../src/common/backgroundImage';

const assets = 'https://example.com/forum/assets/extensions/walsgit-custom-heroes';
const id = '3f2a9c1d7b4e6a05';

describe('backgroundImageAttrs', () => {
  it('lists every generated width, the largest as fallback', () => {
    expect(backgroundImageAttrs(assets, 'welcome', { id, width: 1440, height: 540, widths: [640, 1024, 1440] })).toEqual({
      src: `${assets}/bg-welcome-${id}-1440.webp`,
      srcset: `${assets}/bg-welcome-${id}-640.webp 640w, ${assets}/bg-welcome-${id}-1024.webp 1024w, ${assets}/bg-welcome-${id}-1440.webp 1440w`,
      sizes: '100vw',
    });
  });

  it('names the files after the config that owns the image', () => {
    const attrs = backgroundImageAttrs(assets, 'tag:12', { id, width: 640, height: 200, widths: [640] });

    expect(attrs.src).toBe(`${assets}/bg-tag-12-${id}-640.webp`);
  });

  it('announces the real width of a source narrower than the smallest file', () => {
    const attrs = backgroundImageAttrs(assets, 'global', { id, width: 300, height: 100, widths: [640] });

    expect(attrs.srcset).toBe(`${assets}/bg-global-${id}-640.webp 300w`);
  });
});
