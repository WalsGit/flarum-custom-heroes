import { configChain, normalizeConfigs, resolveConfig, sectionOwner, tagParentId } from '../../src/common/resolveConfig';
import type { HeroConfigs } from '../../src/common/types';

const configs: HeroConfigs = {
  global: {
    background: { image: null, position: { x: 50, y: 0 } },
    height: { preset: 's' },
    overlay: { type: 'solid', color: '#00000080' },
  },
  tag: {
    height: { preset: 'm' },
    textStyle: { align: 'left', vAlign: 'top', titleSize: 'm', subtitleSize: 'm', color: null },
  },
  'tag:12': {
    height: { preset: 'custom', desktop: 400, tablet: 300, mobile: 200 },
    overlay: { type: 'none' },
  },
};

describe('normalizeConfigs', () => {
  it('turns the empty list sent by the API into an empty object', () => {
    expect(normalizeConfigs([])).toEqual({});
  });

  it('ignores missing or invalid payloads', () => {
    expect(normalizeConfigs(undefined)).toEqual({});
    expect(normalizeConfigs(null)).toEqual({});
    expect(normalizeConfigs('nope')).toEqual({});
  });

  it('keeps an object as is', () => {
    expect(normalizeConfigs(configs)).toBe(configs);
  });
});

describe('configChain', () => {
  it('goes from the most general to the most specific config', () => {
    expect(configChain('global')).toEqual(['global']);
    expect(configChain('discussion')).toEqual(['global', 'discussion']);
    expect(configChain('tag', '12')).toEqual(['global', 'tag', 'tag:12']);
  });

  it('has no instance level without an id', () => {
    expect(configChain('tag', null)).toEqual(['global', 'tag']);
    expect(configChain('tag', '')).toEqual(['global', 'tag']);
  });

  it('puts the parent of a child tag between the type and the tag', () => {
    expect(configChain('tag', '12', '3')).toEqual(['global', 'tag', 'tag:3', 'tag:12']);
    expect(configChain('tag', '12', null)).toEqual(['global', 'tag', 'tag:12']);
  });

  it('lets a child tag inherit a section from its parent', () => {
    const resolved = resolveConfig({ tag: { height: { preset: 's' } }, 'tag:3': { height: { preset: 'l' } } }, configChain('tag', '12', '3'));

    expect(resolved.height).toEqual({ preset: 'l' });
  });
});

describe('tagParentId', () => {
  it('reads the parent id from the relationship data', () => {
    expect(tagParentId({ data: { relationships: { parent: { data: { type: 'tags', id: '3' } } } } })).toBe('3');
    expect(tagParentId({ data: { relationships: { parent: { data: null } } } })).toBeNull();
    expect(tagParentId({ data: {} })).toBeNull();
    expect(tagParentId(null)).toBeNull();
  });
});

describe('resolveConfig', () => {
  it('takes each section from the most specific config that defines it', () => {
    const resolved = resolveConfig(configs, configChain('tag', '12'));

    expect(resolved.background).toEqual({ image: null, position: { x: 50, y: 0 } });
    expect(resolved.height).toEqual({ preset: 'custom', desktop: 400, tablet: 300, mobile: 200 });
    expect(resolved.overlay).toEqual({ type: 'none' });
  });

  it('replaces sections as a whole', () => {
    const resolved = resolveConfig(
      { global: { height: { preset: 'custom', desktop: 400, tablet: 300, mobile: 200 } }, tag: { height: { preset: 'l' } } },
      configChain('tag')
    );

    expect(resolved.height).toEqual({ preset: 'l' });
  });

  it('inherits the type level when a tag has no config of its own', () => {
    expect(resolveConfig(configs, configChain('tag', '99')).height).toEqual({ preset: 'm' });
  });

  it('does not mix configs of other scopes', () => {
    const resolved = resolveConfig(configs, configChain('discussion'));

    expect(resolved.height).toEqual({ preset: 's' });
    expect(resolved).not.toHaveProperty('textStyle');
  });

  it('returns an empty config when nothing applies', () => {
    expect(resolveConfig({}, configChain('global'))).toEqual({});
  });

  it('does not mutate the stored configs', () => {
    resolveConfig(configs, configChain('tag', '12'));

    expect(configs.global.height).toEqual({ preset: 's' });
  });

  it('only reads own keys', () => {
    expect(resolveConfig({}, ['toString', '__proto__'])).toEqual({});
  });
});

describe('sectionOwner', () => {
  it('returns the most specific config that defines the section', () => {
    expect(sectionOwner(configs, ['global', 'tag', 'tag:12'], 'overlay')).toBe('tag:12');
    expect(sectionOwner(configs, ['global', 'tag', 'tag:12'], 'height')).toBe('tag:12');
    expect(sectionOwner(configs, ['global', 'tag', 'tag:13'], 'height')).toBe('tag');
  });

  it('returns the level above for an inherited section', () => {
    expect(sectionOwner(configs, ['global', 'tag', 'tag:12'], 'background')).toBe('global');
  });

  it('returns null when no config defines the section', () => {
    expect(sectionOwner(configs, ['global', 'discussion'], 'logo')).toBeNull();
    expect(sectionOwner({}, ['global', 'discussion'], 'background')).toBeNull();
  });
});

describe('home-only sections', () => {
  const buttons = { placement: 'below-text', mobile: 'same', items: [] } as any;
  const configs: HeroConfigs = { global: { buttons, height: { preset: 's' } }, tag: {} };

  it('gives the default buttons to the home hero only', () => {
    expect(resolveConfig(configs, ['global']).buttons).toBe(buttons);
    expect(resolveConfig(configs, ['global', 'tag', 'tag:12'])).toEqual({ height: { preset: 's' } });
    expect(sectionOwner(configs, ['global', 'discussion'], 'buttons')).toBeNull();
  });

  it('lets tags and discussions opt in at their own level', () => {
    const tagButtons = { ...buttons, placement: 'top-left' };
    const withTag = { ...configs, tag: { buttons: tagButtons } };

    expect(resolveConfig(withTag, ['global', 'tag', 'tag:12']).buttons).toBe(tagButtons);
    expect(sectionOwner(withTag, ['global', 'tag', 'tag:12'], 'buttons')).toBe('tag');
  });

  it('shows the default buttons where a level asks for them', () => {
    expect(resolveConfig({ ...configs, tag: { buttons: 'inherit' } }, ['global', 'tag', 'tag:12']).buttons).toBe(buttons);
    expect(resolveConfig({ discussion: { buttons: 'inherit' } }, ['global', 'discussion']).buttons).toBeUndefined();
  });

  it('treats the social icons like the buttons', () => {
    const socials = { size: 's', placement: 'below-text', color: null, mobile: 'same', items: [] } as any;
    const withSocials = { global: { socials }, tag: {}, discussion: { socials: 'inherit' as const } };

    expect(resolveConfig(withSocials, ['global']).socials).toBe(socials);
    expect(resolveConfig(withSocials, ['global', 'tag', 'tag:12']).socials).toBeUndefined();
    expect(resolveConfig(withSocials, ['global', 'discussion']).socials).toBe(socials);
  });
});
