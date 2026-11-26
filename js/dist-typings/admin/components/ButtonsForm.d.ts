import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type { ButtonItem, ButtonsSection, Placement } from '../../common/types';
export interface ButtonsFormAttrs extends ComponentAttrs {
    value: ButtonsSection;
    onchange: (value: ButtonsSection) => void;
    /** A corner used by the social icons. */
    taken: Placement | null;
    /** No placement below the text (fof/polls). */
    noBelowText?: boolean;
}
export default class ButtonsForm extends Component<ButtonsFormAttrs> {
    /** The card being edited: one at a time, the others folded to their header. */
    open: number | null;
    view(): JSX.Element;
    oncreate(vnode: Mithril.VnodeDOM<ButtonsFormAttrs, this>): void;
    item(button: ButtonItem, index: number): JSX.Element;
    /** The buttons, or one empty card to fill when there is none yet (stored only once filled in). */
    list(): ButtonItem[];
    /** Moves a button; the open card stays open wherever it goes. */
    move(from: number, to: number): void;
    setItems(items: ButtonItem[]): void;
    update(changes: Partial<ButtonsSection>): void;
}
