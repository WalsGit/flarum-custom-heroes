import type { HeroConfig, HeroConfigs, HeroScope, ResolvedConfig } from './types';

/**
 * Returns the configs of the forum payload as an object. The API sends an
 * empty list (`[]`) instead of an empty object when nothing is configured.
 */
export function normalizeConfigs(configs: unknown): HeroConfigs {
  if (configs === null || typeof configs !== 'object' || Array.isArray(configs)) {
    return {};
  }

  return configs as HeroConfigs;
}

/**
 * The keys of the configs that apply to a hero, from the most general to the
 * most specific. For example `['global', 'tag', 'tag:12']`.
 */
export function configChain(scope: HeroScope, scopeId?: string | null): string[] {
  // The home (Welcome) hero uses the default config itself.
  if (scope === 'global') return ['global'];

  const chain = ['global', scope];

  if (scopeId) {
    chain.push(`${scope}:${scopeId}`);
  }

  return chain;
}

/** Sections the default level gives to the home hero only: the other heroes opt in at their own level (buttons: `inherit`). */
const HOME_ONLY: (keyof HeroConfig)[] = ['buttons'];

/** What a config of the chain gives to the hero: the default level keeps its home-only sections for the home hero. */
function inheritedPart(configs: HeroConfigs, chain: string[], key: string): HeroConfig | undefined {
  const config = Object.prototype.hasOwnProperty.call(configs, key) ? configs[key] : undefined;

  if (!config || key !== 'global' || chain.length === 1) return config;

  return Object.fromEntries(Object.entries(config).filter(([section]) => !HOME_ONLY.includes(section as keyof HeroConfig)));
}

/**
 * Applies the inheritance: each section comes from the most specific config
 * of the chain that defines it. Sections are replaced as a whole, never
 * merged key by key.
 */
export function resolveConfig(configs: HeroConfigs, chain: string[]): ResolvedConfig {
  const resolved: HeroConfig = {};

  for (const key of chain) {
    Object.assign(resolved, inheritedPart(configs, chain, key));
  }

  if (resolved.buttons === 'inherit') {
    const buttons = configs.global?.buttons;

    if (buttons && buttons !== 'inherit') resolved.buttons = buttons;
    else delete resolved.buttons;
  }

  return resolved as ResolvedConfig;
}

/**
 * The key of the config that defines a section for a hero (the most specific
 * one of the chain), or null when no config defines it. Images belong to that
 * config: an inherited background uses the file of the level above.
 */
export function sectionOwner(configs: HeroConfigs, chain: string[], section: keyof HeroConfig): string | null {
  return [...chain].reverse().find((key) => inheritedPart(configs, chain, key)?.[section] !== undefined) ?? null;
}
