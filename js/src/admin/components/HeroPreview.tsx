import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { heroDecoration } from '../../common/heroDecoration';
import { resolveConfig } from '../../common/resolveConfig';
import { DEFAULT_TEXT, type ForumPayload, type HeroConfig, type HeroConfigs } from '../../common/types';
import { parentChain, targetOf } from '../utils/scopes';

export interface HeroPreviewAttrs extends ComponentAttrs {
  /** The stored configs, with the draft of the edited target in place. */
  configs: HeroConfigs;
  /** The edited target: `global`, `welcome`, `tag:12`… */
  target: string;
}

type Device = 'desktop' | 'tablet' | 'mobile';

/** The width the hero is rendered at, then scaled down to fit the frame. */
const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.preview.${key}`, params, true);

/**
 * A live preview of the edited hero, rendered like on the forum (same
 * classes, variables and container queries) at the real width of each device.
 */
export default class HeroPreview extends Component<HeroPreviewAttrs> {
  device: Device = 'desktop';
  /** Welcome: preview the hero once Flarum's welcome text is closed. */
  closed = false;
  observer: ResizeObserver | null = null;
  onscroll = () => this.markStuck();

  view() {
    return (
      <div className="wch-Preview">
        <div className="wch-Preview-toolbar">
          <strong>{t('title')}</strong>
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
          {targetOf(this.attrs.target).scope === 'welcome' && (
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
    const { configs, target } = this.attrs;
    const { scope, scopeId } = targetOf(target);
    // The global config is previewed on its own, the others with what they inherit.
    const chain = [...parentChain(target), target];
    const payload = app.forum.attribute<ForumPayload>('walsgitCustomHeroes');
    const decoration = heroDecoration(configs, chain, scope, payload.assetsUrl);
    const config = resolveConfig(configs, chain);
    // Like on the forum: without Flarum's welcome title, the hero is in its closed state.
    const closed = scope === 'welcome' && (this.closed || !app.forum.attribute<string>('welcomeTitle')?.trim());

    if (closed && (config.text ?? DEFAULT_TEXT).afterClose === 'none') {
      return <p className="wch-Preview-hidden">{t('hidden')}</p>;
    }

    const content = this.content(scope, scopeId, config, closed);
    const closable = scope === 'welcome' && !closed;

    return (
      <header
        className={classList('Hero wch-PreviewHero', decoration?.className, content.color && 'wch-PreviewHero--colored')}
        style={{ ...(content.color ? { '--hero-bg': content.color } : {}), ...decoration?.style }}
      >
        {decoration?.background}
        <div className="container">
          {closable && <i className="Hero-close fas fa-times" aria-hidden="true" />}
          <div className="containerNarrow">
            {content.title && <h1 className="Hero-title">{content.title}</h1>}
            {content.subtitle && <div className={classList('Hero-subtitle', closed && 'wch-Hero-message')}>{content.subtitle}</div>}
          </div>
        </div>
      </header>
    );
  }

  /** What the hero shows: the Welcome texts, a tag, or a sample discussion. */
  content(scope: string, scopeId: string, config: HeroConfig, closed: boolean): { title: string; subtitle?: string; color?: string } {
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

    if (closed) {
      const { title, message } = config.text ?? DEFAULT_TEXT;

      return { title: title.trim(), subtitle: message.trim() ? message : undefined };
    }

    // The Welcome message is HTML: the preview only needs its text.
    const message = new DOMParser().parseFromString(app.forum.attribute<string>('welcomeMessage') ?? '', 'text/html').body.textContent ?? '';

    // Like on the forum: an empty core title or message is not shown.
    return { title: app.forum.attribute<string>('welcomeTitle')?.trim() ?? '', subtitle: message.trim() || undefined };
  }

  oncreate(vnode: Mithril.VnodeDOM<HeroPreviewAttrs, this>) {
    super.oncreate(vnode);

    // Scales the rendered width down to the frame, whatever the window size.
    this.observer = new ResizeObserver(() => this.fit());
    this.observer.observe(this.element.querySelector('.wch-Preview-frame')!);

    window.addEventListener('scroll', this.onscroll, { passive: true });
    this.markStuck();
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
