import { joinColor, splitColor } from '../../src/admin/utils/color';
import { visibleArea } from '../../src/admin/utils/visibleArea';
import { parentChain, tagOrder, targetOf } from '../../src/admin/utils/scopes';

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
    expect(parentChain('tag:12', '3')).toEqual(['global', 'tag', 'tag:3']);
  });
});

describe('tagOrder', () => {
  it('follows Flarum: primary tags by position with their children, then secondary tags by name', () => {
    const tags = [
      { id: '1', name: 'Zeta', position: null, parentId: null },
      { id: '2', name: 'B', position: 1, parentId: null },
      { id: '3', name: 'A', position: 0, parentId: null },
      { id: '4', name: 'B-2', position: 1, parentId: '2' },
      { id: '5', name: 'B-1', position: 0, parentId: '2' },
      { id: '6', name: 'Alpha', position: null, parentId: null },
    ];

    expect(tagOrder(tags)).toEqual(['3', '2', '5', '4', '6', '1']);
  });
});

describe('visibleArea', () => {
  const image = { width: 2000, height: 1000 };

  it('crops the overflowing axis only, placed by the focal point', () => {
    // A 1280×160 hero shows the full width and a 0.25 high band of a 2:1 image.
    expect(visibleArea(image, { width: 1280, height: 160 }, { x: 50, y: 0 })).toEqual({ left: 0, top: 0, width: 1, height: 0.25 });
    expect(visibleArea(image, { width: 1280, height: 160 }, { x: 50, y: 100 })).toEqual({ left: 0, top: 0.75, width: 1, height: 0.25 });
    // A 390×390 hero shows half of the width.
    expect(visibleArea(image, { width: 390, height: 390 }, { x: 20, y: 50 })).toEqual({ left: 0.1, top: 0, width: 0.5, height: 1 });
  });
});
