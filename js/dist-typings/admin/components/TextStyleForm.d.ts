import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { TextStyleSection } from '../../common/types';
export interface TextStyleFormAttrs extends ComponentAttrs {
    value: TextStyleSection;
    onchange: (value: TextStyleSection) => void;
    /** Heroes without a description (discussions): no description size. */
    noSubtitle?: boolean;
}
export default class TextStyleForm extends Component<TextStyleFormAttrs> {
    view(): JSX.Element;
}
