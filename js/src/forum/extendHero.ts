import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Hero from 'flarum/forum/components/Hero';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs } from '../common/backgroundImage';
import { heroStyle } from '../common/heroStyle';
import { configChain, normalizeConfigs, resolveConfig, sectionOwner } from '../common/resolveConfig';
import type { ForumPayload, HeroConfig } from '../common/types';
import { heroTarget, type HeroTarget } from './heroTarget';

/**
 * The config that applies to a hero, or null when nothing is configured for
 * it, with the background image attributes when it has one.
 */
export function targetConfig(target: HeroTarget): { config: HeroConfig; image: ReturnType<typeof backgroundImageAttrs> | null } | null {
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const configs = normalizeConfigs(payload?.configs);
  const chain = configChain(target.scope, target.scopeId);
  const config = resolveConfig(configs, chain);

  if (Object.keys(config).length === 0) return null;

  const owner = sectionOwner(configs, chain, 'background');
  const image = config.background?.image && owner && payload ? backgroundImageAttrs(payload.assetsUrl, owner, config.background.image) : null;

  return { config, image };
}

function customizeHero(this: Hero, vdom: Mithril.Children) {
  // The header rendered by `Hero.view()`.
  const header = vdom as Mithril.Vnode<{ className?: string; style?: Record<string, string> }> | null;

  // Already customized: the hook runs once per hooked class in the chain.
  if (!header?.attrs || header.attrs.className?.split(' ').includes('wch-Hero')) return;

  const target = heroTarget(this);
  const resolved = target ? targetConfig(target) : null;

  if (!target || !resolved) return;

  const { config, image } = resolved;

  const style = heroStyle(config);

  header.attrs.className = classList(header.attrs.className, 'wch-Hero', `wch-Hero--${target.scope}`, {
    'wch-Hero--image': !!image,
    'wch-Hero--overlay': '--wch-overlay' in style,
  });
  // Added to the hero's own style (for example the color of a tag), not replacing it.
  header.attrs.style = { ...header.attrs.style, ...style };

  if (image) {
    // Decorative, behind the content. An <img> rather than a CSS background, so that the browser picks the size.
    const background = m('img.wch-Hero-background', { alt: '', fetchpriority: 'high', decoding: 'async', ...image });
    header.children = [background, ...((header.children as Mithril.ChildArray | undefined) ?? [])];
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
