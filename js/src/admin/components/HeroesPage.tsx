import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import isExtensionEnabled from 'flarum/admin/utils/isExtensionEnabled';
import Alert from 'flarum/common/components/Alert';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import type Mithril from 'mithril';
import { normalizeConfigs, resolveConfig, sectionOwner, tagParentId } from '../../common/resolveConfig';
import {
  DEFAULT_TEXT,
  type ForumPayload,
  type HeroConfig,
  type HeroConfigs,
  type Placement,
  type TextSection,
  type ButtonsSection,
} from '../../common/types';
import { parentChain, tagOrder, targetOf } from '../utils/scopes';
import { uploadLimits } from '../utils/uploadLimits';
import BackgroundForm from './BackgroundForm';
import ButtonsForm from './ButtonsForm';
import HeightForm from './HeightForm';
import HeroPreview from './HeroPreview';
import LogoForm from './LogoForm';
import OverlayForm from './OverlayForm';
import SocialsForm from './SocialsForm';
import TextForm from './TextForm';
import TextStyleForm from './TextStyleForm';

/** The sections this page edits. Other sections of a config are kept as they are. */
type EditedSection = 'background' | 'overlay' | 'height' | 'textStyle' | 'logo' | 'socials';

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.${key}`, params, true);

/**
 * Edits the hero config of one target at a time (global, a hero type or a
 * tag). Each section is either inherited from the level above or defined
 * here.
 */
export default class HeroesPage extends ExtensionPage {
  /** The config being edited: `global`, `discussion`, `tag:12`… */
  key = 'global';
  /** The stored configs, kept in sync with the server after each save. */
  configs: HeroConfigs = {};
  draft: HeroConfig = {};
  saving = false;

  oninit(vnode: Mithril.Vnode<any, this>) {
    super.oninit(vnode);

    this.configs = normalizeConfigs(app.forum.attribute<ForumPayload>('walsgitCustomHeroes')?.configs);
    this.load('global');

    // The admin only preloads some tags.
    if (this.tagsEnabled()) {
      app.store.find('tags').then(() => m.redraw());
    }
  }

  className() {
    return super.className() + ' wch-HeroesPage';
  }

  sections(vnode: Mithril.VnodeDOM<any, this>) {
    const items = super.sections(vnode);

    // The extension has no permissions.
    items.remove('permissions');

    return items;
  }

  content() {
    const stored = this.configs[this.key];

    return (
      <div className="ExtensionPage-settings">
        <div className="container">
          <div className="wch-HeroesPage-body">
            {!uploadLimits().webp && (
              <Alert type="error" dismissible={false}>
                {t('webp_unsupported')}
              </Alert>
            )}

            <div className="Form-group wch-HeroesPage-scope">
              <label>{t('scope_label')}</label>
              <Select value={this.key} options={this.scopeOptions()} onchange={(key: string) => this.select(key)} />
              <p className="helpText">{t('scope_help')}</p>
            </div>

            <HeroPreview configs={{ ...this.configs, [this.key]: this.draft }} target={this.key} chain={this.chain(this.key)} />

            <div className="wch-HeroesPage-sections">
              {this.section(
                'background',
                // The image of the level above belongs to it: never copied.
                (parent) => ({ image: null, position: parent?.position ?? 'center' }),
                (value, set) => (
                  <BackgroundForm value={value} onchange={set} target={this.key} />
                )
              )}
              {this.section(
                'overlay',
                (parent) => parent ?? { type: 'none' },
                (value, set) => (
                  <OverlayForm value={value} onchange={set} />
                )
              )}
              {this.section(
                'height',
                (parent) => parent ?? { preset: 'auto' },
                (value, set) => (
                  <HeightForm value={value} onchange={set} />
                )
              )}
              {this.key === 'global' && this.textSection()}
              {/* Not per tag (D4). */}
              {!targetOf(this.key).scopeId &&
                this.section(
                  'textStyle',
                  // Top, like the core, so that unticking changes nothing at first.
                  (parent) => parent ?? { align: 'center', vAlign: 'top', titleSize: 'm', subtitleSize: 'm', color: null },
                  (value, set) => <TextStyleForm value={value} onchange={set} />
                )}
              {/* Not per tag (D4). */}
              {!targetOf(this.key).scopeId &&
                this.section(
                  'logo',
                  // The logo of the level above belongs to it: never copied.
                  (parent) => ({ side: 'left', size: 'm', alt: '', hideOnMobile: false, ...parent, image: null }),
                  (value, set) => <LogoForm value={value} onchange={set} target={this.key} />,
                  t('logo.add_label')
                )}
              {/* Not per tag (D4). */}
              {!targetOf(this.key).scopeId &&
                this.section(
                  'socials',
                  (parent) => parent ?? { size: 's', placement: 'below-text', color: null, mobile: 'same', items: [] },
                  (value, set) => <SocialsForm value={value} onchange={set} taken={this.takenCorner('buttons')} />,
                  t('socials.add_label')
                )}
              {/* Not per tag (D4). */}
              {!targetOf(this.key).scopeId && this.buttonsSection()}
            </div>

            <div className="Form-group Form-controls wch-HeroesPage-controls">
              <Button
                className="Button Button--primary"
                loading={this.saving}
                disabled={!this.isDirty() || this.saving}
                onclick={() => this.save(this.draft)}
              >
                {t('save_button')}
              </Button>
              <Button className="Button" disabled={!this.isDirty() || this.saving} onclick={() => this.load(this.key)}>
                {t('cancel_button')}
              </Button>
              {stored && (
                <Button className="Button" icon="fas fa-undo" disabled={this.saving} onclick={() => this.reset()}>
                  {this.key === 'global' ? t('reset_global_button') : t('reset_button')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * A section card: inherited (with where it comes from) or defined here.
   * With `addLabel`, a section that has nothing to inherit is switched on to
   * be added ("Add a logo") rather than off to stop using Flarum's default.
   */
  section<K extends EditedSection>(
    name: K,
    initial: (parent: HeroConfig[K] | undefined) => NonNullable<HeroConfig[K]>,
    form: (value: NonNullable<HeroConfig[K]>, set: (value: NonNullable<HeroConfig[K]>) => void) => Mithril.Children,
    addLabel?: string
  ) {
    const value = this.draft[name];
    // The hero's whole chain without the edited config: some sections are not inherited by every hero (buttons).
    const chain = this.chain(this.key);
    const parents = { ...this.configs, [this.key]: {} };
    const owner = sectionOwner(parents, chain, name);
    const set = (section: NonNullable<HeroConfig[K]>) => (this.draft = { ...this.draft, [name]: section });

    const toggle = (inherit: boolean) => {
      const { [name]: _, ...rest } = this.draft;
      // Starts from what the hero shows now, so that unticking changes nothing at first.
      this.draft = inherit ? rest : { ...rest, [name]: initial(structuredClone(resolveConfig(parents, chain)[name])) };
    };

    return (
      <fieldset className={`wch-Section wch-Section--${name}`}>
        {/* Locale keys use underscores: `textStyle` → `text_style`. */}
        <legend>{t(`${name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}.title`)}</legend>

        {!owner && addLabel ? (
          <Switch state={value !== undefined} onchange={(add: boolean) => toggle(!add)}>
            {addLabel}
          </Switch>
        ) : (
          <Switch state={value === undefined} onchange={toggle}>
            {owner ? t('inherit_from_label', { source: this.scopeLabel(owner) }) : t('inherit_core_label')}
          </Switch>
        )}

        {value !== undefined && form(value as NonNullable<HeroConfig[K]>, set)}
      </fieldset>
    );
  }

  /**
   * The corner used by the buttons or the icons in the config this hero
   * will use (draft and inherited), which the other one cannot take.
   */
  takenCorner(name: 'socials' | 'buttons'): Placement | null {
    const placement = resolveConfig({ ...this.configs, [this.key]: this.draft }, this.chain(this.key))[name]?.placement;

    return placement && placement !== 'below-text' ? placement : null;
  }

  /**
   * Buttons are opt-in on tags and discussions (the default ones are for the
   * home hero): shown or not, then the default buttons or their own.
   */
  buttonsSection() {
    const value = this.draft.buttons;
    const isDefault = this.key === 'global';
    const set = (buttons?: ButtonsSection | 'inherit') => {
      const { buttons: _, ...rest } = this.draft;
      this.draft = buttons === undefined ? rest : { ...rest, buttons };
    };
    // Own buttons start from a copy of the default ones.
    const own = (): ButtonsSection => {
      const defaults = this.configs.global?.buttons;

      return !isDefault && defaults && defaults !== 'inherit' ? structuredClone(defaults) : { placement: 'below-text', mobile: 'same', items: [] };
    };

    return (
      <fieldset className="wch-Section wch-Section--buttons">
        <legend>{t('buttons.title')}</legend>

        <Switch state={value !== undefined} onchange={(on: boolean) => set(on ? (isDefault ? own() : 'inherit') : undefined)}>
          {t('buttons.add_label')}
        </Switch>
        {!isDefault && value === undefined && <p className="helpText">{t('buttons.opt_in_help')}</p>}

        {!isDefault && value !== undefined && (
          <Switch state={value === 'inherit'} onchange={(inherit: boolean) => set(inherit ? 'inherit' : own())}>
            {t('inherit_from_label', { source: this.scopeLabel('global') })}
          </Switch>
        )}

        {value !== undefined && value !== 'inherit' && <ButtonsForm value={value} onchange={set} taken={this.takenCorner('socials')} />}
      </fieldset>
    );
  }

  /** Default level only (home hero), with no level to inherit from: the default is stored as a missing section. */
  textSection() {
    const set = (text: TextSection) => {
      const { text: _, ...rest } = this.draft;
      const isDefault = text.afterClose === DEFAULT_TEXT.afterClose && !text.title && !text.message;
      this.draft = isDefault ? rest : { ...rest, text };
    };

    return (
      <fieldset className="wch-Section wch-Section--text">
        <legend>{t('text.title')}</legend>
        <TextForm value={this.draft.text ?? DEFAULT_TEXT} onchange={set} />
      </fieldset>
    );
  }

  tagsEnabled(): boolean {
    return isExtensionEnabled('flarum-tags');
  }

  /** The keys of the configs a target uses, itself last: a child tag inherits from its parent. */
  chain(key: string): string[] {
    const { scope, scopeId } = targetOf(key);
    const parentId = scope === 'tag' && scopeId ? tagParentId(app.store.getById('tags', scopeId)) : null;

    return [...parentChain(key, parentId), key];
  }

  scopeLabel(key: string): string {
    const { scope, scopeId } = targetOf(key);

    if (scopeId) {
      const tag = app.store.getById('tags', scopeId);

      return t('scopes.tag_instance', { name: tag ? (tag.attribute('name') as string) : `#${scopeId}` });
    }

    return t(`scopes.${scope}`);
  }

  scopeOptions(): Record<string, string> {
    const keys = ['global', 'discussion'];

    if (this.tagsEnabled()) {
      const tags = app.store.all('tags').map((tag) => ({
        id: tag.id()!,
        name: tag.attribute('name') as string,
        position: tag.attribute('position') as number | null,
        parentId: tagParentId(tag),
      }));

      keys.push('tag', ...tagOrder(tags).map((id) => `tag:${id}`));
    }

    return Object.fromEntries(
      keys.map((key) => {
        // Indented under the level it inherits from (spaces would collapse in an option).
        const depth = this.chain(key).length - 1;
        const indent = depth > 0 ? '\u00a0\u00a0\u00a0\u00a0'.repeat(depth - 1) + '└\u00a0' : '';
        // Customized targets are marked, so that they are easy to find.
        const label = this.configs[key] ? t('scopes.customized', { label: this.scopeLabel(key) }) : this.scopeLabel(key);

        return [key, indent + label];
      })
    );
  }

  load(key: string) {
    this.key = key;
    this.draft = structuredClone(this.configs[key] ?? {});
  }

  select(key: string) {
    if (this.isDirty() && !confirm(t('discard_confirm'))) {
      m.redraw(); // puts the select back on the current target

      return;
    }

    this.load(key);
  }

  isDirty(): boolean {
    return JSON.stringify(this.draft) !== JSON.stringify(this.configs[this.key] ?? {});
  }

  reset() {
    if (confirm(t('reset_confirm', { target: this.scopeLabel(this.key) }))) {
      this.save({});
    }
  }

  save(config: HeroConfig) {
    const draft = structuredClone(config);

    // The server wants ascending color stops.
    if (draft.overlay && 'stops' in draft.overlay) {
      draft.overlay.stops.sort((a, b) => a.at - b.at);
    }

    const key = this.key;
    this.saving = true;

    app
      .request<{ config: HeroConfig }>({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/walsgit-custom-heroes/configs',
        body: { ...targetOf(key), config: Object.keys(draft).length > 0 ? draft : null },
      })
      .then((response) => {
        if (Object.keys(response.config).length > 0) {
          this.configs[key] = response.config;
        } else {
          delete this.configs[key];
        }

        app.forum.pushAttributes({ walsgitCustomHeroes: { ...app.forum.attribute<ForumPayload>('walsgitCustomHeroes'), configs: this.configs } });
        this.load(key);
        app.alerts.show({ type: 'success' }, t('saved_message'));
      })
      // app.request already shows the error to the admin.
      .catch(() => {})
      .finally(() => {
        this.saving = false;
        m.redraw();
      });
  }
}
