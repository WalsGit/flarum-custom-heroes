import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { type HeroConfig, type HeroConfigs } from '../../common/types';
export interface HeroPreviewAttrs extends ComponentAttrs {
    /** The stored configs, with the draft of the edited target in place. */
    configs: HeroConfigs;
    /** The edited target: `global`, `welcome`, `tag:12`… */
    target: string;
}
type Device = 'desktop' | 'tablet' | 'mobile';
/**
 * A live preview of the edited hero, rendered like on the forum (same
 * classes, variables and container queries) at the real width of each device.
 */
export default class HeroPreview extends Component<HeroPreviewAttrs> {
    device: Device;
    /** Welcome: preview the hero once Flarum's welcome text is closed. */
    closed: boolean;
    observer: ResizeObserver | null;
    onscroll: () => void;
    view(): JSX.Element;
    hero(): JSX.Element;
    /** What the hero shows: the Welcome texts, a tag, or a sample discussion. */
    content(scope: string, scopeId: string, config: HeroConfig, closed: boolean): {
        title: string;
        subtitle?: string;
        color?: string;
    };
    oncreate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    /** Adds a shadow while the preview is stuck at the top, like the admin header, to separate it from the forms. */
    markStuck(): void;
    fit(): void;
}
export {};
