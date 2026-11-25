import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import { backgroundImageAttrs } from '../../common/backgroundImage';
import { CENTER, type BackgroundSection, type ForumPayload, type ImageRef } from '../../common/types';
import BackgroundPositionModal from './BackgroundPositionModal';
import type { HeroPreviewAttrs } from './HeroPreview';
import ImageInput from './ImageInput';

export interface BackgroundFormAttrs extends ComponentAttrs {
  value: BackgroundSection;
  onchange: (value: BackgroundSection) => void;
  /** The config being edited: uploaded images belong to it. */
  target: string;
  /** The image of the level above (`inherit`), with the config it belongs to and its label. */
  inherited: { image: ImageRef; owner: string; label: string } | null;
  /** The edited hero, for the position modal to measure it. */
  preview: Pick<HeroPreviewAttrs, 'configs' | 'target' | 'chain'>;
}

/** Below this width, a background looks blurry on a large screen (the hero spans the whole window). */
const SHARP_WIDTH = 1440;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.background.${key}`, params, true);

export default class BackgroundForm extends Component<BackgroundFormAttrs> {
  view() {
    const { value, target, inherited } = this.attrs;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;
    const own = value.image !== 'inherit' ? value.image : null;
    const shown = value.image === 'inherit' ? inherited && { image: inherited.image, owner: inherited.owner } : own && { image: own, owner: target };

    const thumbnail = shown ? (
      <img alt="" {...backgroundImageAttrs(assetsUrl, shown.owner, shown.image)} sizes="320px" />
    ) : (
      <span>{t('no_image')}</span>
    );

    return (
      <div className="wch-BackgroundForm">
        {/* A shortcut to the position modal. */}
        {shown ? (
          <button type="button" className="wch-BackgroundForm-preview" title={t('position_button')} onclick={() => this.openPosition()}>
            {thumbnail}
          </button>
        ) : (
          <div className="wch-BackgroundForm-preview">{thumbnail}</div>
        )}

        <div className="wch-BackgroundForm-fields">
          {value.image === 'inherit' && inherited && <p className="helpText">{t('inherited_image', { source: inherited.label })}</p>}

          {own && own.width < SHARP_WIDTH && (
            <p className="helpText wch-BackgroundForm-warning">{t('small_image_warning', { width: own.width, recommended: SHARP_WIDTH })}</p>
          )}

          {/* A new image, or none, starts centered: the previous focal point was for another image. */}
          <ImageInput
            kind="background"
            image={shown?.image ?? null}
            target={target}
            onchange={(image: ImageRef | null) => this.update({ image, position: CENTER })}
            actions={
              shown && (
                <Button className="Button" icon="fas fa-crosshairs" onclick={() => this.openPosition()}>
                  {t('position_button')}
                </Button>
              )
            }
          />

          {inherited && value.image !== 'inherit' && (
            <Button className="Button Button--link" icon="fas fa-level-up-alt" onclick={() => this.update({ image: 'inherit', position: CENTER })}>
              {t('use_inherited_button', { source: inherited.label })}
            </Button>
          )}
        </div>
      </div>
    );
  }

  /** The image shown (own or inherited): its focal point, measured on the real hero. */
  openPosition() {
    const { value, target, inherited, preview } = this.attrs;
    const shown =
      value.image === 'inherit'
        ? inherited && { image: inherited.image, owner: inherited.owner }
        : value.image && { image: value.image, owner: target };

    if (!shown) return;

    app.modal.show(BackgroundPositionModal, {
      ...shown,
      position: value.position,
      preview,
      onapply: (position: BackgroundSection['position']) => this.update({ position }),
    });
  }

  update(changes: Partial<BackgroundSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
