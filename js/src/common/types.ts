/**
 * Types of the hero configs, mirroring the server-side schema
 * (`src/Config/ConfigValidator.php`). Configs reach the frontend already
 * validated and normalized: optional keys are always filled.
 */

export type HeroScope = 'global' | 'welcome' | 'tag' | 'discussion';

/** `#rgb`, `#rrggbb` or `#rrggbbaa`, lowercase. */
export type Color = string;

export type Size = 's' | 'm' | 'l';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Placement = Corner | 'below-text';

export interface ImageRef {
  id: string;
  width: number;
  height: number;
  /** Background images only: the generated widths, ascending. */
  widths?: number[];
}

export interface BackgroundSection {
  image: ImageRef | null;
  position: 'center' | 'top' | 'bottom';
}

export interface GradientStop {
  color: Color;
  at: number;
}

/** Linear: along an angle, or from a corner to the opposite one. */
export type LinearGradient = { type: 'gradient'; stops: GradientStop[] } & ({ angle: number } | { corner: Corner });

export interface RadialGradient {
  type: 'radial';
  shape: 'circle' | 'ellipse';
  position: 'center' | Corner;
  stops: GradientStop[];
}

export type OverlaySection = { type: 'none' } | { type: 'solid'; color: Color } | LinearGradient | RadialGradient;

export type HeightSection = { preset: 'auto' | Size } | { preset: 'custom'; desktop: number; tablet: number; mobile: number };

export interface TextStyleSection {
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  titleSize: Size | 'xl';
  subtitleSize: Size;
  color: Color | null;
}

export type TextSection = { source: 'core' } | { source: 'custom'; title: string; message: string };

export interface LogoSection {
  image: ImageRef;
  side: 'left' | 'right';
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
  items: SocialItem[];
}

interface ButtonBase {
  label: string;
  icon: string | null;
  size: Size;
  bg: Color | null;
  color: Color | null;
}

export type ButtonItem =
  | (ButtonBase & { action: 'link'; url: string; newTab: boolean; visibility: 'all' | 'guest' | 'user' })
  | (ButtonBase & { action: 'login' | 'signup' });

export interface ButtonsSection {
  placement: Placement;
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
  socials?: SocialsSection;
  buttons?: ButtonsSection;
  dismissible?: boolean;
}

/** Configs keyed by `scope` or `scope:scopeId`. */
export type HeroConfigs = Record<string, HeroConfig>;

/** The `walsgitCustomHeroes` forum attribute. */
export interface ForumPayload {
  assetsUrl: string;
  /** Sent as an empty list (`[]`) when nothing is configured. */
  configs: HeroConfigs | [];
}
