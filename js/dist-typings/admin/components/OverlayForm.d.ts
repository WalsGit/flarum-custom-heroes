import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { OverlaySection } from '../../common/types';
export interface OverlayFormAttrs extends ComponentAttrs {
    value: OverlaySection;
    onchange: (value: OverlaySection) => void;
}
export default class OverlayForm extends Component<OverlayFormAttrs> {
    view(): JSX.Element;
    gradient(value: Extract<OverlaySection, {
        type: 'gradient';
    }>): JSX.Element[];
}
