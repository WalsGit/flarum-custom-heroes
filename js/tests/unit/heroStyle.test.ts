import { HEIGHT_PRESETS, heroStyle } from '../../src/common/heroStyle';
import type { TextStyleSection } from '../../src/common/types';

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
    expect(heroStyle({ text: { afterClose: 'none', title: '', message: '' }, overlay: { type: 'none' } })).toEqual({});
  });

  it('sets the background position only when there is an image', () => {
    const image = { id: '3f2a9c1d7b4e6a05', width: 1920, height: 640, widths: [640, 1024, 1440, 1920] };

    expect(heroStyle({ background: { image, position: { x: 50, y: 0 } } })).toEqual({ '--wch-bg-position': '50% 0%' });
    expect(heroStyle({ background: { image: null, position: { x: 50, y: 0 } } })).toEqual({});
  });

  it('sets a solid overlay color', () => {
    expect(heroStyle({ overlay: { type: 'solid', color: '#00000080' } })).toEqual({ '--wch-overlay': '#00000080' });
  });

  it('builds a linear gradient overlay from its angle and stops', () => {
    const stops = [
      { color: '#000000cc', at: 0 },
      { color: '#ff000080', at: 30 },
      { color: '#00ff0040', at: 60 },
      { color: '#00000000', at: 100 },
    ];

    expect(heroStyle({ overlay: { type: 'gradient', angle: 180, stops: stops.slice(0, 2) } })).toEqual({
      '--wch-overlay': 'linear-gradient(180deg, #000000cc 0%, #ff000080 30%)',
    });
    expect(heroStyle({ overlay: { type: 'gradient', angle: 45, stops } })['--wch-overlay']).toBe(
      'linear-gradient(45deg, #000000cc 0%, #ff000080 30%, #00ff0040 60%, #00000000 100%)'
    );
  });

  it('sets no overlay for the none type', () => {
    expect(heroStyle({ overlay: { type: 'none' } })).toEqual({});
  });

  it('builds a linear gradient from a corner to the opposite one', () => {
    const stops = [
      { color: '#000000', at: 0 },
      { color: '#ffffff', at: 100 },
    ];

    expect(heroStyle({ overlay: { type: 'gradient', corner: 'top-left', stops } })['--wch-overlay']).toBe(
      'linear-gradient(to bottom right, #000000 0%, #ffffff 100%)'
    );
    expect(heroStyle({ overlay: { type: 'gradient', corner: 'bottom-right', stops } })['--wch-overlay']).toBe(
      'linear-gradient(to top left, #000000 0%, #ffffff 100%)'
    );
  });

  it('builds a radial gradient from its shape and position', () => {
    const stops = [
      { color: '#00000000', at: 0 },
      { color: '#000000b3', at: 100 },
    ];

    expect(heroStyle({ overlay: { type: 'radial', shape: 'ellipse', position: 'center', stops } })['--wch-overlay']).toBe(
      'radial-gradient(ellipse at center, #00000000 0%, #000000b3 100%)'
    );
    expect(heroStyle({ overlay: { type: 'radial', shape: 'circle', position: 'top-right', stops } })['--wch-overlay']).toBe(
      'radial-gradient(circle at top right, #00000000 0%, #000000b3 100%)'
    );
  });

  it('blends one color from each corner', () => {
    const overlay = { type: 'corners', topLeft: '#ff0000', topRight: '#00ff00', bottomLeft: '#0000ff', bottomRight: '#ffffff80' } as const;

    expect(heroStyle({ overlay })['--wch-overlay']).toBe(
      'radial-gradient(at top left, #ff0000, transparent 70%), radial-gradient(at top right, #00ff00, transparent 70%), ' +
        'radial-gradient(at bottom left, #0000ff, transparent 70%), radial-gradient(at bottom right, #ffffff80, transparent 70%)'
    );
  });

  it('sets the text sizes per breakpoint, and the color only when it is not automatic', () => {
    const textStyle: TextStyleSection = { align: 'left', vAlign: 'middle', titleSize: 'xl', subtitleSize: 'm', color: null };

    expect(heroStyle({ textStyle })).toEqual({
      '--wch-title-size': '2.25rem',
      '--wch-title-size-mobile': '1.5rem',
      '--wch-subtitle-size': '0.9375rem',
      '--wch-subtitle-size-mobile': '0.8125rem',
    });
    expect(heroStyle({ textStyle: { ...textStyle, color: '#ffffffcc' } })['--wch-text-color']).toBe('#ffffffcc');
  });
});
