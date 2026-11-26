import { backgroundOwner, configChain, discussionChain, normalizeConfigs, resolveConfig, sectionOwner, tagParentId } from '../../src/common/resolveConfig';
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

describe('discussionChain', () => {
  it('adds the tag of the discussion, after its parent, only with the tagHero option', () => {
    expect(discussionChain({}, '12', '3')).toEqual(['global', 'discussion']);
    expect(discussionChain({ discussion: { tagHero: true } }, '12', '3')).toEqual(['global', 'discussion', 'tag', 'tag:3', 'tag:12']);
    expect(discussionChain({ discussion: { tagHero: true } }, '3')).toEqual(['global', 'discussion', 'tag', 'tag:3']);
    expect(discussionChain({ discussion: { tagHero: true } }, null)).toEqual(['global', 'discussion']);
  });

  it('takes the background, overlay and height of the tag over the discussion ones', () => {
    const configs: HeroConfigs = {
      discussion: { tagHero: true, height: { preset: 's' }, overlay: { type: 'none' } },
      'tag:12': { height: { preset: 'l' } },
    };

    expect(resolveConfig(configs, discussionChain(configs, '12'))).toMatchObject({ height: { preset: 'l' }, overlay: { type: 'none' } });
  });

  it("gives a tag's inherited image as on its own hero, skipping the discussion level", () => {
    const image = { id: '3f2a9c1d7b4e6a05', width: 1440, height: 540, widths: [640, 1024, 1440] };
    const configs: HeroConfigs = {
      global: { background: { image, position: { x: 50, y: 50 } } },
      discussion: { tagHero: true, background: { image: null, position: { x: 50, y: 50 } } },
      'tag:1': { background: { image: 'inherit', position: { x: 50, y: 0 } } },
    };
    const chain = discussionChain(configs, '1');

    expect(backgroundOwner(configs, chain)).toBe('global');
    expect(resolveConfig(configs, chain).background).toEqual({ image, position: { x: 50, y: 0 } });
    // Without a tag config, the discussion's own choice (no image) stays.
    expect(backgroundOwner(configs, discussionChain(configs, '2'))).toBeNull();
  });

  it('only takes the background, overlay and height of the tags level', () => {
    const textStyle = { align: 'left', vAlign: 'top', titleSize: 'xl', subtitleSize: 'm', color: null } as const;
    const configs: HeroConfigs = {
      discussion: { tagHero: true },
      tag: { overlay: { type: 'solid', color: '#00000080' }, textStyle, buttons: 'inherit', tagIcon: false },
    };
    const chain = discussionChain(configs, '12');

    expect(resolveConfig(configs, chain)).toEqual({ tagHero: true, overlay: { type: 'solid', color: '#00000080' } });
    expect(sectionOwner(configs, chain, 'textStyle')).toBeNull();
  });
});

describe('pages of fof/pages', () => {
  it('inherit from the level of all pages, and can hide its icons and buttons', () => {
    const socials = { size: 's', placement: 'top-left', color: null, mobile: 'same', items: [] } as const;
    const configs = { global: { socials }, pages: { socials: 'inherit', buttons: 'inherit' }, 'pages:1': { socials: false } } as any;

    expect(configChain('pages', '1')).toEqual(['global', 'pages', 'pages:1']);
    expect(resolveConfig(configs, ['global', 'pages'])).toEqual({ socials });
    expect(resolveConfig(configs, ['global', 'pages', 'pages:1'])).toEqual({});
  });
});
