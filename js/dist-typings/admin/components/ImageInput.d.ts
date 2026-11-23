import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { ImageRef } from '../../common/types';
export interface ImageInputAttrs extends ComponentAttrs {
    kind: 'background' | 'logo';
    image: ImageRef | null;
    onchange: (image: ImageRef | null) => void;
    /** The config being edited: uploaded images belong to it. */
    target: string;
}
/** Upload, URL import and removal of a hero image. */
export default class ImageInput extends Component<ImageInputAttrs> {
    loading: boolean;
    url: string;
    view(): JSX.Element;
    pickFile(): void;
    send(body: FormData | Record<string, string>): void;
}
