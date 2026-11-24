import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import Modal, { type IInternalModalAttrs } from 'flarum/common/components/Modal';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';
import { backgroundImageAttrs } from '../../common/backgroundImage';
import { CENTER, type FocalPoint, type ForumPayload, type ImageRef } from '../../common/types';
import { DEVICE_WIDTHS, visibleArea, type Device } from '../utils/visibleArea';
import { previewHero, type HeroPreviewAttrs } from './HeroPreview';

export interface BackgroundPositionModalAttrs extends IInternalModalAttrs {
  image: ImageRef;
  /** The config the image file belongs to. */
  owner: string;
  position: FocalPoint;
  /** The edited hero, rendered out of sight to measure its real height on each device. */
  preview: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>;
  onapply: (position: FocalPoint) => void;
}

const DEVICES: Device[] = ['desktop', 'tablet', 'mobile'];
const DEVICE_ICONS: Record<Device, string> = { desktop: 'fas fa-desktop', tablet: 'fas fa-tablet-alt', mobile: 'fas fa-mobile-alt' };

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.background.${key}`, params, true);

const percent = (value: number) => Math.round(Math.min(100, Math.max(0, value)));

/**
 * Places the focal point of a background image, by pointer (mouse, touch,
 * pen) or with two number fields. A frame shows the part of the image the
 * chosen device shows.
 */
export default class BackgroundPositionModal extends Modal<BackgroundPositionModalAttrs> {
  point: FocalPoint = CENTER;
  device: Device = 'desktop';
  /** The measured hero heights: they depend on its text, logo and buttons, not only on its height setting. */
  heights: Partial<Record<Device, number>> = {};

  oninit(vnode: Mithril.Vnode<BackgroundPositionModalAttrs, this>) {
    super.oninit(vnode);
    this.point = { ...this.attrs.position };
  }

  oncreate(vnode: Mithril.VnodeDOM<BackgroundPositionModalAttrs, this>) {
    super.oncreate(vnode);
    this.measure();
  }

  onupdate(vnode: Mithril.VnodeDOM<BackgroundPositionModalAttrs, this>) {
    super.onupdate(vnode);
    this.measure();
  }

  className() {
    return 'wch-PositionModal Modal--large';
  }

  title() {
    return t('position_title');
  }

  content() {
    const { image, owner, preview } = this.attrs;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;
    const height = this.heights[this.device];
    const area = height ? visibleArea(image, { width: DEVICE_WIDTHS[this.device], height }, this.point) : null;
    const cropsWidth = this.cropsWidth();
    const axes = cropsWidth.length ? (['x', 'y'] as const) : (['y'] as const);
    const pct = (value: number) => `${value * 100}%`;

    return (
      <div className="Modal-body">
        <p className="helpText">{t('position_help')}</p>

        <div className="ButtonGroup wch-PositionModal-devices">
          {DEVICES.map((device) => (
            <Button
              className={classList('Button', this.device === device && 'active')}
              icon={DEVICE_ICONS[device]}
              aria-pressed={this.device === device}
              onclick={() => (this.device = device)}
            >
              {app.translator.trans(`walsgit-custom-heroes.admin.preview.${device}`)}
            </Button>
          ))}
        </div>

        <div className="wch-FocalPicker">
          <div
            className="wch-FocalPicker-image"
            onpointerdown={(e: PointerEvent) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              this.pick(e);
            }}
            onpointermove={(e: PointerEvent) => (e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId) && this.pick(e)}
          >
            <img alt="" draggable={false} {...backgroundImageAttrs(assetsUrl, owner, image)} sizes="(max-width: 900px) 100vw, 860px" />
            {area && (
              <div
                className="wch-FocalPicker-frame"
                style={{ left: pct(area.left), top: pct(area.top), width: pct(area.width), height: pct(area.height) }}
              />
            )}
            <div className="wch-FocalPicker-marker" style={{ left: `${this.point.x}%`, top: `${this.point.y}%` }} />
          </div>
        </div>
        <p className="helpText wch-PositionModal-note">{t('position_note')}</p>

        <div className="wch-FocalPicker-fields">
          {axes.map((axis) => (
            <div className="Form-group">
              <label for={`wch-focal-${axis}`}>{t(`position_${axis}_label`)}</label>
              <input
                id={`wch-focal-${axis}`}
                className="FormControl"
                type="number"
                min="0"
                max="100"
                step="1"
                value={this.point[axis]}
                oninput={(e: InputEvent) => {
                  const value = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!isNaN(value)) this.point = { ...this.point, [axis]: percent(value) };
                }}
              />
            </div>
          ))}
          <Button
            className="Button"
            icon="fas fa-crosshairs"
            onclick={() => (this.point = cropsWidth.length ? { ...CENTER } : { ...this.point, y: CENTER.y })}
          >
            {t(cropsWidth.length ? 'position_center_button' : 'position_center_y_button')}
          </Button>
        </div>

        {cropsWidth.length > 0 && (
          <p className="helpText wch-PositionModal-xHelp">
            {t('position_x_help', {
              devices: cropsWidth.map((device) => app.translator.trans(`walsgit-custom-heroes.admin.preview.${device}`, {}, true)).join(', '),
            })}
          </p>
        )}

        <div className="wch-PositionModal-controls">
          <Button className="Button Button--primary" onclick={() => this.apply()}>
            {t('position_apply_button')}
          </Button>
          <Button className="Button" onclick={() => this.hide()}>
            {t('position_cancel_button')}
          </Button>
        </div>

        {/* The hero at the real width of each device, like the preview (home: with Flarum's welcome text). */}
        <div className="wch-PositionModal-measure" aria-hidden="true" inert>
          {DEVICES.map((device) => (
            <div className="wch-Preview-viewport" data-device={device} style={{ width: `${DEVICE_WIDTHS[device]}px` }}>
              {previewHero(preview, false)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  measure() {
    let changed = false;

    for (const device of DEVICES) {
      const height = this.element.querySelector<HTMLElement>(`.wch-PositionModal-measure [data-device="${device}"]`)?.offsetHeight;

      if (height && height !== this.heights[device]) {
        this.heights[device] = height;
        changed = true;
      }
    }

    if (changed) m.redraw();
  }

  pick(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    const y = percent(((e.clientY - rect.top) / rect.height) * 100);

    // Without a device that crops the width, the horizontal position changes nothing: it stays as it is.
    this.point = { x: this.cropsWidth().length ? percent(((e.clientX - rect.left) / rect.width) * 100) : this.point.x, y };
  }

  /** The devices that crop the width of the image (a hero taller, in proportion, than the image). */
  cropsWidth(): Device[] {
    return DEVICES.filter((device) => {
      const height = this.heights[device];

      return !!height && visibleArea(this.attrs.image, { width: DEVICE_WIDTHS[device], height }, this.point).width < 0.999;
    });
  }

  apply() {
    this.attrs.onapply(this.point);
    this.hide();
  }
}
