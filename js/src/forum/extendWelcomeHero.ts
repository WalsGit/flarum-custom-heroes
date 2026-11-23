import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import { configChain, normalizeConfigs, resolveConfig } from '../common/resolveConfig';
import type { ForumPayload, HeroConfig } from '../common/types';

/** The core's key (not exported), set when a visitor dismisses the Welcome hero. */
const DISMISSED_KEY = 'welcomeHidden';

/** The resolved Welcome config, or null when the Welcome hero is not customized. */
function welcomeConfig(): HeroConfig | null {
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const config = payload ? resolveConfig(normalizeConfigs(payload.configs), configChain('welcome')) : {};

  return Object.keys(config).length > 0 ? config : null;
}

function wasDismissed(): boolean {
  try {
    return !!localStorage.getItem(DISMISSED_KEY);
  } catch (e) {
    // The browser blocks storage.
    return false;
  }
}

/**
 * A customized Welcome hero is always shown, even without a core title: its
 * close button only hides the text (title and message), and
 * `dismissible: false` removes the button.
 */
export default function extendWelcomeHero() {
  // Even with an empty core title: the hero shows its own settings.
  override(WelcomeHero.prototype, 'isHidden', function (this: WelcomeHero, original: () => boolean) {
    return welcomeConfig() ? false : original();
  });

  extend(WelcomeHero.prototype, 'contentItems', function (this: WelcomeHero, items: ItemList<Mithril.Children>) {
    if (!welcomeConfig()) return;

    if (!app.forum.attribute<string>('welcomeTitle')?.trim()) items.remove('title');
    if (!app.forum.attribute<string>('welcomeMessage')?.trim()) items.remove('subtitle');
  });

  extend(WelcomeHero.prototype, 'bodyItems', function (this: WelcomeHero, items: ItemList<Mithril.Children>) {
    const config = welcomeConfig();

    if (!config || !items.has('dismiss-button')) return;

    if (this.contentItems().isEmpty()) {
      // No text: nothing to close.
      items.remove('dismiss-button');
      items.remove('content');
    } else if (config.dismissible === false) {
      items.remove('dismiss-button');
    } else if (wasDismissed()) {
      items.remove('dismiss-button');
      items.remove('content');
    } else {
      // Collapses the text instead of the whole hero, then redraws without it.
      (items.get('dismiss-button') as Mithril.Vnode<{ onclick: () => void }>).attrs.onclick = () => {
        this.$('.containerNarrow').slideUp(() => {
          this.hide();
          m.redraw();
        });
      };
    }
  });
}
