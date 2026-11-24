import { configChain } from '../../common/resolveConfig';
import type { HeroScope } from '../../common/types';

/** A config row target, as the API expects it. */
export interface Target {
  scope: HeroScope;
  scopeId: string;
}

/** `global`, `discussion`, `tag:12`… to `{ scope, scopeId }`. */
export function targetOf(key: string): Target {
  const [scope, scopeId = ''] = key.split(':');

  return { scope: scope as HeroScope, scopeId };
}

/**
 * The keys of the configs a target inherits from, from the most general to
 * the closest. For example `['global', 'tag']` for `tag:12`, or
 * `['global', 'tag', 'tag:3']` when tag 12 is a child of tag 3.
 */
export function parentChain(key: string, parentId?: string | null): string[] {
  const { scope, scopeId } = targetOf(key);

  return configChain(scope, scopeId, parentId).slice(0, -1);
}

/** What `tagOrder()` needs to know about a tag. */
export interface TagInfo {
  id: string;
  name: string;
  position: number | null;
  parentId: string | null;
}

/**
 * Tag ids in Flarum's order: primary tags by position, each followed by its
 * children, then secondary tags (no position) by name.
 */
export function tagOrder(tags: TagInfo[]): string[] {
  const byPosition = (a: TagInfo, b: TagInfo) => (a.position ?? 0) - (b.position ?? 0);
  const roots = tags.filter((tag) => !tag.parentId);
  const primary = roots.filter((tag) => tag.position !== null).sort(byPosition);
  const secondary = roots.filter((tag) => tag.position === null).sort((a, b) => a.name.localeCompare(b.name));

  return [...primary, ...secondary].flatMap((tag) => [
    tag.id,
    ...tags
      .filter((child) => child.parentId === tag.id)
      .sort(byPosition)
      .map((child) => child.id),
  ]);
}
