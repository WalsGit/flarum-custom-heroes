import Component, { type ComponentAttrs } from 'flarum/common/Component';
import { type BackgroundSection, type ImageRef } from '../../common/types';
import type { HeroPreviewAttrs } from './HeroPreview';
export interface BackgroundFormAttrs extends ComponentAttrs {
    value: BackgroundSection;
    onchange: (value: BackgroundSection) => void;
    /** The config being edited: uploaded images belong to it. */
    target: string;
    /** The image of the level above (`inherit`), with the config it belongs to and its label. */
    inherited: {
        image: ImageRef;
        owner: string;
        label: string;
    } | null;
    /** The edited hero, for the position modal to measure it. */
    preview: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>;
}
export default class BackgroundForm extends Component<BackgroundFormAttrs> {
    view(): JSX.Element;
    update(changes: Partial<BackgroundSection>): void;
}
