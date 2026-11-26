import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Hero from 'flarum/forum/components/Hero';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { decorateContent, heroDecoration, type HeroViewer } from '../common/heroDecoration';
import { configChain, discussionChain, normalizeConfigs } from '../common/resolveConfig';
import type { ForumPayload } from '../common/types';
import { heroTarget } from './heroTarget';

/** The current visitor, for the hero buttons. */
const viewer = (): HeroViewer => ({
  guest: !app.session.user,
  allowSignUp: !!app.forum.attribute('allowSignUp'),
  onAction: (action) =>
    app.modal.show(() => (action === 'login' ? import('flarum/forum/components/LogInModal') : import('flarum/forum/components/SignUpModal'))),
});

function customizeHero(this: Hero, vdom: Mithril.Children) {
  // The header rendered by `Hero.view()`.
  const header = vdom as Mithril.Vnode<{ className?: string; style?: Record<string, string> }> | null;

  // Already customized: the hook runs once per hooked class in the chain.
  if (!header?.attrs || header.attrs.className?.split(' ').includes('wch-Hero')) return;

  const target = heroTarget(this);
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const configs = normalizeConfigs(payload?.configs);
  const decoration =
    // The heroes of the other extensions are left as they are until the admin enables them.
    payload && (target.scope !== 'other' || configs.other?.enabled)
      ? heroDecoration(
          configs,
          target.scope === 'discussion'
            ? discussionChain(configs, target.tagId, target.parentId)
            : configChain(target.scope, target.scopeId, target.parentId),
          target.scope,
          payload.assetsUrl,
          viewer()
        )
      : null;

  if (!decoration) return;

  let className = header.attrs.className ?? '';
  let style = header.attrs.style;

  // The color flarum/tags gives a discussion hero (its first tag), and its text contrast.
  if (decoration.className.split(' ').includes('wch-Hero--noTagColor')) {
    className = className
      .split(' ')
      .filter((name) => name !== 'DiscussionHero--colored' && !name.startsWith('text-contrast--'))
      .join(' ');
    const { ['--hero-bg']: _, ...rest } = style ?? {};
    style = rest;
  }

  header.attrs.className = classList(className, decoration.className);
  // Added to the hero's own style (for example the color of a tag), not replacing it.
  header.attrs.style = { ...style, ...decoration.style };

  const children = () => (header.children as Mithril.ChildArray | undefined) ?? [];
  const container = children().find((child) => (child as Mithril.Vnode<{ className?: string }>)?.attrs?.className === 'container') as
    | Mithril.Vnode
    | undefined;

  if (container) {
    const { content, corners } = decorateContent((container.children as Mithril.ChildArray | undefined) ?? [], decoration);
    container.children = content;
    // In the corners of the hero itself, not of its content.
    header.children = [...children(), ...corners];
  }

  if (decoration.background) {
    header.children = [decoration.background, ...children()];
  }
}

/**
 * Hooks into `view()` rather than `className()` or `style()`, which the hero
 * subclasses override. A hero without config is left untouched.
 *
 * The base `Hero` covers every hero, but an extension that hooks a subclass
 * first (flarum/tags on `DiscussionHero`) gives it its own `view()`, built on
 * the original one: the known subclasses are hooked too.
 */
export default function extendHero() {
  [Hero, WelcomeHero, DiscussionHero].forEach((HeroClass) => extend(HeroClass.prototype, 'view', customizeHero));
}
