import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import { logoImageUrl } from '../../common/backgroundImage';
import { LOGO_HEIGHTS } from '../../common/heroStyle';
import type { ForumPayload, ImageRef, LogoSection } from '../../common/types';
import ImageInput from './ImageInput';

export interface LogoFormAttrs extends ComponentAttrs {
  value: LogoSection;
  onchange: (value: LogoSection) => void;
  /** The config being edited: uploaded images belong to it. */
  target: string;
}

/** Length validated by the server. */
const MAX_ALT = 100;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.logo.${key}`, params, true);

export default class LogoForm extends Component<LogoFormAttrs> {
  view() {
    const { value, target } = this.attrs;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;

    return (
      <div className="wch-LogoForm">
        <div className="wch-BackgroundForm-preview wch-LogoForm-preview">
          {value.image ? <img alt="" src={logoImageUrl(assetsUrl, target, value.image)} /> : <span>{t('no_logo')}</span>}
        </div>

        <ImageInput kind="logo" image={value.image} target={target} onchange={(image: ImageRef | null) => this.update({ image })} />
        <div className="Form-group">
          <p className="helpText">{t('image_help')}</p>
        </div>

        <div className="Form-group">
          <label>{t('side_label')}</label>
          <Select
            value={value.side}
            options={{ left: t('side_left'), right: t('side_right'), above: t('side_above'), title: t('side_title') }}
            onchange={(side: LogoSection['side']) => this.update({ side })}
          />
          <p className="helpText">{t('side_help')}</p>
        </div>

        <div className="Form-group">
          <label>{t('size_label')}</label>
          <Select
            value={value.size}
            options={Object.fromEntries((['s', 'm', 'l'] as const).map((size) => [size, t(`size_${size}`, { height: LOGO_HEIGHTS[size] })]))}
            onchange={(size: LogoSection['size']) => this.update({ size })}
          />
        </div>

        <div className="Form-group">
          <label for="wch-logo-alt">{t('alt_label')}</label>
          <input
            id="wch-logo-alt"
            className="FormControl"
            maxlength={MAX_ALT}
            value={value.alt}
            oninput={(e: InputEvent) => this.update({ alt: (e.target as HTMLInputElement).value })}
          />
          <p className="helpText">{t(value.side === 'title' ? 'alt_title_help' : 'alt_help')}</p>
        </div>

        <Switch state={value.hideOnMobile} onchange={(hideOnMobile: boolean) => this.update({ hideOnMobile })}>
          {t('hide_on_mobile_label')}
        </Switch>
      </div>
    );
  }

  update(changes: Partial<LogoSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }
}
