import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
import { type HeroConfig, type HeroConfigs, type Placement } from '../../common/types';
/** The sections this page edits. Other sections of a config are kept as they are. */
type EditedSection = 'background' | 'overlay' | 'height' | 'textStyle' | 'logo' | 'socials';
/**
 * Edits the hero config of one target at a time (global, a hero type or a
 * tag). Each section is either inherited from the level above or defined
 * here.
 */
export default class HeroesPage extends ExtensionPage {
    /** The config being edited: `global`, `discussion`, `tag:12`… */
    key: string;
    /** The stored configs, kept in sync with the server after each save. */
    configs: HeroConfigs;
    draft: HeroConfig;
    saving: boolean;
    oninit(vnode: Mithril.Vnode<any, this>): void;
    className(): string;
    sections(vnode: Mithril.VnodeDOM<any, this>): import("flarum/common/utils/ItemList").default<unknown>;
    content(): JSX.Element;
    /**
     * A section card: inherited (with where it comes from) or defined here.
     * With `addLabel`, a section that has nothing to inherit is switched on to
     * be added ("Add a logo") rather than off to stop using Flarum's default.
     */
    section<K extends EditedSection>(name: K, initial: (parent: HeroConfig[K] | undefined) => NonNullable<HeroConfig[K]>, form: (value: NonNullable<HeroConfig[K]>, set: (value: NonNullable<HeroConfig[K]>) => void) => Mithril.Children, addLabel?: string): JSX.Element;
    /**
     * The corner used by the buttons or the icons in the config this hero
     * will use (draft and inherited), which the other one cannot take.
     */
    takenCorner(name: 'socials' | 'buttons'): Placement | null;
    /**
     * Buttons are opt-in on tags and discussions (the default ones are for the
     * home hero): shown or not, then the default buttons or their own.
     */
    buttonsSection(): JSX.Element;
    /** Default level only (home hero), with no level to inherit from: the default is stored as a missing section. */
    textSection(): JSX.Element;
    tagsEnabled(): boolean;
    /** The keys of the configs a target uses, itself last: a child tag inherits from its parent. */
    chain(key: string): string[];
    scopeLabel(key: string): string;
    scopeOptions(): Record<string, string>;
    load(key: string): void;
    select(key: string): void;
    isDirty(): boolean;
    reset(): void;
    save(config: HeroConfig): void;
}
export {};
