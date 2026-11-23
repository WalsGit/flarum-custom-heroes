import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { ButtonItem, ButtonsSection, Placement } from '../../common/types';
export interface ButtonsFormAttrs extends ComponentAttrs {
    value: ButtonsSection;
    onchange: (value: ButtonsSection) => void;
    /** A corner used by the social icons. */
    taken: Placement | null;
}
export default class ButtonsForm extends Component<ButtonsFormAttrs> {
    view(): JSX.Element;
    item(button: ButtonItem, index: number): JSX.Element;
    setItems(items: ButtonItem[]): void;
    update(changes: Partial<ButtonsSection>): void;
}
