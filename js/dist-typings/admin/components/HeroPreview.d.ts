import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';
import { type HeroConfigs } from '../../common/types';
import { type Device } from '../utils/visibleArea';
export interface HeroPreviewAttrs extends ComponentAttrs {
    /** The stored configs, with the draft of the edited target in place. */
    configs: HeroConfigs;
    /** The edited target: `global`, `discussion`, `tag:12`… */
    target: string;
    /** The keys of the configs the target uses, itself last. */
    chain: string[];
    /** The Text tab is open: the preview shows the custom text (still free to switch back). */
    textTab?: boolean;
}
/**
 * A live preview of the edited hero, rendered like on the forum (same
 * classes, variables and container queries) at the real width of each device.
 */
export default class HeroPreview extends Component<HeroPreviewAttrs> {
    device: Device;
    /** Home (default level): preview the hero once Flarum's welcome text is closed. */
    closed: boolean;
    /** Discussions: the tag the sample discussion is in (preview only, not stored). */
    sampleTag: string | null;
    observer: ResizeObserver | null;
    onscroll: () => void;
    view(): JSX.Element;
    hero(): JSX.Element;
    /** Every tag in Flarum's order, children indented: to see the hero with each tag's color. */
    sampleTagSelect(): JSX.Element | null;
    oncreate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    oninit(vnode: Mithril.Vnode<HeroPreviewAttrs, this>): void;
    onbeforeupdate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    onupdate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>): void;
    /** Adds a shadow while the preview is stuck at the top, like the admin header, to separate it from the forms. */
    markStuck(): void;
    fit(): void;
}
/**
 * The hero of a target, rendered like on the forum. Home (default level):
 * `closed` shows it once Flarum's welcome text is closed.
 */
export declare function previewHero({ configs, target, chain }: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>, closed: boolean, sampleTag?: string | null): JSX.Element;
