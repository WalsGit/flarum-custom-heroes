import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { HeightSection } from '../../common/types';
export interface HeightFormAttrs extends ComponentAttrs {
    value: HeightSection;
    onchange: (value: HeightSection) => void;
}
export default class HeightForm extends Component<HeightFormAttrs> {
    view(): JSX.Element;
}
