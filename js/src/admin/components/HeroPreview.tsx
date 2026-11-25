import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { decorateContent, heroDecoration } from '../../common/heroDecoration';
import { resolveConfig } from '../../common/resolveConfig';
import { DEFAULT_TEXT, type ForumPayload, type HeroConfig, type HeroConfigs } from '../../common/types';
import { targetOf } from '../utils/scopes';
import { DEVICE_WIDTHS as WIDTHS, type Device } from '../utils/visibleArea';

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

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.preview.${key}`, params, true);

/**
 * A live preview of the edited hero, rendered like on the forum (same
 * classes, variables and container queries) at the real width of each device.
 */
export default class HeroPreview extends Component<HeroPreviewAttrs> {
  device: Device = 'desktop';
  /** Home (default level): preview the hero once Flarum's welcome text is closed. */
  closed = false;
  observer: ResizeObserver | null = null;
  onscroll = () => this.markStuck();

  view() {
    return (
      <div className="wch-Preview">
        <div className="wch-Preview-toolbar">
          <strong className="wch-Preview-title">
            <Icon name="fas fa-eye" /> {t('title')}
          </strong>
          <div className="ButtonGroup">
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
              <Button
                className={classList('Button', this.device === device && 'active')}
                icon={{ desktop: 'fas fa-desktop', tablet: 'fas fa-tablet-alt', mobile: 'fas fa-mobile-alt' }[device]}
                aria-pressed={this.device === device}
                onclick={() => (this.device = device)}
              >
                {t(device)}
              </Button>
            ))}
          </div>
          {targetOf(this.attrs.target).scope === 'global' && (
            <div className="ButtonGroup">
              {[false, true].map((closed) => (
                <Button
                  className={classList('Button', this.closed === closed && 'active')}
                  aria-pressed={this.closed === closed}
                  onclick={() => (this.closed = closed)}
                >
                  {t(closed ? 'state_closed' : 'state_welcome')}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="wch-Preview-frame">
          <div className="wch-Preview-viewport" style={{ width: `${WIDTHS[this.device]}px` }}>
            {this.hero()}
          </div>
        </div>
      </div>
    );
  }

  hero() {
    return previewHero(this.attrs, this.closed);
  }

  oncreate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>) {
    super.oncreate(vnode);

    // Scales the rendered width down to the frame, whatever the window size.
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(this.element.querySelector('.wch-Preview-frame')!);

    window.addEventListener('scroll', this.onscroll, { passive: true });
    this.markStuck();
  }

  oninit(vnode: Mithril.Vnode<HeroPreviewAttrs, this>) {
    super.oninit(vnode);
    this.closed = !!this.attrs.textTab;
  }

  onbeforeupdate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>) {
    // Compared before the new attrs replace the old ones.
    if (vnode.attrs.textTab && !this.attrs.textTab) this.closed = true;
    super.onbeforeupdate(vnode);
  }

  onupdate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>) {
    super.onupdate(vnode);
    this.fit();
  }

  onremove(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>) {
    super.onremove(vnode);
    this.observer?.disconnect();
    window.removeEventListener('scroll', this.onscroll);
  }

  /** Adds a shadow while the preview is stuck at the top, like the admin header, to separate it from the forms. */
  markStuck() {
    const style = getComputedStyle(this.element);
    const top = parseFloat(style.top);
    // Not sticky on small screens.
    const stuck = style.position === 'sticky' && !isNaN(top) && this.element.getBoundingClientRect().top <= top + 1 && window.scrollY > 0;

    this.element.classList.toggle('wch-Preview--stuck', stuck);
  }

  fit() {
    const frame = this.element.querySelector<HTMLElement>('.wch-Preview-frame');
    const viewport = this.element.querySelector<HTMLElement>('.wch-Preview-viewport');

    if (frame && viewport) {
      // `zoom` rather than a transform: the layout box shrinks too, so the frame keeps the right height.
      viewport.style.zoom = String(Math.min(1, frame.clientWidth / WIDTHS[this.device]));
    }
  }
}

/**
 * The hero of a target, rendered like on the forum. Home (default level):
 * `closed` shows it once Flarum's welcome text is closed.
 */
export function previewHero({ configs, target, chain }: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>, closed: boolean) {
  const { scope, scopeId } = targetOf(target);
  const payload = app.forum.attribute<ForumPayload>('walsgitCustomHeroes');
  const decoration = heroDecoration(configs, chain, scope, payload.assetsUrl);
  const config = resolveConfig(configs, chain);
  // Like on the forum: without Flarum's welcome title, the hero is in its closed state.
  closed = scope === 'global' && (closed || !app.forum.attribute<string>('welcomeTitle')?.trim());

  if (closed && (config.text ?? DEFAULT_TEXT).afterClose === 'none') {
    return <p className="wch-Preview-hidden">{t('hidden')}</p>;
  }

  const content = heroContent(scope, scopeId, config, closed);
  // Flarum's deck hero can be closed too (for good, like in Flarum).
  const closable = (scope === 'global' && !closed) || scope === 'deck';

  const children = [
    closable && <i className="Hero-close fas fa-times" aria-hidden="true" />,
    <div className="containerNarrow">
      {content.title && (
        <h1 className="Hero-title">
          {content.icon && <i className={content.icon} aria-hidden="true" />} {content.title}
        </h1>
      )}
      {/* Like the core: kept even when empty (but discussions have none). */}
      {(content.subtitle || (content.title && scope !== 'discussion')) && (
        <div className={classList('Hero-subtitle', closed && 'wch-Hero-message')}>{content.subtitle}</div>
      )}
    </div>,
  ];

  const decorated = decoration ? decorateContent(children, decoration) : { content: children, corners: [] };

  return (
    <header
      className={classList('Hero wch-PreviewHero', decoration?.className, content.color && 'wch-PreviewHero--colored')}
      style={{ ...(content.color ? { '--hero-bg': content.color } : {}), ...decoration?.style }}
    >
      {decoration?.background}
      <div className="container">{decorated.content}</div>
      {decorated.corners}
    </header>
  );
}

/** What the hero shows: the Welcome texts (default level), a tag, or a sample of the other heroes. */
function heroContent(
  scope: string,
  scopeId: string,
  config: HeroConfig,
  closed: boolean
): { title: string; subtitle?: string; color?: string; icon?: string } {
  if (scope === 'tag') {
    const tag = scopeId ? app.store.getById('tags', scopeId) : null;

    return tag
      ? {
          title: tag.attribute('name') as string,
          subtitle: (tag.attribute('description') as string) || undefined,
          color: (tag.attribute('color') as string) || undefined,
        }
      : { title: t('tag_title'), subtitle: t('tag_subtitle') };
  }

  if (scope === 'discussion') {
    return { title: t('discussion_title') };
  }

  // Like Flarum's heroes of these extensions (their texts are not loaded in the admin).
  if (scope === 'messages' || scope === 'deck') {
    return {
      title: t(`${scope}_title`),
      subtitle: t(`${scope}_subtitle`),
      icon: scope === 'messages' ? 'fas fa-envelope' : 'fas fa-table-columns',
    };
  }

  if (closed) {
    const { title, message } = config.text ?? DEFAULT_TEXT;

    return { title: title.trim(), subtitle: message.trim() ? message : undefined };
  }

  // The Welcome message is HTML: the preview only needs its text.
  const message = new DOMParser().parseFromString(app.forum.attribute<string>('welcomeMessage') ?? '', 'text/html').body.textContent ?? '';

  // Like on the forum: an empty core title or message is not shown.
  return { title: app.forum.attribute<string>('welcomeTitle')?.trim() ?? '', subtitle: message.trim() || undefined };
}
