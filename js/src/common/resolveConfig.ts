import type { HeroConfig, HeroConfigs, HeroScope, ImageRef, ResolvedConfig } from './types';

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
 * most specific. For example `['global', 'tag', 'tag:12']`, or
 * `['global', 'tag', 'tag:3', 'tag:12']` for a child of tag 3.
 */
export function configChain(scope: HeroScope, scopeId?: string | null, parentId?: string | null): string[] {
  // The home (Welcome) hero uses the default config itself.
  if (scope === 'global') return ['global'];

  const chain = ['global', scope];

  if (scopeId) {
    if (parentId) chain.push(`${scope}:${parentId}`);
    chain.push(`${scope}:${scopeId}`);
  }

  return chain;
}

/**
 * The keys of the configs of a discussion hero. With the `tagHero` option,
 * the configs of a tagged discussion's tag hero come last: the tags level,
 * the parent tag, then the tag. A discussion without tags keeps its own.
 */
export function discussionChain(configs: HeroConfigs, tagId?: string | null, parentId?: string | null): string[] {
  const chain = configChain('discussion');

  return configs.discussion?.tagHero && tagId ? [...chain, ...configChain('tag', tagId, parentId).slice(1)] : chain;
}

/** The id of a tag's parent, read from the relationship data: the parent model may not be in the store. */
export function tagParentId(tag: { data: { relationships?: Record<string, unknown> } } | null | undefined): string | null {
  const parent = tag?.data.relationships?.parent as { data?: { id?: string } | null } | undefined;

  return parent?.data?.id ?? null;
}

/** Sections the default level gives to the home hero only: the other heroes opt in at their own level (`inherit`). */
const HOME_ONLY = ['socials', 'buttons'] as const;

/** What a discussion takes from the hero of its tag (`tagHero`). */
const TAG_HERO_SECTIONS = ['background', 'overlay', 'height'];

/**
 * What a config of the chain gives to the hero: the default level keeps its
 * home-only sections for the home hero, and the tag levels of a discussion
 * only give their background, overlay and height.
 */
function inheritedPart(configs: HeroConfigs, chain: string[], key: string): HeroConfig | undefined {
  const config = Object.prototype.hasOwnProperty.call(configs, key) ? configs[key] : undefined;

  if (config && chain[1] === 'discussion' && (key === 'tag' || key.startsWith('tag:'))) {
    return Object.fromEntries(Object.entries(config).filter(([section]) => TAG_HERO_SECTIONS.includes(section)));
  }

  if (!config || key !== 'global' || chain.length === 1) return config;

  return Object.fromEntries(Object.entries(config).filter(([section]) => !(HOME_ONLY as readonly string[]).includes(section)));
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

  if (resolved.background?.image === 'inherit') {
    const owner = backgroundOwner(configs, chain);
    resolved.background = { ...resolved.background, image: owner ? (configs[owner].background!.image as ImageRef) : null };
  }

  for (const section of HOME_ONLY) {
    if (resolved[section] !== 'inherit') continue;
    const defaults = configs.global?.[section];

    if (defaults && defaults !== 'inherit') (resolved as Record<string, unknown>)[section] = defaults;
    else delete resolved[section];
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

/**
 * The key of the config whose background image a hero shows: the most
 * specific one that sets an image (`inherit` passes to the level above), or
 * null when there is none. Files are named after it.
 */
export function backgroundOwner(configs: HeroConfigs, chain: string[]): string | null {
  let fromTag = false;

  for (const key of [...chain].reverse()) {
    // A tag's `inherit` means the image above it on its own hero, even in a discussion (`tagHero`).
    if (fromTag && key === 'discussion') continue;

    const image = inheritedPart(configs, chain, key)?.background?.image;

    if (image === null) return null;
    if (image && image !== 'inherit') return key;
    if (image === 'inherit' && (key === 'tag' || key.startsWith('tag:'))) fromTag = true;
  }

  return null;
}
