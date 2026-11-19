import { configChain, normalizeConfigs, resolveConfig } from '../../src/common/resolveConfig';
import type { HeroConfigs } from '../../src/common/types';

const configs: HeroConfigs = {
  global: {
    background: { image: null, position: 'top' },
    height: { preset: 's' },
    overlay: { type: 'solid', color: '#00000080' },
  },
  tag: {
    height: { preset: 'm' },
  },
  'tag:12': {
    height: { preset: 'custom', desktop: 400, tablet: 300, mobile: 200 },
    overlay: { type: 'none' },
  },
  welcome: {
    dismissible: false,
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
    expect(configChain('welcome')).toEqual(['global', 'welcome']);
    expect(configChain('tag', '12')).toEqual(['global', 'tag', 'tag:12']);
  });

  it('has no instance level without an id', () => {
    expect(configChain('tag', null)).toEqual(['global', 'tag']);
    expect(configChain('tag', '')).toEqual(['global', 'tag']);
  });
});

describe('resolveConfig', () => {
  it('takes each section from the most specific config that defines it', () => {
    const resolved = resolveConfig(configs, configChain('tag', '12'));

    expect(resolved.background).toEqual({ image: null, position: 'top' });
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
    expect(resolved).not.toHaveProperty('dismissible');
  });

  it('returns an empty config when nothing applies', () => {
    expect(resolveConfig({}, configChain('welcome'))).toEqual({});
  });

  it('does not mutate the stored configs', () => {
    resolveConfig(configs, configChain('tag', '12'));

    expect(configs.global.height).toEqual({ preset: 's' });
  });

  it('only reads own keys', () => {
    expect(resolveConfig({}, ['toString', '__proto__'])).toEqual({});
  });
});
