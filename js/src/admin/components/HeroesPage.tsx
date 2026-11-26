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
  type SocialsSection,
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
type EditedSection = 'background' | 'overlay' | 'height' | 'textStyle' | 'logo';
/** Sections the other heroes opt in to: off, the default ones (`inherit`) or their own. */
type OptInSection = 'socials' | 'buttons';
type OwnSections = { socials: SocialsSection; buttons: ButtonsSection };

/** What own socials or buttons start from when there are no default ones to copy. */
const EMPTY: OwnSections = {
  socials: { size: 's', placement: 'below-text', color: null, mobile: 'same', items: [] },
  buttons: { placement: 'below-text', mobile: 'same', items: [] },
};

/** Locale keys use underscores: `textStyle` → `text_style`. */
const localeKey = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** One icon per section tab. */
const TAB_ICONS: Record<EditedSection | 'text' | OptInSection, string> = {
  background: 'fas fa-image',
  overlay: 'fas fa-layer-group',
  height: 'fas fa-arrows-up-down',
  text: 'fas fa-heading',
  textStyle: 'fas fa-font',
  logo: 'fas fa-shapes',
  socials: 'fas fa-share-nodes',
  buttons: 'far fa-square',
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
/** Heroes without a description: no description size. */
const NO_SUBTITLE = ['discussion', 'pages', 'users', 'polls'];

/** The title of a fof/pages page. */
const pageTitle = (page: { attribute(name: string): unknown }) => (page.attribute('title') as string) ?? '';

/** Loads every record of a paginated type (the admin preloads none of the pages). */
async function loadAll(type: string) {
  for (let offset = 0; ; ) {
    const records = await app.store.find<any[]>(type, { page: { offset, limit: 50 } });
    if (!records.payload?.links?.next || !records.length) return;
    offset += records.length;
  }
}

export default class HeroesPage extends ExtensionPage {
  /** The config being edited: `global`, `discussion`, `tag:12`… */
  key = 'global';
  /** The stored configs, kept in sync with the server after each save. */
  configs: HeroConfigs = {};
  draft: HeroConfig = {};
  /** Sections switched off in the draft, given back when switched on again. */
  stash: HeroConfig = {};
  /** The target's own socials or buttons, given back after switching to the default ones and back. */
  own: Partial<OwnSections> = {};
  /** The open section tab. */
  tab: EditedSection | 'text' | OptInSection = 'background';
  saving = false;

  oninit(vnode: Mithril.Vnode<any, this>) {
    super.oninit(vnode);

    this.configs = normalizeConfigs(app.forum.attribute<ForumPayload>('walsgitCustomHeroes')?.configs);
    this.load('global');

    // The admin only preloads some tags.
    if (this.tagsEnabled()) {
      app.store.find('tags').then(() => m.redraw());
    }

    // Every page of fof/pages, which can each have their own hero.
    if (isExtensionEnabled('fof-pages')) loadAll('pages').then(() => m.redraw());
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

            {this.key === 'other' && this.enabledSwitch()}

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
    // A tag only has its own background (D4), a page has everything.
    const isTagInstance = !!targetOf(this.key).scopeId && targetOf(this.key).scope === 'tag';
    const sections: Partial<Record<EditedSection | 'text' | OptInSection, () => Mithril.Children>> = {
      background: () =>
        [
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
        ].concat(this.key === 'discussion' && this.tagsEnabled() ? [this.tagHeroSwitch(), this.tagSwitch('tagColor', 'background')] : []),
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
    if (!isTagInstance) {
      sections.textStyle = () => [
        this.section(
          'textStyle',
          // Top, like the core, so that unticking changes nothing at first.
          (parent) => parent ?? { align: 'center', vAlign: 'top', titleSize: 'm', subtitleSize: 'm', color: null },
          (value, set) => <TextStyleForm value={value} onchange={set} noSubtitle={NO_SUBTITLE.includes(targetOf(this.key).scope)} />,
          undefined,
          // Flarum's look: the form's own defaults.
          (value) =>
            value.align === 'center' && value.vAlign === 'top' && value.titleSize === 'm' && value.subtitleSize === 'm' && value.color === null
        ),
        this.key === 'tag' && [this.tagSwitch('tagIcon'), this.tagSwitch('tagDescription')],
        this.key === 'discussion' && this.tagsEnabled() && this.discussionTagsField(),
      ];
      sections.logo = () =>
        this.section(
          'logo',
          // The logo of the level above belongs to it: never copied.
          (parent) => ({ side: 'left', size: 'm', alt: '', hideOnMobile: false, ...parent, image: null }),
          (value, set) => <LogoForm value={value} onchange={set} target={this.key} />,
          t('logo.add_label')
        );
      sections.socials = () => this.optInSection('socials');
      sections.buttons = () => this.optInSection('buttons');
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
    // Discussions have no description, and their title (or another extension's) is never replaced by the logo.
    const suffix =
      (this.key === 'discussion' && name === 'logo') ||
      (this.key === 'other' && name === 'logo') ||
      (NO_SUBTITLE.includes(targetOf(this.key).scope) && name === 'textStyle')
        ? '_discussion'
        : '';
    const text = app.translator.trans(`walsgit-custom-heroes.admin.${localeKey(name)}.intro${suffix}`, { a: <Link href={app.route('basics')} /> });

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
   * Social icons and buttons are opt-in on the other heroes (the default ones
   * are for the home hero): shown or not, then the default ones or their own.
   */
  optInSection(name: OptInSection) {
    const value = this.draft[name] as OwnSections[OptInSection] | 'inherit' | false | undefined;
    const isDefault = this.key === 'global';
    // A page inherits from the level of all pages, and can hide what it shows (`false`).
    const isInstance = !!targetOf(this.key).scopeId;
    const shown = value !== undefined && value !== false;
    const back = this.stash[name];
    const set = (section?: OwnSections[OptInSection] | 'inherit' | false) => {
      const { [name]: previous, ...rest } = this.draft;
      // Kept aside, like the other sections: switching back on gives them back.
      if (previous !== undefined && section === undefined) this.stash = { ...this.stash, [name]: previous };
      if (typeof previous === 'object' && section !== previous) this.own = { ...this.own, [name]: previous };
      this.draft = section === undefined ? rest : { ...rest, [name]: section };
    };
    // Own ones start from a copy of the default ones.
    const own = (): OwnSections[OptInSection] => {
      const defaults = this.configs.global?.[name];
      const copy = structuredClone(!isDefault && defaults && defaults !== 'inherit' ? defaults : EMPTY[name]);

      // Nothing below the text of fof/polls heroes.
      return this.noBelowText() && copy.placement === 'below-text'
        ? { ...copy, placement: this.takenCorner(name === 'socials' ? 'buttons' : 'socials') === 'top-right' ? 'top-left' : 'top-right' }
        : copy;
    };
    const form =
      name === 'socials' ? (
        <SocialsForm value={value as SocialsSection} onchange={set} taken={this.takenCorner('buttons')} noBelowText={this.noBelowText()} />
      ) : (
        <ButtonsForm value={value as ButtonsSection} onchange={set} taken={this.takenCorner('socials')} noBelowText={this.noBelowText()} />
      );

    return (
      <fieldset className={`wch-Section wch-Section--${name}`}>
        {this.intro(name)}
        {isInstance && (
          <Switch state={value === undefined} onchange={(inherit: boolean) => set(inherit ? undefined : back ?? false)}>
            {t('inherit_from_label', { source: this.scopeLabel(parentChain(this.key).slice(-1)[0]) })}
          </Switch>
        )}
        {(!isInstance || value !== undefined) && (
          <Switch
            state={shown}
            onchange={(on: boolean) =>
              set(on ? (back !== undefined && back !== false ? back : isDefault ? own() : 'inherit') : isInstance ? false : undefined)
            }
          >
            {t(`${name}.add_label`)}
          </Switch>
        )}
        {!isDefault && !isInstance && value === undefined && <p className="helpText">{t(`${name}.opt_in_help`)}</p>}
        {this.noBelowText() && shown && <p className="helpText">{t('placement.polls_note', { items: t(`placement.polls_items_${name}`) })}</p>}

        {!isDefault && shown && (
          <Switch state={value === 'inherit'} onchange={(inherit: boolean) => set(inherit ? 'inherit' : this.own[name] ?? own())}>
            {t('inherit_from_label', { source: this.scopeLabel('global') })}
          </Switch>
        )}

        {shown && value !== 'inherit' && form}
      </fieldset>
    );
  }

  /** fof/polls puts its own buttons below the text of its heroes. */
  noBelowText(): boolean {
    return targetOf(this.key).scope === 'polls';
  }

  /** Every tag at once, apart from the text style (which it can inherit): stored only to hide the part. */
  tagSwitch(name: 'tagIcon' | 'tagDescription' | 'tagColor', group = 'text_style') {
    const set = (show: boolean) => {
      const { [name]: _, ...rest } = this.draft;
      this.draft = show ? rest : { ...rest, [name]: false };
    };

    return (
      <fieldset className={`wch-Section wch-Section--${name}`}>
        <Switch state={this.draft[name] !== false} onchange={set}>
          {t(`${group}.${localeKey(name)}_label`)}
        </Switch>
        <p className="helpText">{t(`${group}.${localeKey(name)}_help`)}</p>
      </fieldset>
    );
  }

  /** Discussions use the background, overlay and height of their tag's hero: off by default, stored only on. */
  tagHeroSwitch() {
    const set = (on: boolean) => {
      const { tagHero: _, ...rest } = this.draft;
      this.draft = on ? { ...rest, tagHero: true } : rest;
    };

    return (
      <fieldset className="wch-Section wch-Section--tagHero">
        <Switch state={this.draft.tagHero === true} onchange={set}>
          {t('background.tag_hero_label')}
        </Switch>
        <p className="helpText">{t('background.tag_hero_help')}</p>
      </fieldset>
    );
  }

  /** The heroes of the other extensions are only customized once enabled: off by default, stored only on. */
  enabledSwitch() {
    const set = (on: boolean) => {
      const { enabled: _, ...rest } = this.draft;
      this.draft = on ? { ...rest, enabled: true } : rest;
    };

    return (
      <fieldset className="wch-Section wch-Section--enabled">
        <Switch state={this.draft.enabled === true} onchange={set}>
          {t('other.enabled_label')}
        </Switch>
        <p className="helpText">{t('other.enabled_help')}</p>
      </fieldset>
    );
  }

  /** Where a discussion shows its tags, apart from the text style (which it can inherit). Above the title: not stored. */
  discussionTagsField() {
    const value = this.draft.discussionTags ?? 'above';
    const set = (choice: 'above' | 'below' | 'hidden') => {
      const { discussionTags: _, ...rest } = this.draft;
      this.draft = choice === 'above' ? rest : { ...rest, discussionTags: choice };
    };
    const icons = { above: 'fas fa-arrow-up', below: 'fas fa-arrow-down', hidden: 'fas fa-eye-slash' };

    return (
      <fieldset className="wch-Section wch-Section--discussionTags">
        <div className="Form-group">
          <label>{t('text_style.discussion_tags_label')}</label>
          <div className="ButtonGroup wch-ChoiceButtons">
            {(['above', 'below', 'hidden'] as const).map((choice) => (
              <Button
                className={classList('Button', value === choice && 'active')}
                icon={icons[choice]}
                aria-pressed={value === choice}
                onclick={() => set(choice)}
              >
                {t(`text_style.discussion_tags_${choice}`)}
              </Button>
            ))}
          </div>
          <p className="helpText">{t('text_style.discussion_tags_help')}</p>
        </div>
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

    if (scopeId && scope === 'pages') {
      const page = app.store.getById('pages', scopeId);

      return t('scopes.page_instance', { name: page ? pageTitle(page) : `#${scopeId}` });
    }

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
    if (isExtensionEnabled('fof-pages')) {
      const pages = app.store.all('pages').sort((a, b) => pageTitle(a).localeCompare(pageTitle(b)));
      keys.push('pages', ...pages.map((page) => `pages:${page.id()}`));
    }
    if (isExtensionEnabled('fof-user-directory')) keys.push('users');
    if (isExtensionEnabled('fof-polls')) keys.push('polls');
    // The heroes no other target is for. Tags always come last.
    keys.push('other');

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
    this.own = {};
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
