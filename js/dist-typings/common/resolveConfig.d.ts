import type { HeroConfig, HeroConfigs, HeroScope, ResolvedConfig } from './types';
/**
 * Returns the configs of the forum payload as an object. The API sends an
 * empty list (`[]`) instead of an empty object when nothing is configured.
 */
export declare function normalizeConfigs(configs: unknown): HeroConfigs;
/**
 * The keys of the configs that apply to a hero, from the most general to the
 * most specific. For example `['global', 'tag', 'tag:12']`.
 */
export declare function configChain(scope: HeroScope, scopeId?: string | null): string[];
/**
 * Applies the inheritance: each section comes from the most specific config
 * of the chain that defines it. Sections are replaced as a whole, never
 * merged key by key.
 */
export declare function resolveConfig(configs: HeroConfigs, chain: string[]): ResolvedConfig;
/**
 * The key of the config that defines a section for a hero (the most specific
 * one of the chain), or null when no config defines it. Images belong to that
 * config: an inherited background uses the file of the level above.
 */
export declare function sectionOwner(configs: HeroConfigs, chain: string[], section: keyof HeroConfig): string | null;
