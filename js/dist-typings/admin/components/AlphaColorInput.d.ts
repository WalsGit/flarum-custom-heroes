import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
export interface AlphaColorInputAttrs extends ComponentAttrs {
    value: string;
    onchange: (value: string) => void;
    label: string;
    /** Shows what each control sets ("Color", "Opacity") above it. */
    legends?: boolean;
}
/** A color with its opacity, as `#rrggbbaa`. */
export default class AlphaColorInput extends Component<AlphaColorInputAttrs> {
    view(): JSX.Element;
}
/** A small caption above a control, saying what it sets. */
export declare function legend(text: string, control: Mithril.Children): JSX.Element;
