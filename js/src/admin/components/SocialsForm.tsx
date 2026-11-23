import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import { SOCIAL_SIZES } from '../../common/heroStyle';
import type { Placement, SocialItem, SocialsSection } from '../../common/types';
import AlphaColorInput from './AlphaColorInput';
import PlacementFields, { type PlacementChanges } from './PlacementFields';

export interface SocialsFormAttrs extends ComponentAttrs {
  value: SocialsSection;
  onchange: (value: SocialsSection) => void;
  /** A corner used by the buttons. */
  taken: Placement | null;
}

/** Limits validated by the server. */
const MAX_ITEMS = 10;
const MAX_LABEL = 50;

/** Common icons of Font Awesome Free 7, with the label they suggest. */
const SUGGESTIONS: Record<string, string> = {
  'fab fa-discord': 'Discord',
  'fab fa-x-twitter': 'X',
  'fab fa-bluesky': 'Bluesky',
  'fab fa-mastodon': 'Mastodon',
  'fab fa-threads': 'Threads',
  'fab fa-facebook': 'Facebook',
  'fab fa-instagram': 'Instagram',
  'fab fa-youtube': 'YouTube',
  'fab fa-twitch': 'Twitch',
  'fab fa-tiktok': 'TikTok',
  'fab fa-linkedin': 'LinkedIn',
  'fab fa-reddit': 'Reddit',
  'fab fa-telegram': 'Telegram',
  'fab fa-whatsapp': 'WhatsApp',
  'fab fa-github': 'GitHub',
  'fab fa-gitlab': 'GitLab',
  'fab fa-patreon': 'Patreon',
  'fas fa-envelope': 'Email',
  'fas fa-phone': 'Phone',
  'fas fa-rss': 'RSS',
  'fas fa-globe': 'Website',
};

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.socials.${key}`, params, true);

export default class SocialsForm extends Component<SocialsFormAttrs> {
  view() {
    const { value } = this.attrs;

    return (
      <div className="wch-SocialsForm">
        <datalist id="wch-socials-icons">
          {Object.entries(SUGGESTIONS).map(([icon, label]) => (
            <option value={icon}>{label}</option>
          ))}
        </datalist>

        <div className="Form-group">
          <label>{t('items_label')}</label>
          {value.items.map((item, index) => this.item(item, index))}
          {value.items.length < MAX_ITEMS && (
            <Button className="Button" icon="fas fa-plus" onclick={() => this.setItems([...value.items, { icon: '', url: '', label: '' }])}>
              {t('add_button')}
            </Button>
          )}
          <p className="helpText">
            {/* Not extracted to text: it contains a link. */}
            {app.translator.trans('walsgit-custom-heroes.admin.socials.items_help', {
              a: <a href="https://fontawesome.com/search?ic=free-collection" target="_blank" rel="noopener noreferrer" />,
            })}
          </p>
        </div>

        <PlacementFields
          placement={value.placement}
          mobile={value.mobile}
          taken={this.attrs.taken}
          onchange={(changes: PlacementChanges) => this.update(changes)}
        />

        <div className="Form-group">
          <label>{t('size_label')}</label>
          <Select
            value={value.size}
            options={Object.fromEntries((['xs', 's', 'm'] as const).map((size) => [size, t(`size_${size}`, { size: SOCIAL_SIZES[size] })]))}
            onchange={(size: SocialsSection['size']) => this.update({ size })}
          />
        </div>

        <Switch state={value.color !== null} onchange={(custom: boolean) => this.update({ color: custom ? '#ffffffff' : null })}>
          {t('custom_color_label')}
        </Switch>
        {value.color !== null && (
          <div className="Form-group">
            <AlphaColorInput value={value.color} label={t('color_label')} onchange={(color: string) => this.update({ color })} />
          </div>
        )}
      </div>
    );
  }

  item(item: SocialItem, index: number) {
    const { items } = this.attrs.value;
    const number = index + 1;
    const set = (changes: Partial<SocialItem>) => this.setItems(items.map((other, i) => (i === index ? { ...other, ...changes } : other)));
    const move = (to: number) => {
      const moved = [...items];
      [moved[index], moved[to]] = [moved[to], moved[index]];
      this.setItems(moved);
    };

    return (
      <div className="wch-SocialsForm-item" key={index}>
        <span className="wch-SocialsForm-icon">{item.icon && <Icon name={item.icon} noStyleOverride={true} />}</span>
        <input
          className="FormControl wch-SocialsForm-iconInput"
          list="wch-socials-icons"
          maxlength={60}
          placeholder="fab fa-github"
          aria-label={t('icon_label', { number })}
          value={item.icon}
          oninput={(e: InputEvent) => {
            // Trimmed once done (onchange), so that spaces can be typed.
            const icon = (e.target as HTMLInputElement).value;
            // A suggested icon names its network, unless a label is already set.
            set({ icon, ...(!item.label && SUGGESTIONS[icon] ? { label: SUGGESTIONS[icon] } : {}) });
          }}
          onchange={(e: Event) => set({ icon: (e.target as HTMLInputElement).value.trim() })}
        />
        <input
          className="FormControl wch-SocialsForm-label"
          maxlength={MAX_LABEL}
          placeholder={t('label_placeholder')}
          aria-label={t('label_label', { number })}
          value={item.label}
          oninput={(e: InputEvent) => set({ label: (e.target as HTMLInputElement).value })}
        />
        <input
          className="FormControl wch-SocialsForm-url"
          maxlength={255}
          placeholder="https://…, mailto:…, tel:…"
          aria-label={t('url_label', { number })}
          value={item.url}
          oninput={(e: InputEvent) => set({ url: (e.target as HTMLInputElement).value.trim() })}
        />
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
    );
  }

  setItems(items: SocialItem[]) {
    this.update({ items });
  }

  update(changes: Partial<SocialsSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
