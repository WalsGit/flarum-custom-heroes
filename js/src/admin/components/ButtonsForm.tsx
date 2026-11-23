import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import type { ButtonItem, ButtonsSection, Placement } from '../../common/types';
import AlphaColorInput from './AlphaColorInput';
import PlacementFields, { type PlacementChanges } from './PlacementFields';

export interface ButtonsFormAttrs extends ComponentAttrs {
  value: ButtonsSection;
  onchange: (value: ButtonsSection) => void;
  /** A corner used by the social icons. */
  taken: Placement | null;
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

/** Changes the action: only links have a URL, a target and a visibility (the server rejects them otherwise). */
function withAction(button: ButtonItem, action: ButtonItem['action']): ButtonItem {
  const { label, icon, style, size, bg, color } = button;

  return action === 'link'
    ? { label, icon, style, size, bg, color, action, url: '', newTab: false, visibility: 'all' }
    : { label, icon, style, size, bg, color, action };
}

export default class ButtonsForm extends Component<ButtonsFormAttrs> {
  view() {
    const { value } = this.attrs;

    return (
      <div className="wch-ButtonsForm">
        <div className="Form-group">
          <label>{t('items_label')}</label>
          {value.items.map((button, index) => this.item(button, index))}
          {value.items.length < MAX_ITEMS && (
            <Button className="Button" icon="fas fa-plus" onclick={() => this.setItems([...value.items, { ...NEW_BUTTON }])}>
              {t('add_button')}
            </Button>
          )}
          <p className="helpText">{t('items_help')}</p>
        </div>

        <PlacementFields
          placement={value.placement}
          mobile={value.mobile}
          taken={this.attrs.taken}
          onchange={(changes: PlacementChanges) => this.update(changes)}
        />
      </div>
    );
  }

  item(button: ButtonItem, index: number) {
    const { items } = this.attrs.value;
    const number = index + 1;
    const set = (next: ButtonItem) => this.setItems(items.map((other, i) => (i === index ? next : other)));
    const change = (changes: Partial<ButtonItem>) => set({ ...button, ...changes } as ButtonItem);
    const move = (to: number) => {
      const moved = [...items];
      [moved[index], moved[to]] = [moved[to], moved[index]];
      this.setItems(moved);
    };
    const id = (field: string) => `wch-button-${index}-${field}`;

    return (
      <div className="wch-ButtonsForm-item" role="group" aria-label={t('item_title', { number })} key={index}>
        <div className="wch-ButtonsForm-itemHeader">
          <strong>{t('item_title', { number })}</strong>
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-arrow-up"
            aria-label={t('move_up_button')}
            disabled={index === 0}
            onclick={() => move(index - 1)}
          />
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-arrow-down"
            aria-label={t('move_down_button')}
            disabled={index === items.length - 1}
            onclick={() => move(index + 1)}
          />
          <Button
            className="Button Button--icon Button--link"
            icon="fas fa-times"
            aria-label={t('remove_button')}
            onclick={() => this.setItems(items.filter((_, i) => i !== index))}
          />
        </div>

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
              <span className="wch-SocialsForm-icon">{button.icon && <Icon name={button.icon} noStyleOverride={true} />}</span>
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
        </div>

        {button.action === 'link' && (
          <Switch state={button.newTab} onchange={(newTab: boolean) => change({ newTab })}>
            {t('new_tab_label')}
          </Switch>
        )}
        <Switch state={button.bg !== null} onchange={(custom: boolean) => change({ bg: custom ? '#4d698eff' : null })}>
          {t('custom_bg_label')}
        </Switch>
        {button.bg !== null && <AlphaColorInput value={button.bg} label={t('bg_label', { number })} onchange={(bg: string) => change({ bg })} />}
        <Switch state={button.color !== null} onchange={(custom: boolean) => change({ color: custom ? '#ffffffff' : null })}>
          {t('custom_color_label')}
        </Switch>
        {button.color !== null && (
          <AlphaColorInput value={button.color} label={t('color_label', { number })} onchange={(color: string) => change({ color })} />
        )}
      </div>
    );
  }

  setItems(items: ButtonItem[]) {
    this.update({ items });
  }

  update(changes: Partial<ButtonsSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
