import Modal, { type IInternalModalAttrs } from 'flarum/common/components/Modal';
import type Mithril from 'mithril';
import { type FocalPoint, type ImageRef } from '../../common/types';
import { type Device } from '../utils/visibleArea';
import { type HeroPreviewAttrs } from './HeroPreview';
export interface BackgroundPositionModalAttrs extends IInternalModalAttrs {
    image: ImageRef;
    /** The config the image file belongs to. */
    owner: string;
    position: FocalPoint;
    /** The edited hero, rendered out of sight to measure its real height on each device. */
    preview: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>;
    onapply: (position: FocalPoint) => void;
}
/**
 * Places the focal point of a background image, by pointer (mouse, touch,
 * pen) or with two number fields. A frame shows the part of the image the
 * chosen device shows.
 */
export default class BackgroundPositionModal extends Modal<BackgroundPositionModalAttrs> {
    point: FocalPoint;
    device: Device;
    /** The measured hero heights: they depend on its text, logo and buttons, not only on its height setting. */
    heights: Partial<Record<Device, number>>;
    oninit(vnode: Mithril.Vnode<BackgroundPositionModalAttrs, this>): void;
    oncreate(vnode: Mithril.VnodeDOM<BackgroundPositionModalAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<BackgroundPositionModalAttrs, this>): void;
    className(): string;
    title(): string;
    content(): JSX.Element;
    measure(): void;
    pick(e: PointerEvent): void;
    /** The devices that crop the width of the image (a hero taller, in proportion, than the image). */
    cropsWidth(): Device[];
    apply(): void;
}
