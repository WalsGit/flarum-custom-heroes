import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { TextSection } from '../../common/types';
export interface TextFormAttrs extends ComponentAttrs {
    value: TextSection;
    onchange: (value: TextSection) => void;
}
export default class TextForm extends Component<TextFormAttrs> {
    view(): JSX.Element;
}
