import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import type Mithril from 'mithril';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import classList from 'flarum/common/utils/classList';
import { heroButtons } from '../../common/heroDecoration';
import type { ButtonItem, ButtonsSection, Placement } from '../../common/types';
import { makeSortable, moved } from '../utils/sortable';
import AlphaColorInput from './AlphaColorInput';
import IconPicker from './IconPicker';
import PlacementFields, { type PlacementChanges } from './PlacementFields';

export interface ButtonsFormAttrs extends ComponentAttrs {
  value: ButtonsSection;
  onchange: (value: ButtonsSection) => void;
  /** A corner used by the social icons. */
  taken: Placement | null;
  /** No placement below the text (fof/polls). */
  noBelowText?: boolean;
}

/** Limits validated by the server. */
const MAX_ITEMS = 4;
const MAX_LABEL = 40;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.buttons.${key}`, params, true);

/** Options of a select, from their values: `{ s: t('size_s'), … }`. */
const options = (values: readonly string[], prefix: string) => Object.fromEntries(values.map((value) => [value, t(`${prefix}_${value}`)]));

const NEW_BUTTON: ButtonItem = {
  label: '',
  icon: null,
  action: 'link',
  url: '',
  newTab: false,
  visibility: 'all',
  style: 'primary',
  size: 'm',
  bg: null,
  color: null,
};

/** The icon picker's choices, by locale key (names shown on hover). */
const ICONS: Record<string, string> = {
  login: 'fas fa-right-to-bracket',
  signup: 'fas fa-user-plus',
  arrow: 'fas fa-arrow-right',
  external: 'fas fa-arrow-up-right-from-square',
  link: 'fas fa-link',
  email: 'fas fa-envelope',
  download: 'fas fa-download',
  help: 'fas fa-circle-question',
  info: 'fas fa-circle-info',
  star: 'fas fa-star',
  heart: 'fas fa-heart',
  cart: 'fas fa-cart-shopping',
  calendar: 'fas fa-calendar',
  book: 'fas fa-book',
  chat: 'fas fa-comments',
  announce: 'fas fa-bullhorn',
  gift: 'fas fa-gift',
  rocket: 'fas fa-rocket',
  play: 'fas fa-play',
  discord: 'fab fa-discord',
};

/** Changes the action: only links have a URL, a target and a visibility (the server rejects them otherwise). */
function withAction(button: ButtonItem, action: ButtonItem['action']): ButtonItem {
  const { label, icon, style, size, bg, color } = button;

  return action === 'link'
    ? { label, icon, style, size, bg, color, action, url: '', newTab: false, visibility: 'all' }
    : { label, icon, style, size, bg, color, action };
}

export default class ButtonsForm extends Component<ButtonsFormAttrs> {
  /** The card being edited: one at a time, the others folded to their header. */
  open: number | null = 0;

  view() {
    const { value } = this.attrs;

    return (
      <div className="wch-ButtonsForm">
        <div className="Form-group">
          <label>{t('items_label')}</label>
          <div className="wch-ButtonsForm-list">{this.list().map((button, index) => this.item(button, index))}</div>
          {/* With no button yet, the empty card is there to fill. */}
          {value.items.length > 0 && value.items.length < MAX_ITEMS && (
            <Button
              className="Button"
              icon="fas fa-plus"
              onclick={() => {
                this.open = value.items.length;
                this.setItems([...value.items, { ...NEW_BUTTON }]);
              }}
            >
              {t('add_button')}
            </Button>
          )}
          <p className="helpText">{t('items_help')}</p>
        </div>

        <div className="wch-FieldsRow">
          <PlacementFields
            placement={value.placement}
            mobile={value.mobile}
            taken={this.attrs.taken}
            noBelowText={this.attrs.noBelowText}
            onchange={(changes: PlacementChanges) => this.update(changes)}
          />
        </div>
      </div>
    );
  }

  oncreate(vnode: Mithril.VnodeDOM<ButtonsFormAttrs, this>) {
    super.oncreate(vnode);

    // ↑ / ↓ stay for the keyboard.
    makeSortable(this.element.querySelector('.wch-ButtonsForm-list')!, '.wch-ButtonsForm-handle', (from, to) => this.move(from, to));
  }

  item(button: ButtonItem, index: number) {
    const items = this.list();
    const number = index + 1;
    // The empty card shown for an empty list is always open: it is there to be filled.
    const isOpen = this.open === index || !this.attrs.value.items.length;
    const set = (next: ButtonItem) => this.setItems(items.map((other, i) => (i === index ? next : other)));
    const change = (changes: Partial<ButtonItem>) => set({ ...button, ...changes } as ButtonItem);
    const id = (field: string) => `wch-button-${index}-${field}`;

    return (
      <div
        className={classList('wch-ButtonsForm-item', isOpen && 'wch-ButtonsForm-item--open')}
        role="group"
        aria-label={t('item_title', { number })}
        key={index}
      >
        <div className="wch-ButtonsForm-itemHeader">
          <span className="wch-ButtonsForm-handle" title={t('drag_handle')} aria-hidden="true">
            <Icon name="fas fa-grip-vertical" />
          </span>
          <button type="button" className="wch-ButtonsForm-toggle" aria-expanded={isOpen} onclick={() => (this.open = isOpen ? null : index)}>
            <Icon name={isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'} />
            <strong>{t('item_title', { number })}</strong>
          </button>
          {/* What the button looks like, so that a folded card is easy to find. */}
          <span className="wch-ButtonsForm-sample" aria-hidden="true">
            {button.label ? heroButtons([button], null) : <span className="helpText">{t('no_label')}</span>}
          </span>
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-arrow-up"
            aria-label={t('move_up_button')}
            disabled={index === 0}
            onclick={() => this.move(index, index - 1)}
          />
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-arrow-down"
            aria-label={t('move_down_button')}
            disabled={index === items.length - 1}
            onclick={() => this.move(index, index + 1)}
          />
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-times"
            aria-label={t('remove_button')}
            onclick={() => {
              this.open = this.open === index ? null : this.open !== null && this.open > index ? this.open - 1 : this.open;
              this.setItems(items.filter((_, i) => i !== index));
            }}
          />
        </div>

        {isOpen && [
          <div className="wch-ButtonsForm-grid">
            <div className="Form-group">
              <label for={id('label')}>{t('label_label')}</label>
              <input
                id={id('label')}
                className="FormControl"
                maxlength={MAX_LABEL}
                value={button.label}
                oninput={(e: InputEvent) => change({ label: (e.target as HTMLInputElement).value })}
              />
            </div>

            <div className="Form-group">
              <label>{t('action_label')}</label>
              <Select
                value={button.action}
                options={options(['link', 'login', 'signup'], 'action')}
                onchange={(action: ButtonItem['action']) => set(withAction(button, action))}
              />
            </div>

            {button.action === 'link' && [
              <div className="Form-group">
                <label for={id('url')}>{t('url_label')}</label>
                <input
                  id={id('url')}
                  className="FormControl"
                  maxlength={255}
                  placeholder="https://…"
                  value={button.url}
                  oninput={(e: InputEvent) => change({ url: (e.target as HTMLInputElement).value.trim() })}
                />
              </div>,
              <div className="Form-group">
                <label>{t('visibility_label')}</label>
                <Select
                  value={button.visibility}
                  options={options(['all', 'guest', 'user'], 'visibility')}
                  onchange={(visibility: 'all' | 'guest' | 'user') => change({ visibility })}
                />
              </div>,
            ]}

            <div className="Form-group">
              <label for={id('icon')}>{t('icon_label')}</label>
              <div className="wch-ButtonsForm-icon">
                <IconPicker
                  value={button.icon}
                  icons={Object.fromEntries(Object.entries(ICONS).map(([key, icon]) => [icon, t(`icons.${key}`)]))}
                  noneLabel={t('icon_none')}
                  label={t('pick_icon_button', { number })}
                  onchange={(icon: string | null) => change({ icon })}
                />
                <input
                  id={id('icon')}
                  className="FormControl"
                  maxlength={60}
                  placeholder={t('icon_placeholder')}
                  value={button.icon ?? ''}
                  oninput={(e: InputEvent) => change({ icon: (e.target as HTMLInputElement).value || null })}
                  // Trimmed once done, so that spaces can be typed.
                  onchange={(e: Event) => change({ icon: (e.target as HTMLInputElement).value.trim() || null })}
                />
              </div>
            </div>

            <div className="Form-group">
              <label>{t('style_label')}</label>
              <Select
                value={button.style}
                options={options(['primary', 'default', 'outline'], 'style')}
                onchange={(style: ButtonItem['style']) => change({ style })}
              />
            </div>

            <div className="Form-group">
              <label>{t('size_label')}</label>
              <Select value={button.size} options={options(['s', 'm', 'l'], 'size')} onchange={(size: ButtonItem['size']) => change({ size })} />
            </div>
          </div>,

          button.action === 'link' && (
            <Switch state={button.newTab} onchange={(newTab: boolean) => change({ newTab })}>
              {t('new_tab_label')}
            </Switch>
          ),
          <Switch state={button.bg !== null} onchange={(custom: boolean) => change({ bg: custom ? '#4d698eff' : null })}>
            {t('custom_bg_label')}
          </Switch>,
          button.bg !== null && (
            <AlphaColorInput value={button.bg} label={t('bg_label', { number })} legends onchange={(bg: string) => change({ bg })} />
          ),
          <Switch state={button.color !== null} onchange={(custom: boolean) => change({ color: custom ? '#ffffffff' : null })}>
            {t('custom_color_label')}
          </Switch>,
          button.color !== null && (
            <AlphaColorInput value={button.color} label={t('color_label', { number })} legends onchange={(color: string) => change({ color })} />
          ),
        ]}
      </div>
    );
  }

  /** The buttons, or one empty card to fill when there is none yet (stored only once filled in). */
  list(): ButtonItem[] {
    const { items } = this.attrs.value;

    return items.length ? items : [{ ...NEW_BUTTON }];
  }

  /** Moves a button; the open card stays open wherever it goes. */
  move(from: number, to: number) {
    if (this.open !== null) {
      this.open = moved([...this.list().keys()], from, to).indexOf(this.open);
    }

    this.setItems(moved(this.list(), from, to));
  }

  setItems(items: ButtonItem[]) {
    // The empty card shown for an empty list is stored only once changed (an empty button would not be valid).
    const changed = this.attrs.value.items.length ? items : items.filter((item) => JSON.stringify(item) !== JSON.stringify(NEW_BUTTON));
    this.update({ items: changed });
  }

  update(changes: Partial<ButtonsSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
