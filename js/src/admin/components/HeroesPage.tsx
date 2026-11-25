import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import isExtensionEnabled from 'flarum/admin/utils/isExtensionEnabled';
import Alert from 'flarum/common/components/Alert';
import Button from 'flarum/common/components/Button';
import Link from 'flarum/common/components/Link';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundOwner, normalizeConfigs, resolveConfig, sectionOwner, tagParentId } from '../../common/resolveConfig';
import {
  CENTER,
  DEFAULT_TEXT,
  type ImageRef,
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

/** Locale keys use underscores: `textStyle` → `text_style`. */
const localeKey = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** One icon per section tab. */
const TAB_ICONS: Record<EditedSection | 'text' | 'buttons', string> = {
  background: 'fas fa-image',
  overlay: 'fas fa-layer-group',
  height: 'fas fa-arrows-up-down',
  text: 'fas fa-heading',
  textStyle: 'fas fa-font',
  logo: 'fas fa-shapes',
  socials: 'fas fa-share-nodes',
  buttons: 'fas fa-hand-pointer',
};

/** JSON with sorted object keys: a section switched off and on again comes back last. */
const sortedJson = (value: unknown) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v
  );

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
  /** Sections switched off in the draft, given back when switched on again. */
  stash: HeroConfig = {};
  /** The target's own buttons, given back after switching to the default ones and back. */
  ownButtons: ButtonsSection | null = null;
  /** The open section tab. */
  tab: EditedSection | 'text' | 'buttons' = 'background';
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

            <HeroPreview
              configs={{ ...this.configs, [this.key]: this.draft }}
              target={this.key}
              chain={this.chain(this.key)}
              textTab={this.key === 'global' && this.tab === 'text'}
            />

            {this.tabs()}

            {/* Always at the bottom of the window, so that saving needs no scrolling. */}
            <div className="wch-HeroesPage-controls">
              <div className="container">
                <div className="Form-group Form-controls wch-HeroesPage-controlsInner">
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
                  {this.isDirty() && <span className="wch-HeroesPage-unsaved">{t('unsaved_label')}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /** The sections of this target, one tab each, only the open one rendered. */
  tabs() {
    const isInstance = !!targetOf(this.key).scopeId;
    const sections: Partial<Record<EditedSection | 'text' | 'buttons', () => Mithril.Children>> = {
      background: () =>
        this.section(
          'background',
          // The image of the level above belongs to it: never copied, used through `inherit`.
          (parent) => ({ image: parent?.image ? 'inherit' : null, position: parent?.position ?? CENTER }),
          (value, set) => (
            <BackgroundForm
              value={value}
              onchange={set}
              target={this.key}
              inherited={this.inheritedBackground()}
              preview={{ configs: { ...this.configs, [this.key]: this.draft }, target: this.key, chain: this.chain(this.key) }}
            />
          ),
          // Flarum has no background image: nothing to fall back to.
          t('background.add_label')
        ),
      overlay: () =>
        this.section(
          'overlay',
          (parent) => parent ?? { type: 'none' },
          (value, set) => <OverlayForm value={value} onchange={set} />,
          undefined,
          // "None" is the type list's own default: no switch needed when there is nothing to inherit.
          (value) => value.type === 'none'
        ),
      height: () =>
        this.section(
          'height',
          (parent) => parent ?? { preset: 'auto' },
          (value, set) => <HeightForm value={value} onchange={set} />,
          undefined,
          // Flarum's height is the list's own default, like "None" for the overlay.
          (value) => value.preset === 'auto'
        ),
    };

    if (this.key === 'global') sections.text = () => this.textSection();

    // Not per tag (D4).
    if (!isInstance) {
      sections.textStyle = () =>
        this.section(
          'textStyle',
          // Top, like the core, so that unticking changes nothing at first.
          (parent) => parent ?? { align: 'center', vAlign: 'top', titleSize: 'm', subtitleSize: 'm', color: null },
          (value, set) => <TextStyleForm value={value} onchange={set} />
        );
      sections.logo = () =>
        this.section(
          'logo',
          // The logo of the level above belongs to it: never copied.
          (parent) => ({ side: 'left', size: 'm', alt: '', hideOnMobile: false, ...parent, image: null }),
          (value, set) => <LogoForm value={value} onchange={set} target={this.key} />,
          t('logo.add_label')
        );
      sections.socials = () =>
        this.section(
          'socials',
          (parent) => parent ?? { size: 's', placement: 'below-text', color: null, mobile: 'same', items: [] },
          (value, set) => <SocialsForm value={value} onchange={set} taken={this.takenCorner('buttons')} />,
          t('socials.add_label')
        );
      sections.buttons = () => this.buttonsSection();
    }

    const names = Object.keys(sections) as (keyof typeof sections)[];
    // The open tab is kept from one target to the next when it has it.
    const open = names.includes(this.tab) ? this.tab : names[0];

    return (
      <div className="wch-Tabs">
        <div className="wch-Tabs-nav" role="tablist">
          {names.map((name) => (
            <Button
              className={classList('Button wch-Tabs-tab', name === open && 'wch-Tabs-tab--active')}
              icon={TAB_ICONS[name]}
              id={`wch-tab-${name}`}
              role="tab"
              aria-selected={name === open}
              aria-controls="wch-tabpanel"
              onclick={() => (this.tab = name)}
            >
              {t(`${localeKey(name)}.title`)}
              {/* Defined here rather than inherited. */}
              {this.draft[name] !== undefined && (
                <span className="wch-Tabs-dot" title={t('tab_customized')}>
                  <span className="visually-hidden">{t('tab_customized')}</span>
                </span>
              )}
            </Button>
          ))}
        </div>
        <div id="wch-tabpanel" role="tabpanel" aria-labelledby={`wch-tab-${open}`}>
          {sections[open]!()}
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
    addLabel?: string,
    isEmpty?: (value: NonNullable<HeroConfig[K]>) => boolean
  ) {
    const value = this.draft[name];
    // The hero's whole chain without the edited config: some sections are not inherited by every hero (buttons).
    const chain = this.chain(this.key);
    const parents = { ...this.configs, [this.key]: {} };
    const owner = sectionOwner(parents, chain, name);
    const set = (section: NonNullable<HeroConfig[K]>) => (this.draft = { ...this.draft, [name]: section });

    const toggle = (inherit: boolean) => {
      const { [name]: removed, ...rest } = this.draft;

      if (inherit) {
        // Kept aside: switching back on gives it back (until another target or a save).
        if (removed !== undefined) this.stash[name] = removed;
        this.draft = rest;
      } else {
        // Otherwise starts from what the hero shows now, so that unticking changes nothing at first.
        this.draft = { ...rest, [name]: this.stash[name] ?? initial(structuredClone(resolveConfig(parents, chain)[name])) };
      }
    };

    // Nothing to inherit and an "empty" value in the form itself: the form alone, its empty value stored as no section.
    if (!owner && isEmpty) {
      const shown = value ?? initial(undefined);
      const setOrRemove = (section: NonNullable<HeroConfig[K]>) => {
        const { [name]: _, ...rest } = this.draft;
        this.draft = isEmpty(section) ? rest : { ...rest, [name]: section };
      };

      return (
        <fieldset className={`wch-Section wch-Section--${name}`}>
          {this.intro(name)}
          {form(shown as NonNullable<HeroConfig[K]>, setOrRemove)}
        </fieldset>
      );
    }

    return (
      <fieldset className={`wch-Section wch-Section--${name}`}>
        {this.intro(name)}
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

  /** What the section does, at the top of its tab. */
  intro(name: string) {
    const text = app.translator.trans(`walsgit-custom-heroes.admin.${localeKey(name)}.intro`, { a: <Link href={app.route('basics')} /> });

    return <p className="helpText wch-Section-intro">{text}</p>;
  }

  /** The background image of the level above, which this target can use with its own position. */
  inheritedBackground() {
    const owner = backgroundOwner({ ...this.configs, [this.key]: {} }, this.chain(this.key));

    return owner ? { image: this.configs[owner].background!.image as ImageRef, owner, label: this.scopeLabel(owner) } : null;
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
   * Buttons are opt-in on the other heroes (the default ones are for the
   * home hero): shown or not, then the default buttons or their own.
   */
  buttonsSection() {
    const value = this.draft.buttons;
    const isDefault = this.key === 'global';
    const set = (buttons?: ButtonsSection | 'inherit') => {
      const { buttons: previous, ...rest } = this.draft;
      // Kept aside, like the other sections: switching back on gives them back.
      if (previous !== undefined && buttons === undefined) this.stash.buttons = previous;
      if (typeof previous === 'object' && buttons !== previous) this.ownButtons = previous;
      this.draft = buttons === undefined ? rest : { ...rest, buttons };
    };
    // Own buttons start from a copy of the default ones.
    const own = (): ButtonsSection => {
      const defaults = this.configs.global?.buttons;

      return !isDefault && defaults && defaults !== 'inherit' ? structuredClone(defaults) : { placement: 'below-text', mobile: 'same', items: [] };
    };

    return (
      <fieldset className="wch-Section wch-Section--buttons">
        {this.intro('buttons')}
        <Switch state={value !== undefined} onchange={(on: boolean) => set(on ? this.stash.buttons ?? (isDefault ? own() : 'inherit') : undefined)}>
          {t('buttons.add_label')}
        </Switch>
        {!isDefault && value === undefined && <p className="helpText">{t('buttons.opt_in_help')}</p>}

        {!isDefault && value !== undefined && (
          <Switch state={value === 'inherit'} onchange={(inherit: boolean) => set(inherit ? 'inherit' : this.ownButtons ?? own())}>
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
        {this.intro('text')}
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

    // Heroes of optional extensions, only when they are enabled.
    if (isExtensionEnabled('flarum-messages')) keys.push('messages');
    if (isExtensionEnabled('flarum-deck')) keys.push('deck');

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
    this.stash = {};
    this.ownButtons = null;
  }

  select(key: string) {
    if (this.isDirty() && !confirm(t('discard_confirm'))) {
      m.redraw(); // puts the select back on the current target

      return;
    }

    this.load(key);
  }

  isDirty(): boolean {
    return sortedJson(this.draft) !== sortedJson(this.configs[this.key] ?? {});
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
