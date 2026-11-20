import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import { HEIGHT_PRESETS } from '../../common/heroStyle';
import type { HeightSection } from '../../common/types';

export interface HeightFormAttrs extends ComponentAttrs {
  value: HeightSection;
  onchange: (value: HeightSection) => void;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.height.${key}`, params, true);

/** Bounds of custom heights, as validated by the server. */
const BOUNDS = { desktop: 800, tablet: 800, mobile: 600 } as const;
const MIN = 80;

export default class HeightForm extends Component<HeightFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;
    const preset = (size: keyof typeof HEIGHT_PRESETS) => t(`preset_${size}`, HEIGHT_PRESETS[size]);

    return (
      <div className="wch-HeightForm">
        <div className="Form-group">
          <label>{t('preset_label')}</label>
          <Select
            value={value.preset}
            options={{ auto: t('preset_auto'), s: preset('s'), m: preset('m'), l: preset('l'), custom: t('preset_custom') }}
            onchange={(choice: HeightSection['preset']) =>
              onchange(choice === 'custom' ? { preset: 'custom', ...HEIGHT_PRESETS.m } : ({ preset: choice } as HeightSection))
            }
          />
          <p className="helpText">{t('preset_help')}</p>
        </div>

        {value.preset === 'custom' && (
          <div className="Form-group wch-HeightForm-custom">
            {(['desktop', 'tablet', 'mobile'] as const).map((breakpoint) => (
              <label>
                <span>{t(`${breakpoint}_label`)}</span>
                <span className="wch-HeightForm-input">
                  <input
                    className="FormControl"
                    type="number"
                    min={MIN}
                    max={BOUNDS[breakpoint]}
                    value={value[breakpoint]}
                    onchange={(e: Event) => {
                      const px = parseInt((e.target as HTMLInputElement).value, 10) || MIN;
                      onchange({ ...value, [breakpoint]: Math.min(BOUNDS[breakpoint], Math.max(MIN, px)) });
                    }}
                  />
                  <span>px</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }
}
