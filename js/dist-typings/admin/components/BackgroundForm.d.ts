import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { BackgroundSection } from '../../common/types';
export interface BackgroundFormAttrs extends ComponentAttrs {
    value: BackgroundSection;
    onchange: (value: BackgroundSection) => void;
    /** The config being edited: uploaded images belong to it. */
    target: string;
}
export default class BackgroundForm extends Component<BackgroundFormAttrs> {
    view(): JSX.Element;
    update(changes: Partial<BackgroundSection>): void;
}
