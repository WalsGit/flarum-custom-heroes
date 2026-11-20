import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
import type { HeroConfig, HeroConfigs } from '../../common/types';
/** The sections this page edits. Other sections of a config are kept as they are. */
type EditedSection = 'background' | 'overlay' | 'height';
/**
 * Edits the hero config of one target at a time (global, a hero type or a
 * tag). Each section is either inherited from the level above or defined
 * here.
 */
export default class HeroesPage extends ExtensionPage {
    /** The config being edited: `global`, `welcome`, `tag:12`… */
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
     */
    section<K extends EditedSection>(name: K, initial: (parent: HeroConfig[K] | undefined) => NonNullable<HeroConfig[K]>, form: (value: NonNullable<HeroConfig[K]>, set: (value: NonNullable<HeroConfig[K]>) => void) => Mithril.Children): JSX.Element;
    tagsEnabled(): boolean;
    scopeLabel(key: string): string;
    scopeOptions(): Record<string, string>;
    load(key: string): void;
    select(key: string): void;
    isDirty(): boolean;
    reset(): void;
    save(config: HeroConfig): void;
}
export {};
