import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import type Hero from 'flarum/forum/components/Hero';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import type { HeroScope } from '../common/types';

export interface HeroTarget {
  scope: HeroScope;
  scopeId: string | null;
}

/**
 * Tells which config scope a hero belongs to, or null for the heroes the
 * extension does not customize (messages, user, …).
 */
export function heroTarget(hero: Hero): HeroTarget | null {
  if (hero instanceof WelcomeHero) {
    // The default config is the home hero's.
    return { scope: 'global', scopeId: null };
  }

  if (hero instanceof DiscussionHero) {
    return { scope: 'discussion', scopeId: null };
  }

  // flarum/tags is optional: its hero is recognized by its class name, so
  // that the extension does not import it.
  if (hero.className().split(' ').includes('TagHero')) {
    const model = (hero.attrs as { model?: { id(): string | undefined } }).model;

    return { scope: 'tag', scopeId: model?.id() ?? null };
  }

  return null;
}
