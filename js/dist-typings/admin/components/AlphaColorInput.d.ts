import Component, { type ComponentAttrs } from 'flarum/common/Component';
export interface AlphaColorInputAttrs extends ComponentAttrs {
    value: string;
    onchange: (value: string) => void;
    label: string;
}
/** A color with its opacity, as `#rrggbbaa`. */
export default class AlphaColorInput extends Component<AlphaColorInputAttrs> {
    view(): JSX.Element;
}
