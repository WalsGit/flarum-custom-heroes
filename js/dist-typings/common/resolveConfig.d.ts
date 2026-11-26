import type { HeroConfig, HeroConfigs, HeroScope, ResolvedConfig } from './types';
/**
 * Returns the configs of the forum payload as an object. The API sends an
 * empty list (`[]`) instead of an empty object when nothing is configured.
 */
export declare function normalizeConfigs(configs: unknown): HeroConfigs;
/**
 * The keys of the configs that apply to a hero, from the most general to the
 * most specific. For example `['global', 'tag', 'tag:12']`, or
 * `['global', 'tag', 'tag:3', 'tag:12']` for a child of tag 3.
 */
export declare function configChain(scope: HeroScope, scopeId?: string | null, parentId?: string | null): string[];
/**
 * The keys of the configs of a discussion hero. With the `tagHero` option,
 * the configs of a tagged discussion's tag hero come last: the tags level,
 * the parent tag, then the tag. A discussion without tags keeps its own.
 */
export declare function discussionChain(configs: HeroConfigs, tagId?: string | null, parentId?: string | null): string[];
/** The id of a tag's parent, read from the relationship data: the parent model may not be in the store. */
export declare function tagParentId(tag: {
    data: {
        relationships?: Record<string, unknown>;
    };
} | null | undefined): string | null;
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
/**
 * The key of the config whose background image a hero shows: the most
 * specific one that sets an image (`inherit` passes to the level above), or
 * null when there is none. Files are named after it.
 */
export declare function backgroundOwner(configs: HeroConfigs, chain: string[]): string | null;
