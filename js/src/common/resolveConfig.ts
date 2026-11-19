import type { HeroConfig, HeroConfigs, HeroScope } from './types';

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
export function configChain(scope: Exclude<HeroScope, 'global'>, scopeId?: string | null): string[] {
  const chain = ['global', scope];

  if (scopeId) {
    chain.push(`${scope}:${scopeId}`);
  }

  return chain;
}

/**
 * Applies the inheritance: each section comes from the most specific config
 * of the chain that defines it. Sections are replaced as a whole, never
 * merged key by key.
 */
export function resolveConfig(configs: HeroConfigs, chain: string[]): HeroConfig {
  const resolved: HeroConfig = {};

  for (const key of chain) {
    if (Object.prototype.hasOwnProperty.call(configs, key)) {
      Object.assign(resolved, configs[key]);
    }
  }

  return resolved;
}
