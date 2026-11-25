import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import type Mithril from 'mithril';
import { SOCIAL_SIZES } from '../../common/heroStyle';
import type { Placement, SocialItem, SocialsSection } from '../../common/types';
import { makeSortable, moved } from '../utils/sortable';
import AlphaColorInput from './AlphaColorInput';
import IconPicker from './IconPicker';
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

/**
 * The icon picker: common networks, then useful links (Font Awesome Free 7),
 * with the label and the start of the link they suggest.
 */
const SUGGESTIONS: Record<string, { label: string; url: string }> = {
  'fab fa-discord': { label: 'Discord', url: 'https://discord.gg/' },
  'fab fa-x-twitter': { label: 'X', url: 'https://x.com/' },
  'fab fa-bluesky': { label: 'Bluesky', url: 'https://bsky.app/profile/' },
  'fab fa-mastodon': { label: 'Mastodon', url: 'https://mastodon.social/@' },
  'fab fa-threads': { label: 'Threads', url: 'https://www.threads.net/@' },
  'fab fa-facebook': { label: 'Facebook', url: 'https://www.facebook.com/' },
  'fab fa-instagram': { label: 'Instagram', url: 'https://www.instagram.com/' },
  'fab fa-youtube': { label: 'YouTube', url: 'https://www.youtube.com/@' },
  'fab fa-twitch': { label: 'Twitch', url: 'https://www.twitch.tv/' },
  'fab fa-tiktok': { label: 'TikTok', url: 'https://www.tiktok.com/@' },
  'fab fa-linkedin': { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
  'fab fa-reddit': { label: 'Reddit', url: 'https://www.reddit.com/r/' },
  'fab fa-telegram': { label: 'Telegram', url: 'https://t.me/' },
  'fab fa-whatsapp': { label: 'WhatsApp', url: 'https://wa.me/' },
  'fab fa-github': { label: 'GitHub', url: 'https://github.com/' },
  'fab fa-gitlab': { label: 'GitLab', url: 'https://gitlab.com/' },
  'fab fa-patreon': { label: 'Patreon', url: 'https://www.patreon.com/' },
  'fab fa-pinterest': { label: 'Pinterest', url: 'https://www.pinterest.com/' },
  'fab fa-snapchat': { label: 'Snapchat', url: 'https://www.snapchat.com/add/' },
  'fab fa-spotify': { label: 'Spotify', url: 'https://open.spotify.com/' },
  'fab fa-steam': { label: 'Steam', url: 'https://steamcommunity.com/' },
  'fab fa-slack': { label: 'Slack', url: 'https://' },
  'fas fa-globe': { label: 'Website', url: 'https://' },
  'fas fa-link': { label: 'Link', url: 'https://' },
  'fas fa-envelope': { label: 'Email', url: 'mailto:' },
  'fas fa-phone': { label: 'Phone', url: 'tel:' },
  'fas fa-location-dot': { label: 'Location', url: 'https://' },
  'fas fa-comments': { label: 'Chat', url: 'https://' },
  'fas fa-rss': { label: 'RSS', url: 'https://' },
};

/**
 * A new icon, with the label and link it suggests: they replace a field only
 * when it is empty or still holds what the previous icon filled in.
 */
export function withIcon(item: SocialItem, icon: string): SocialItem {
  const before = SUGGESTIONS[item.icon];
  const after = SUGGESTIONS[icon];
  const untouched = (value: string, filled?: string) => !value || value === filled;

  return {
    ...item,
    icon,
    ...(after && untouched(item.label, before?.label) ? { label: after.label } : {}),
    ...(after && untouched(item.url, before?.url) ? { url: after.url } : {}),
  };
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.socials.${key}`, params, true);

export default class SocialsForm extends Component<SocialsFormAttrs> {
  view() {
    const { value } = this.attrs;

    return (
      <div className="wch-SocialsForm">
        <div className="Form-group">
          <label>{t('items_label')}</label>
          {/* What each column is, once the placeholders are gone. */}
          <div className="wch-SocialsForm-item wch-SocialsForm-head" aria-hidden="true">
            <span className="wch-SocialsForm-handle" />
            <span className="wch-SocialsForm-icon" />
            <span className="wch-SocialsForm-iconInput">{t('column_icon')}</span>
            <span className="wch-SocialsForm-label">{t('column_label')}</span>
            <span className="wch-SocialsForm-url">{t('column_url')}</span>
          </div>
          <div className="wch-SocialsForm-list">{this.list().map((item, index) => this.item(item, index))}</div>
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

        <div className="wch-FieldsRow">
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
        </div>

        <Switch state={value.color !== null} onchange={(custom: boolean) => this.update({ color: custom ? '#ffffffff' : null })}>
          {t('custom_color_label')}
        </Switch>
        {value.color !== null && (
          <div className="Form-group">
            <AlphaColorInput value={value.color} label={t('color_label')} legends onchange={(color: string) => this.update({ color })} />
          </div>
        )}
      </div>
    );
  }

  item(item: SocialItem, index: number) {
    const items = this.list();
    const number = index + 1;
    const set = (changes: Partial<SocialItem>) => this.setItems(items.map((other, i) => (i === index ? { ...other, ...changes } : other)));
    const move = (to: number) => {
      const moved = [...items];
      [moved[index], moved[to]] = [moved[to], moved[index]];
      this.setItems(moved);
    };

    return (
      <div className="wch-SocialsForm-item" key={index}>
        <span className="wch-SocialsForm-handle" title={t('drag_handle')} aria-hidden="true">
          <Icon name="fas fa-grip-vertical" />
        </span>
        <IconPicker
          className="wch-SocialsForm-icon"
          value={item.icon || null}
          icons={Object.fromEntries(Object.entries(SUGGESTIONS).map(([icon, { label }]) => [icon, label]))}
          label={t('pick_icon_button', { number })}
          onchange={(icon: string | null) => set(withIcon(item, icon ?? ''))}
        />
        <input
          className="FormControl wch-SocialsForm-iconInput"
          maxlength={60}
          placeholder="fab fa-github"
          aria-label={t('icon_label', { number })}
          value={item.icon}
          oninput={(e: InputEvent) => {
            // Trimmed once done (onchange), so that spaces can be typed.
            set(withIcon(item, (e.target as HTMLInputElement).value));
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

  /** The icons, or one empty row to fill when there is none yet (stored only once typed in). */
  list(): SocialItem[] {
    const { items } = this.attrs.value;

    return items.length ? items : [{ icon: '', url: '', label: '' }];
  }

  setItems(items: SocialItem[]) {
    // The empty row shown for an empty list is stored only once typed in (an empty icon would not be valid).
    const typed = this.attrs.value.items.length ? items : items.filter((item) => item.icon || item.url || item.label);
    this.update({ items: typed });
  }

  oncreate(vnode: Mithril.VnodeDOM<SocialsFormAttrs, this>) {
    super.oncreate(vnode);

    // ↑ / ↓ stay for the keyboard.
    makeSortable(this.element.querySelector('.wch-SocialsForm-list')!, '.wch-SocialsForm-handle', (from, to) =>
      this.setItems(moved(this.attrs.value.items, from, to))
    );
  }

  update(changes: Partial<SocialsSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
