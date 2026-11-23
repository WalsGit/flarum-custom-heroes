import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import { configChain, normalizeConfigs, resolveConfig } from '../common/resolveConfig';
import { DEFAULT_TEXT, type ForumPayload, type HeroConfig } from '../common/types';

/** The core's key (not exported), set when a visitor closes the welcome text. */
const DISMISSED_KEY = 'welcomeHidden';

/** The resolved Welcome config, or null when the Welcome hero is not customized. */
function welcomeConfig(): HeroConfig | null {
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const config = payload ? resolveConfig(normalizeConfigs(payload.configs), configChain('welcome')) : {};

  return Object.keys(config).length > 0 ? config : null;
}

/** Flarum's welcome text was closed by the visitor, or there is none. */
function isClosed(): boolean {
  if (!app.forum.attribute<string>('welcomeTitle')?.trim()) return true;

  try {
    return !!localStorage.getItem(DISMISSED_KEY);
  } catch (e) {
    // The browser blocks storage.
    return false;
  }
}

/**
 * Flarum's welcome text is shown and closed like in Flarum. Once it is closed
 * (or when there is none), a customized Welcome hero either stays, with its
 * own permanent text or without text, or disappears like in Flarum.
 */
export default function extendWelcomeHero() {
  override(WelcomeHero.prototype, 'isHidden', function (this: WelcomeHero, original: () => boolean) {
    const config = welcomeConfig();

    if (!config) return original();

    return isClosed() && (config.text ?? DEFAULT_TEXT).afterClose === 'none';
  });

  extend(WelcomeHero.prototype, 'contentItems', function (this: WelcomeHero, items: ItemList<Mithril.Children>) {
    const config = welcomeConfig();

    if (!config) return;

    if (!isClosed()) {
      if (!app.forum.attribute<string>('welcomeMessage')?.trim()) items.remove('subtitle');

      return;
    }

    // The permanent text: plain text, never trusted HTML.
    const { title, message } = config.text ?? DEFAULT_TEXT;

    if (title.trim()) items.setContent('title', m('h1.Hero-title', title));
    else items.remove('title');

    if (message.trim()) items.setContent('subtitle', m('.Hero-subtitle.wch-Hero-message', message));
    else items.remove('subtitle');
  });

  extend(WelcomeHero.prototype, 'bodyItems', function (this: WelcomeHero, items: ItemList<Mithril.Children>) {
    const config = welcomeConfig();

    if (!config || !items.has('dismiss-button')) return;

    if (isClosed()) {
      items.remove('dismiss-button');
      if (this.contentItems().isEmpty()) items.remove('content');
    } else if ((config.text ?? DEFAULT_TEXT).afterClose === 'hero') {
      // Swaps the texts instead of collapsing the whole hero (which the core does, as for `none`).
      (items.get('dismiss-button') as Mithril.Vnode<{ onclick: () => void }>).attrs.onclick = () => {
        this.$('.containerNarrow').slideUp(() => {
          this.hide();
          m.redraw.sync();
          this.$('.containerNarrow').hide().slideDown();
        });
      };
    }
  });
}
