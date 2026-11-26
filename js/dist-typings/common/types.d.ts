/**
 * Types of the hero configs, mirroring the server-side schema
 * (`src/Config/ConfigValidator.php`). Configs reach the frontend already
 * validated and normalized: optional keys are always filled.
 */
/** `global` is also the config of the home (Welcome) hero. */
export type HeroScope = 'global' | 'tag' | 'discussion' | 'messages' | 'deck' | 'pages' | 'users' | 'polls' | 'other';
/** `#rgb`, `#rrggbb` or `#rrggbbaa`, lowercase. */
export type Color = string;
export type Size = 's' | 'm' | 'l';
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type Placement = Corner | 'below-text';
/** On mobile: like on wider screens, below the text instead of a corner, or hidden. */
export type MobileBehavior = 'same' | 'below-text' | 'hide';
export interface ImageRef {
    id: string;
    width: number;
    height: number;
    /** Background images only: the generated widths, ascending. */
    widths?: number[];
}
/** A point of the image in percent, kept visible by the crop (CSS `object-position`). */
export interface FocalPoint {
    x: number;
    y: number;
}
export declare const CENTER: FocalPoint;
export interface BackgroundSection {
    /** `inherit` (not on the default level): the image of the level above, with this level's own position. */
    image: ImageRef | null | 'inherit';
    position: FocalPoint;
}
export interface GradientStop {
    color: Color;
    at: number;
}
/** Linear: along an angle, or from a corner to the opposite one. */
export type LinearGradient = {
    type: 'gradient';
    stops: GradientStop[];
} & ({
    angle: number;
} | {
    corner: Corner;
});
export interface RadialGradient {
    type: 'radial';
    shape: 'circle' | 'ellipse';
    position: 'center' | Corner;
    stops: GradientStop[];
}
/** One color per corner, blending in the middle. */
export interface CornersGradient {
    type: 'corners';
    topLeft: Color;
    topRight: Color;
    bottomLeft: Color;
    bottomRight: Color;
}
export type OverlaySection = {
    type: 'none';
} | {
    type: 'solid';
    color: Color;
} | LinearGradient | RadialGradient | CornersGradient;
export type HeightSection = {
    preset: 'auto' | Size;
} | {
    preset: 'custom';
    desktop: number;
    tablet: number;
    mobile: number;
};
export interface TextStyleSection {
    align: 'left' | 'center' | 'right';
    vAlign: 'top' | 'middle' | 'bottom';
    titleSize: Size | 'xl';
    subtitleSize: Size;
    color: Color | null;
}
/**
 * Default level only (home hero). Flarum's welcome text can always be closed; then the hero
 * stays with this text (empty: no text) or disappears like in Flarum.
 */
export interface TextSection {
    afterClose: 'hero' | 'none';
    title: string;
    message: string;
}
/** What a Welcome hero without `text` section does: it stays, without text. */
export declare const DEFAULT_TEXT: TextSection;
export interface LogoSection {
    /** null: no logo, instead of the one of the level above. */
    image: ImageRef | null;
    /** Next to the text, above the title, or instead of it (discussions: above their title). */
    side: 'left' | 'right' | 'above' | 'title';
    size: Size;
    alt: string;
    hideOnMobile: boolean;
}
export interface SocialItem {
    icon: string;
    url: string;
    label: string;
}
export interface SocialsSection {
    size: 'xs' | 's' | 'm';
    placement: Placement;
    color: Color | null;
    mobile: MobileBehavior;
    items: SocialItem[];
}
interface ButtonBase {
    label: string;
    icon: string | null;
    /** Flarum's primary or standard button, or an outline in the hero's text color. */
    style: 'primary' | 'default' | 'outline';
    size: Size;
    bg: Color | null;
    color: Color | null;
}
export type ButtonItem = (ButtonBase & {
    action: 'link';
    url: string;
    newTab: boolean;
    visibility: 'all' | 'guest' | 'user';
}) | (ButtonBase & {
    action: 'login' | 'signup';
});
export interface ButtonsSection {
    placement: Placement;
    mobile: MobileBehavior;
    items: ButtonItem[];
}
/**
 * A config is a set of sections. A missing section is inherited from the
 * level above.
 */
export interface HeroConfig {
    background?: BackgroundSection;
    overlay?: OverlaySection;
    height?: HeightSection;
    textStyle?: TextStyleSection;
    text?: TextSection;
    logo?: LogoSection;
    /**
     * The heroes other than the home one do not inherit the default icons and buttons: `inherit` shows them there.
     * `false` (a page of fof/pages) hides those of the level above.
     */
    socials?: SocialsSection | 'inherit' | false;
    buttons?: ButtonsSection | 'inherit' | false;
    /** Tag heroes only: `false` hides the tag's icon before its name. */
    tagIcon?: false;
    /** Tag heroes only: `false` hides the tag's description. */
    tagDescription?: false;
    /** Discussion heroes only: the tags go below the title, or are hidden (above the title by default). */
    discussionTags?: 'below' | 'hidden';
    /** Discussion heroes only: `false` keeps the hero's own color instead of the color of the discussion's tag. */
    tagColor?: false;
    /** Discussion heroes only: `true` uses the background, overlay and height of the discussion's tag hero. */
    tagHero?: true;
    /** The heroes of the other extensions only: `true` customizes them (they are left as they are by default). */
    enabled?: true;
}
/** The config a hero uses, once inherited: `inherit` is replaced by the default icons and buttons and the image of the level above. */
export type ResolvedConfig = Omit<HeroConfig, 'background' | 'socials' | 'buttons'> & {
    background?: Omit<BackgroundSection, 'image'> & {
        image: ImageRef | null;
    };
    socials?: SocialsSection;
    buttons?: ButtonsSection;
};
/** Configs keyed by `scope` or `scope:scopeId`. */
export type HeroConfigs = Record<string, HeroConfig>;
/** The `walsgitCustomHeroes` forum attribute. */
export interface ForumPayload {
    assetsUrl: string;
    /** Sent as an empty list (`[]`) when nothing is configured. */
    configs: HeroConfigs | [];
}
export {};
