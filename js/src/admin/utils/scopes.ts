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
 * the closest. For example `['global', 'tag']` for `tag:12`.
 */
export function parentChain(key: string): string[] {
  const { scope, scopeId } = targetOf(key);

  if (scope === 'global') return [];

  return scopeId ? ['global', scope] : ['global'];
}
