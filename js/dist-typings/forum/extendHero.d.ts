import type { HeroConfig } from '../common/types';
import { type HeroTarget } from './heroTarget';
/**
 * The config that applies to a hero, or null when nothing is configured for it.
 */
export declare function targetConfig(target: HeroTarget): HeroConfig | null;
/**
 * Hooks into the base `Hero` component, so that every hero is covered with a
 * single extension. `view()` is used rather than `className()` or `style()`,
 * which the hero subclasses override. A hero without config is left untouched.
 */
export default function extendHero(): void;
