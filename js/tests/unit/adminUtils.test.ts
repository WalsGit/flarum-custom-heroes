import { joinColor, splitColor } from '../../src/admin/utils/color';
import { parentChain, targetOf } from '../../src/admin/utils/scopes';

describe('splitColor / joinColor', () => {
  it('splits a color into its rgb part and opacity', () => {
    expect(splitColor('#00000080')).toEqual({ rgb: '#000000', opacity: 50 });
    expect(splitColor('#FF0000')).toEqual({ rgb: '#ff0000', opacity: 100 });
    expect(splitColor('#abc')).toEqual({ rgb: '#aabbcc', opacity: 100 });
  });

  it('joins them back into a color the server accepts', () => {
    expect(joinColor('#000000', 50)).toBe('#00000080');
    expect(joinColor('#FF0000', 100)).toBe('#ff0000');
    expect(joinColor('#000000', 0)).toBe('#00000000');
    expect(joinColor('#000000', 140)).toBe('#000000');
  });

  it('keeps the opacity through a round trip', () => {
    for (let opacity = 0; opacity <= 100; opacity++) {
      expect(splitColor(joinColor('#123456', opacity))).toEqual({ rgb: '#123456', opacity });
    }
  });
});

describe('targetOf / parentChain', () => {
  it('reads the target of a config key', () => {
    expect(targetOf('global')).toEqual({ scope: 'global', scopeId: '' });
    expect(targetOf('tag:12')).toEqual({ scope: 'tag', scopeId: '12' });
  });

  it('lists the configs a target inherits from', () => {
    expect(parentChain('global')).toEqual([]);
    expect(parentChain('tag')).toEqual(['global']);
    expect(parentChain('tag:12')).toEqual(['global', 'tag']);
  });
});
