import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import type { MobileBehavior, Placement } from '../../common/types';

export type PlacementChanges = { placement?: Placement; mobile?: MobileBehavior };

export interface PlacementFieldsAttrs extends ComponentAttrs {
  placement: Placement;
  mobile: MobileBehavior;
  /** A corner already used by the other section (buttons or icons), in the config the hero will use. */
  taken: Placement | null;
  onchange: (changes: PlacementChanges) => void;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.placement.${key}`, params, true);

/** Where buttons or icons go, and what they do on mobile. */
export default class PlacementFields extends Component<PlacementFieldsAttrs> {
  view() {
    const { placement, mobile, taken, onchange } = this.attrs;

    return [
      <div className="Form-group">
        <label>{t('label')}</label>
        <Select
          value={placement}
          options={Object.fromEntries(
            (['below-text', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((value) => [
              value,
              // Below the text can be shared: buttons first, then icons.
              { label: t(value.replace('-', '_')), disabled: value !== 'below-text' && value === taken },
            ])
          )}
          onchange={(value: Placement) => onchange({ placement: value })}
        />
        <p className="helpText">{t('help')}</p>
      </div>,
      <div className="Form-group">
        <label>{t('mobile_label')}</label>
        <Select
          value={placement === 'below-text' && mobile === 'below-text' ? 'same' : mobile}
          options={{
            same: t('mobile_same'),
            // Already below the text.
            ...(placement === 'below-text' ? {} : { 'below-text': t('mobile_below_text') }),
            hide: t('mobile_hide'),
          }}
          onchange={(value: MobileBehavior) => onchange({ mobile: value })}
        />
      </div>,
    ];
  }
}
