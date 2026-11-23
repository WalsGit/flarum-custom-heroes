import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import { backgroundImageAttrs } from '../../common/backgroundImage';
import type { BackgroundSection, ForumPayload, ImageRef } from '../../common/types';
import ImageInput from './ImageInput';

export interface BackgroundFormAttrs extends ComponentAttrs {
  value: BackgroundSection;
  onchange: (value: BackgroundSection) => void;
  /** The config being edited: uploaded images belong to it. */
  target: string;
}

/** Below this width, a background looks blurry on a large screen (the hero spans the whole window). */
const SHARP_WIDTH = 1440;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.background.${key}`, params, true);

export default class BackgroundForm extends Component<BackgroundFormAttrs> {
  view() {
    const { value, target } = this.attrs;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;

    return (
      <div className="wch-BackgroundForm">
        <div className="wch-BackgroundForm-preview">
          {value.image ? <img alt="" {...backgroundImageAttrs(assetsUrl, target, value.image)} sizes="320px" /> : <span>{t('no_image')}</span>}
        </div>

        {value.image && value.image.width < SHARP_WIDTH && (
          <p className="helpText wch-BackgroundForm-warning">{t('small_image_warning', { width: value.image.width, recommended: SHARP_WIDTH })}</p>
        )}

        <ImageInput kind="background" image={value.image} target={target} onchange={(image: ImageRef | null) => this.update({ image })} />

        <div className="Form-group">
          <label>{t('position_label')}</label>
          <Select
            value={value.position}
            options={{ center: t('position_center'), top: t('position_top'), bottom: t('position_bottom') }}
            onchange={(position: BackgroundSection['position']) => this.update({ position })}
          />
        </div>
      </div>
    );
  }

  update(changes: Partial<BackgroundSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
