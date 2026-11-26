import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import type Hero from 'flarum/forum/components/Hero';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import { tagParentId } from '../common/resolveConfig';
import type { HeroScope } from '../common/types';

export interface HeroTarget {
  scope: HeroScope;
  scopeId: string | null;
  /** A child tag's parent, which it inherits from. */
  parentId?: string | null;
  /** Discussions: the tag whose hero they can use (`tagHero`). */
  tagId?: string | null;
}

/** The heroes of optional extensions that have their own target, by class name. */
const CLASS_SCOPES = {
  MessagesPageHero: 'messages',
  DeckPageHero: 'deck',
  PageHero: 'pages',
  UserDirectoryHero: 'users',
  // fof/polls: its pages, and the pages where polls and poll groups are composed.
  PollPageHero: 'polls',
  ComposePollHero: 'polls',
  ComposePollGroupHero: 'polls',
} as const satisfies Record<string, HeroScope>;

type TagModel = { id(): string | undefined; attribute(name: string): unknown; data: { relationships?: Record<string, unknown> } };

/**
 * The most specific tag of a discussion: its child tag, or else its primary
 * tag, or else its first (secondary) tag. Null without flarum/tags.
 */
function discussionTag(discussion: { tags?: () => (TagModel | undefined)[] | false }): TagModel | null {
  const tags = (discussion.tags?.() || []).filter((tag): tag is TagModel => !!tag);

  return tags.find((tag) => tagParentId(tag)) ?? tags.find((tag) => tag.attribute('position') !== null) ?? tags[0] ?? null;
}

/**
 * Tells which config scope a hero belongs to. The heroes of the other
 * extensions all belong to `other`.
 */
export function heroTarget(hero: Hero): HeroTarget {
  if (hero instanceof WelcomeHero) {
    // The default config is the home hero's.
    return { scope: 'global', scopeId: null };
  }

  if (hero instanceof DiscussionHero) {
    const tag = discussionTag(hero.attrs.discussion as Parameters<typeof discussionTag>[0]);

    return { scope: 'discussion', scopeId: null, tagId: tag?.id() ?? null, parentId: tagParentId(tag) };
  }

  // flarum/tags, flarum/messages, flarum/deck and the fof extensions are optional: their
  // heroes are recognized by their class name, so that the extension does not import them.
  const classes = hero.className().split(' ');
  const scope = (Object.keys(CLASS_SCOPES) as (keyof typeof CLASS_SCOPES)[]).find((name) => classes.includes(name));

  // A page of fof/pages can have its own config.
  if (scope === 'PageHero') return { scope: 'pages', scopeId: (hero.attrs as { page?: { id(): string | undefined } }).page?.id() ?? null };
  if (scope) return { scope: CLASS_SCOPES[scope], scopeId: null };

  if (classes.includes('TagHero')) {
    const model = (hero.attrs as { model?: { id(): string | undefined; data: { relationships?: Record<string, unknown> } } }).model;

    return { scope: 'tag', scopeId: model?.id() ?? null, parentId: tagParentId(model) };
  }

  return { scope: 'other', scopeId: null };
}
