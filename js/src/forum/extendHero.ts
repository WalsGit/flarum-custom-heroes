import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Hero from 'flarum/forum/components/Hero';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { heroDecoration } from '../common/heroDecoration';
import { configChain, normalizeConfigs } from '../common/resolveConfig';
import type { ForumPayload } from '../common/types';
import { heroTarget } from './heroTarget';

function customizeHero(this: Hero, vdom: Mithril.Children) {
  // The header rendered by `Hero.view()`.
  const header = vdom as Mithril.Vnode<{ className?: string; style?: Record<string, string> }> | null;

  // Already customized: the hook runs once per hooked class in the chain.
  if (!header?.attrs || header.attrs.className?.split(' ').includes('wch-Hero')) return;

  const target = heroTarget(this);
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const decoration =
    target && payload
      ? heroDecoration(normalizeConfigs(payload.configs), configChain(target.scope, target.scopeId), target.scope, payload.assetsUrl)
      : null;

  if (!decoration) return;

  header.attrs.className = classList(header.attrs.className, decoration.className);
  // Added to the hero's own style (for example the color of a tag), not replacing it.
  header.attrs.style = { ...header.attrs.style, ...decoration.style };

  if (decoration.background) {
    header.children = [decoration.background, ...((header.children as Mithril.ChildArray | undefined) ?? [])];
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
