import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Icon from 'flarum/common/components/Icon';
import Select from 'flarum/common/components/Select';
import isExtensionEnabled from 'flarum/admin/utils/isExtensionEnabled';
import textContrastClass from 'flarum/common/helpers/textContrastClass';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { decorateContent, heroDecoration } from '../../common/heroDecoration';
import { resolveConfig, tagParentId } from '../../common/resolveConfig';
import { DEFAULT_TEXT, type ForumPayload, type HeroConfig, type HeroConfigs } from '../../common/types';
import { tagOrder, targetOf } from '../utils/scopes';
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
  /** Discussions: the tag the sample discussion is in (preview only, not stored). */
  sampleTag: string | null = null;
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
          {targetOf(this.attrs.target).scope === 'discussion' && this.sampleTagSelect()}
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
        {targetOf(this.attrs.target).scope === 'discussion' && isExtensionEnabled('flarum-tags') && (
          <p className="helpText wch-Preview-note">
            <Icon name="fas fa-info-circle" /> {t('discussion_note')}
          </p>
        )}
      </div>
    );
  }

  hero() {
    return previewHero(this.attrs, this.closed, this.sampleTag);
  }

  /** Every tag in Flarum's order, children indented: to see the hero with each tag's color. */
  sampleTagSelect() {
    const ids = isExtensionEnabled('flarum-tags') ? orderedTags().map((tag) => tag.id) : [];

    if (!ids.length) return null;

    const options = Object.fromEntries(
      ids.map((id) => {
        const tag = app.store.getById('tags', id)!;

        // Prefixed: numeric keys would be sorted by number, not in Flarum's order.
        return [`tag:${id}`, (tagParentId(tag) ? '\u00a0\u00a0└\u00a0' : '') + (tag.attribute('name') as string)];
      })
    );

    return (
      <label className="wch-Preview-sampleTag">
        {t('sample_tag')}
        <Select value={`tag:${this.sampleTag ?? ids[0]}`} options={options} onchange={(key: string) => (this.sampleTag = key.slice(4))} />
      </label>
    );
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
export function previewHero(
  { configs, target, chain }: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>,
  closed: boolean,
  sampleTag: string | null = null
) {
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

  if (scope === 'discussion') return discussionHero(config, decoration, sampleTag);

  const children = [
    closable && <i className="Hero-close fas fa-times" aria-hidden="true" />,
    <div className="containerNarrow">
      {content.title && (
        <h1 className="Hero-title">
          {content.icon && <i className={content.icon} aria-hidden="true" />} {content.title}
        </h1>
      )}
      {/* Like the core: kept even when empty. */}
      {/* null: hidden (tag description switched off). */}
      {content.subtitle !== null && (content.subtitle || content.title) && (
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

/** The tags of the forum in Flarum's order: primary tags by position, each followed by its children, then secondary tags. */
function orderedTags() {
  const info = app.store.all('tags').map((tag) => ({
    id: tag.id()!,
    name: tag.attribute('name') as string,
    position: tag.attribute('position') as number | null,
    parentId: tagParentId(tag),
  }));

  return tagOrder(info).map((id) => info.find((tag) => tag.id === id)!);
}

/**
 * The tags of the sample discussion, like flarum/tags shows them: the chosen
 * tag (by default the first one), after its parent. The first one's color is
 * the hero's.
 */
function sampleTags(id: string | null): { name: string; color: string }[] {
  const tags = orderedTags();
  const tag = tags.find((each) => each.id === id) ?? tags[0];

  if (!tag) return [{ name: t('tag_title'), color: '' }];

  const parent = tags.find((each) => each.id === tag.parentId);

  return [parent, tag]
    .filter((each) => !!each)
    .map((each) => ({ name: each!.name, color: (app.store.getById('tags', each!.id)?.attribute('color') as string) || '' }));
}

/** A discussion hero, with Flarum's markup (sample tags, then the title), so that the forum styles apply. */
function discussionHero(config: HeroConfig, decoration: ReturnType<typeof heroDecoration>, sampleTag: string | null) {
  const tagged = isExtensionEnabled('flarum-tags');
  const sample = tagged ? sampleTags(sampleTag) : [];
  const tags = config.discussionTags === 'hidden' ? [] : sample;
  // flarum/tags colors the hero with its first tag.
  const color = config.tagColor === false ? '' : sample[0]?.color ?? '';

  const children = [
    <ul className="DiscussionHero-items">
      {tags.length > 0 && (
        <li className="item-tags">
          <span className="TagsLabel">
            {tags.map((tag) => (
              <span
                className={classList('TagLabel', tag.color && ['colored', textContrastClass(tag.color)])}
                style={tag.color ? { '--tag-bg': tag.color } : {}}
              >
                <span className="TagLabel-text">
                  <span className="TagLabel-name">{tag.name}</span>
                </span>
              </span>
            ))}
          </span>
        </li>
      )}
      <li className="item-title">
        <h1 className="DiscussionHero-title">{t('discussion_title')}</h1>
      </li>
    </ul>,
  ];

  const decorated = decoration ? decorateContent(children, decoration) : { content: children, corners: [] };

  return (
    <header
      className={classList(
        'Hero DiscussionHero wch-PreviewHero',
        tagged && 'wch-PreviewHero--tagged',
        color && ['DiscussionHero--colored', textContrastClass(color)],
        decoration?.className
      )}
      style={{ ...(color ? { '--hero-bg': color } : {}), ...decoration?.style }}
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
): { title: string; subtitle?: string | null; color?: string; icon?: string } {
  if (scope === 'tag') {
    const tag = scopeId ? app.store.getById('tags', scopeId) : null;

    return tag
      ? {
          title: tag.attribute('name') as string,
          subtitle: config.tagDescription === false ? null : (tag.attribute('description') as string) || undefined,
          color: (tag.attribute('color') as string) || undefined,
          // Like Flarum: only when the tag has one.
          icon: config.tagIcon === false ? undefined : (tag.attribute('icon') as string) || undefined,
        }
      : {
          title: t('tag_title'),
          subtitle: config.tagDescription === false ? null : t('tag_subtitle'),
          icon: config.tagIcon === false ? undefined : 'fas fa-tag',
        };
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
