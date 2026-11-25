import Component, { type ComponentAttrs } from 'flarum/common/Component';
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
    view(): Mithril.Vnode;
}
