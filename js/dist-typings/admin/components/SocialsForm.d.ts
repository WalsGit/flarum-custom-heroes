import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { SocialItem, SocialsSection } from '../../common/types';
export interface SocialsFormAttrs extends ComponentAttrs {
    value: SocialsSection;
    onchange: (value: SocialsSection) => void;
}
export default class SocialsForm extends Component<SocialsFormAttrs> {
    view(): JSX.Element;
    item(item: SocialItem, index: number): JSX.Element;
    setItems(items: SocialItem[]): void;
    update(changes: Partial<SocialsSection>): void;
}
