import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import classList from 'flarum/common/utils/classList';
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

/** Logos are stored at most this high (`HeroImages::LOGO_MAX_HEIGHT`): a logo this high may have been reduced. */
const STORED_MAX_HEIGHT = 256;

/** Icons of the position buttons. */
const SIDE_ICONS = { left: 'fas fa-arrow-left', right: 'fas fa-arrow-right', above: 'fas fa-arrow-up', title: 'fas fa-heading' } as const;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.logo.${key}`, params, true);

export default class LogoForm extends Component<LogoFormAttrs> {
  view() {
    const { value, target } = this.attrs;
    // A discussion title is never replaced: "instead of the title" is shown there as "above".
    const discussion = target === 'discussion';
    const side = discussion && value.side === 'title' ? 'above' : value.side;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;

    return (
      <div className="wch-LogoForm">
        {/* Laid out like the background: thumbnail beside the image fields. */}
        <div className="wch-BackgroundForm">
          <div className="wch-LogoForm-thumb">
            <div className="wch-BackgroundForm-preview wch-LogoForm-preview">
              {value.image ? <img alt="" src={logoImageUrl(assetsUrl, target, value.image)} /> : <span>{t('no_logo')}</span>}
            </div>
            {value.image && (
              <p className="helpText">
                {t(value.image.height >= STORED_MAX_HEIGHT ? 'image_size_max' : 'image_size', {
                  width: value.image.width,
                  height: value.image.height,
                })}
              </p>
            )}
          </div>

          <div className="wch-BackgroundForm-fields">
            <ImageInput
              kind="logo"
              image={value.image}
              target={target}
              help={t('image_help')}
              onchange={(image: ImageRef | null) => this.update({ image })}
            />
          </div>
        </div>

        <div className="wch-LogoForm-layout">
          <div className="Form-group">
            <label>{t('side_label')}</label>
            {/* Buttons rather than a list, like the text alignment. */}
            <div className="ButtonGroup wch-ChoiceButtons">
              {(discussion ? (['left', 'right', 'above'] as const) : (['left', 'right', 'above', 'title'] as const)).map((choice) => (
                <Button
                  className={classList('Button', side === choice && 'active')}
                  icon={SIDE_ICONS[choice]}
                  aria-pressed={side === choice}
                  onclick={() => this.update({ side: choice })}
                >
                  {t(`side_${choice}`)}
                </Button>
              ))}
            </div>
            <p className="helpText">{t(discussion ? 'side_help_discussion' : 'side_help')}</p>
          </div>

          <div className="Form-group">
            <label>{t('size_label')}</label>
            <Select
              value={value.size}
              options={Object.fromEntries((['s', 'm', 'l'] as const).map((size) => [size, t(`size_${size}`, { height: LOGO_HEIGHTS[size] })]))}
              onchange={(size: LogoSection['size']) => this.update({ size })}
            />
            <p className="helpText">{t('size_help')}</p>
          </div>
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
          <p className="helpText">{t(side === 'title' ? 'alt_title_help' : 'alt_help')}</p>
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
