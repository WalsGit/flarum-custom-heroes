/**
 * Hooks into `view()` rather than `className()` or `style()`, which the hero
 * subclasses override. A hero without config is left untouched.
 *
 * The base `Hero` covers every hero, but an extension that hooks a subclass
 * first (flarum/tags on `DiscussionHero`) gives it its own `view()`, built on
 * the original one: the known subclasses are hooked too.
 */
export default function extendHero(): void;
