import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import isExtensionEnabled from 'flarum/admin/utils/isExtensionEnabled';
import Alert from 'flarum/common/components/Alert';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import type Mithril from 'mithril';
import { normalizeConfigs, resolveConfig, sectionOwner } from '../../common/resolveConfig';
import type { ForumPayload, HeroConfig, HeroConfigs } from '../../common/types';
import { parentChain, targetOf } from '../utils/scopes';
import { uploadLimits } from '../utils/uploadLimits';
import BackgroundForm from './BackgroundForm';
import HeightForm from './HeightForm';
import OverlayForm from './OverlayForm';

/** The sections this page edits. Other sections of a config are kept as they are. */
type EditedSection = 'background' | 'overlay' | 'height';

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.${key}`, params, true);

/**
 * Edits the hero config of one target at a time (global, a hero type or a
 * tag). Each section is either inherited from the level above or defined
 * here.
 */
export default class HeroesPage extends ExtensionPage {
  /** The config being edited: `global`, `welcome`, `tag:12`… */
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
   */
  section<K extends EditedSection>(
    name: K,
    initial: (parent: HeroConfig[K] | undefined) => NonNullable<HeroConfig[K]>,
    form: (value: NonNullable<HeroConfig[K]>, set: (value: NonNullable<HeroConfig[K]>) => void) => Mithril.Children
  ) {
    const value = this.draft[name];
    const chain = parentChain(this.key);
    const owner = sectionOwner(this.configs, chain, name);
    const set = (section: NonNullable<HeroConfig[K]>) => (this.draft = { ...this.draft, [name]: section });

    const toggle = (inherit: boolean) => {
      const { [name]: _, ...rest } = this.draft;
      // Starts from what the hero shows now, so that unticking changes nothing at first.
      this.draft = inherit ? rest : { ...rest, [name]: initial(structuredClone(resolveConfig(this.configs, chain)[name])) };
    };

    return (
      <fieldset className={`wch-Section wch-Section--${name}`}>
        <legend>{t(`${name}.title`)}</legend>

        <Switch state={value === undefined} onchange={toggle}>
          {owner ? t('inherit_from_label', { source: this.scopeLabel(owner) }) : t('inherit_core_label')}
        </Switch>

        {value !== undefined && form(value as NonNullable<HeroConfig[K]>, set)}
      </fieldset>
    );
  }

  tagsEnabled(): boolean {
    return isExtensionEnabled('flarum-tags');
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
    const keys = ['global', 'welcome', 'discussion'];

    if (this.tagsEnabled()) {
      const tags = app.store.all('tags').sort((a, b) => (a.attribute('name') as string).localeCompare(b.attribute('name') as string));

      keys.push('tag', ...tags.map((tag) => `tag:${tag.id()}`));
    }

    return Object.fromEntries(
      keys.map((key) => {
        // Indented under the level it inherits from (spaces would collapse in an option).
        const depth = parentChain(key).length;
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
    if (draft.overlay?.type === 'gradient') {
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
