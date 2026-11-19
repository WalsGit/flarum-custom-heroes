import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Hero from 'flarum/forum/components/Hero';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { heroStyle } from '../common/heroStyle';
import { configChain, normalizeConfigs, resolveConfig } from '../common/resolveConfig';
import type { ForumPayload, HeroConfig } from '../common/types';
import { heroTarget, type HeroTarget } from './heroTarget';

/**
 * The config that applies to a hero, or null when nothing is configured for it.
 */
export function targetConfig(target: HeroTarget): HeroConfig | null {
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const config = resolveConfig(normalizeConfigs(payload?.configs), configChain(target.scope, target.scopeId));

  return Object.keys(config).length > 0 ? config : null;
}

/**
 * Hooks into the base `Hero` component, so that every hero is covered with a
 * single extension. `view()` is used rather than `className()` or `style()`,
 * which the hero subclasses override. A hero without config is left untouched.
 */
export default function extendHero() {
  extend(Hero.prototype, 'view', function (this: Hero, vdom) {
    const target = vdom ? heroTarget(this) : null;
    const config = target ? targetConfig(target) : null;

    if (!vdom || !target || !config) return;

    // The header rendered by `Hero.view()`.
    const attrs = (vdom as Mithril.Vnode<{ className?: string; style?: Record<string, string> }>).attrs;
    attrs.className = classList(attrs.className, 'wch-Hero', `wch-Hero--${target.scope}`);
    // Added to the hero's own style (for example the color of a tag), not replacing it.
    attrs.style = { ...attrs.style, ...heroStyle(config) };
  });
}
