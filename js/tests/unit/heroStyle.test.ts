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
});
