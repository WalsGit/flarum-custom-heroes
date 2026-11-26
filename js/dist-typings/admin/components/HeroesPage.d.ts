import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
import { type ImageRef, type HeroConfig, type HeroConfigs, type Placement, type ButtonsSection, type SocialsSection } from '../../common/types';
/** The sections this page edits. Other sections of a config are kept as they are. */
type EditedSection = 'background' | 'overlay' | 'height' | 'textStyle' | 'logo';
/** Sections the other heroes opt in to: off, the default ones (`inherit`) or their own. */
type OptInSection = 'socials' | 'buttons';
type OwnSections = {
    socials: SocialsSection;
    buttons: ButtonsSection;
};
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
    /** Sections switched off in the draft, given back when switched on again. */
    stash: HeroConfig;
    /** The target's own socials or buttons, given back after switching to the default ones and back. */
    own: Partial<OwnSections>;
    /** The open section tab. */
    tab: EditedSection | 'text' | OptInSection;
    saving: boolean;
    oninit(vnode: Mithril.Vnode<any, this>): void;
    className(): string;
    sections(vnode: Mithril.VnodeDOM<any, this>): import("flarum/common/utils/ItemList").default<unknown>;
    content(): JSX.Element;
    /** The sections of this target, one tab each, only the open one rendered. */
    tabs(): JSX.Element;
    /**
     * A section card: inherited (with where it comes from) or defined here.
     * With `addLabel`, a section that has nothing to inherit is switched on to
     * be added ("Add a logo") rather than off to stop using Flarum's default.
     */
    section<K extends EditedSection>(name: K, initial: (parent: HeroConfig[K] | undefined) => NonNullable<HeroConfig[K]>, form: (value: NonNullable<HeroConfig[K]>, set: (value: NonNullable<HeroConfig[K]>) => void) => Mithril.Children, addLabel?: string, isEmpty?: (value: NonNullable<HeroConfig[K]>) => boolean): JSX.Element;
    /** What the section does, at the top of its tab. */
    intro(name: string): JSX.Element;
    /** The background image of the level above, which this target can use with its own position. */
    inheritedBackground(): {
        image: ImageRef;
        owner: string;
        label: string;
    } | null;
    /**
     * The corner used by the buttons or the icons in the config this hero
     * will use (draft and inherited), which the other one cannot take.
     */
    takenCorner(name: 'socials' | 'buttons'): Placement | null;
    /**
     * Social icons and buttons are opt-in on the other heroes (the default ones
     * are for the home hero): shown or not, then the default ones or their own.
     */
    optInSection(name: OptInSection): JSX.Element;
    /** Every tag at once, apart from the text style (which it can inherit): stored only to hide the part. */
    tagSwitch(name: 'tagIcon' | 'tagDescription' | 'tagColor', group?: string): JSX.Element;
    /** Discussions use the background, overlay and height of their tag's hero: off by default, stored only on. */
    tagHeroSwitch(): JSX.Element;
    /** The heroes of the other extensions are only customized once enabled: off by default, stored only on. */
    enabledSwitch(): JSX.Element;
    /** Where a discussion shows its tags, apart from the text style (which it can inherit). Above the title: not stored. */
    discussionTagsField(): JSX.Element;
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
