import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { LogoSection } from '../../common/types';
export interface LogoFormAttrs extends ComponentAttrs {
    value: LogoSection;
    onchange: (value: LogoSection) => void;
    /** The config being edited: uploaded images belong to it. */
    target: string;
}
export default class LogoForm extends Component<LogoFormAttrs> {
    view(): JSX.Element;
    update(changes: Partial<LogoSection>): void;
}
