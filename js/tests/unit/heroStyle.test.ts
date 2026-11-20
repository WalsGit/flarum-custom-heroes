import { HEIGHT_PRESETS, heroStyle } from '../../src/common/heroStyle';

describe('heroStyle', () => {
  it('sets no variable without config', () => {
    expect(heroStyle({})).toEqual({});
  });

  it('sets no height variable for the core height', () => {
    expect(heroStyle({ height: { preset: 'auto' } })).toEqual({});
  });

  it('converts a preset into heights per breakpoint', () => {
    expect(heroStyle({ height: { preset: 'l' } })).toEqual({
      '--wch-height-desktop': `${HEIGHT_PRESETS.l.desktop}px`,
      '--wch-height-tablet': `${HEIGHT_PRESETS.l.tablet}px`,
      '--wch-height-mobile': `${HEIGHT_PRESETS.l.mobile}px`,
    });
  });

  it('uses custom heights as is', () => {
    expect(heroStyle({ height: { preset: 'custom', desktop: 500, tablet: 300, mobile: 150 } })).toEqual({
      '--wch-height-desktop': '500px',
      '--wch-height-tablet': '300px',
      '--wch-height-mobile': '150px',
    });
  });

  it('ignores the sections that have no variable yet', () => {
    expect(heroStyle({ dismissible: false, overlay: { type: 'none' } })).toEqual({});
  });

  it('sets the background position only when there is an image', () => {
    const image = { id: '3f2a9c1d7b4e6a05', width: 1920, height: 640, widths: [640, 1024, 1440, 1920] };

    expect(heroStyle({ background: { image, position: 'top' } })).toEqual({ '--wch-bg-position': 'center top' });
    expect(heroStyle({ background: { image: null, position: 'top' } })).toEqual({});
  });
});
