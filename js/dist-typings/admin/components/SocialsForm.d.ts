import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import type { Placement, SocialItem, SocialsSection } from '../../common/types';
export interface SocialsFormAttrs extends ComponentAttrs {
    value: SocialsSection;
    onchange: (value: SocialsSection) => void;
    /** A corner used by the buttons. */
    taken: Placement | null;
}
/**
 * A new icon, with the label and link it suggests: they replace a field only
 * when it is empty or still holds what the previous icon filled in.
 */
export declare function withIcon(item: SocialItem, icon: string): SocialItem;
export default class SocialsForm extends Component<SocialsFormAttrs> {
    view(): JSX.Element;
    item(item: SocialItem, index: number): JSX.Element;
    /** The icons, or one empty row to fill when there is none yet (stored only once typed in). */
    list(): SocialItem[];
    setItems(items: SocialItem[]): void;
    oncreate(vnode: Mithril.VnodeDOM<SocialsFormAttrs, this>): void;
    update(changes: Partial<SocialsSection>): void;
}
