import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Dropdown from 'flarum/common/components/Dropdown';
import classList from 'flarum/common/utils/classList';

export interface IconPickerAttrs extends ComponentAttrs {
  /** The chosen Font Awesome class, or null for none. */
  value: string | null;
  /** The icons offered, by class, with their names (shown on hover). */
  icons: Record<string, string>;
  onchange: (icon: string | null) => void;
  /** Names the toggle for screen readers. */
  label: string;
  /** The name of a first "no icon" choice, when an icon is optional. */
  noneLabel?: string;
  className?: string;
}

/**
 * A grid of icons, no text, in a dropdown (Flarum's: closes on an outside
 * click or Escape). Any other Font Awesome class can still be typed next to it.
 */
export default class IconPicker extends Component<IconPickerAttrs> {
  view() {
    const { value, icons, onchange, label, noneLabel } = this.attrs;
    const choice = (icon: string | null, name: string) => (
      <Button
        className={classList('Button Button--icon', value === icon && 'active')}
        icon={icon ?? 'fas fa-ban'}
        noStyleOverride={true}
        title={name}
        aria-label={name}
        onclick={() => onchange(icon)}
      />
    );

    // One child per icon: the dropdown puts each child in its own list item (a grid cell).
    const choices = [
      ...(noneLabel !== undefined ? [choice(null, noneLabel)] : []),
      ...Object.entries(icons).map(([icon, name]) => choice(icon, name)),
    ];

    return Dropdown.component(
      {
        className: classList('wch-IconPicker', this.attrs.className),
        buttonClassName: 'Button Button--icon',
        menuClassName: 'wch-IconPicker-menu',
        icon: value || 'fas fa-icons',
        noStyleOverride: true,
        caretIcon: '',
        label: '',
        accessibleToggleLabel: label,
      },
      choices
    );
  }
}
