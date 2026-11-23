import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import WelcomeHero from 'flarum/forum/components/WelcomeHero';
import type ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import { configChain, normalizeConfigs, resolveConfig } from '../common/resolveConfig';
import type { ForumPayload, HeroConfig } from '../common/types';

/** The core's key (not exported), set when a visitor dismisses the Welcome hero. */
const CORE_DISMISSED_KEY = 'welcomeHidden';
/** Holds the custom text the visitor dismissed: a new text shows again. */
const CUSTOM_DISMISSED_KEY = 'wchWelcomeTextHidden';

/** The resolved Welcome config, or null when the Welcome hero is not customized. */
function welcomeConfig(): HeroConfig | null {
  const payload = app.forum.attribute<ForumPayload | undefined>('walsgitCustomHeroes');
  const config = payload ? resolveConfig(normalizeConfigs(payload.configs), configChain('welcome')) : {};

  return Object.keys(config).length > 0 ? config : null;
}

/** The custom text as one string, or null when the core text is used. */
function customText(config: HeroConfig): string | null {
  return config.text?.source === 'custom' ? `${config.text.title}\n${config.text.message}` : null;
}

function wasDismissed(config: HeroConfig): boolean {
  const custom = customText(config);

  try {
    return custom === null ? !!localStorage.getItem(CORE_DISMISSED_KEY) : localStorage.getItem(CUSTOM_DISMISSED_KEY) === custom;
  } catch (e) {
    // The browser blocks storage.
    return false;
  }
}

function dismiss(config: HeroConfig, hero: WelcomeHero) {
  const custom = customText(config);

  if (custom === null) {
    hero.hide();

    return;
  }

  try {
    localStorage.setItem(CUSTOM_DISMISSED_KEY, custom);
  } catch (e) {
    // The browser blocks storage: the text is shown again next time.
  }
}

/**
 * A customized Welcome hero is always shown, even without a core title. Its
 * text is the core's or a custom one; the close button only hides that text,
 * and `dismissible: false` removes the button.
 */
export default function extendWelcomeHero() {
  // Even with an empty core title: the hero shows its own settings.
  override(WelcomeHero.prototype, 'isHidden', function (this: WelcomeHero, original: () => boolean) {
    return welcomeConfig() ? false : original();
  });

  extend(WelcomeHero.prototype, 'contentItems', function (this: WelcomeHero, items: ItemList<Mithril.Children>) {
    const config = welcomeConfig();

    if (!config) return;

    const custom = config.text?.source === 'custom' ? config.text : null;
    const title = custom ? custom.title : app.forum.attribute<string>('welcomeTitle') ?? '';
    const message = custom ? custom.message : app.forum.attribute<string>('welcomeMessage') ?? '';

    // A custom text is plain text, never trusted HTML.
    if (!title.trim()) items.remove('title');
    else if (custom) items.setContent('title', m('h1.Hero-title', title));

    if (!message.trim()) items.remove('subtitle');
    else if (custom) items.setContent('subtitle', m('.Hero-subtitle.wch-Hero-message', message));
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
    } else if (wasDismissed(config)) {
      items.remove('dismiss-button');
      items.remove('content');
    } else {
      // Collapses the text instead of the whole hero, then redraws without it.
      (items.get('dismiss-button') as Mithril.Vnode<{ onclick: () => void }>).attrs.onclick = () => {
        this.$('.containerNarrow').slideUp(() => {
          dismiss(config, this);
          m.redraw();
        });
      };
    }
  });
}
