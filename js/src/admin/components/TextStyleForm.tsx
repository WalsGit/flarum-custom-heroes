import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import type { TextStyleSection } from '../../common/types';
import AlphaColorInput from './AlphaColorInput';

export interface TextStyleFormAttrs extends ComponentAttrs {
  value: TextStyleSection;
  onchange: (value: TextStyleSection) => void;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.text_style.${key}`, params, true);

/** Options of a select, from their values: `{ s: t('size_s'), … }`. */
const options = (values: readonly string[], prefix: string) => Object.fromEntries(values.map((value) => [value, t(`${prefix}_${value}`)]));

export default class TextStyleForm extends Component<TextStyleFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;
    const select = <K extends keyof TextStyleSection>(key: K, label: string, values: readonly string[], prefix: string, help?: string) => (
      <div className="Form-group">
        <label>{t(label)}</label>
        <Select
          value={value[key]}
          options={options(values, prefix)}
          onchange={(choice: TextStyleSection[K]) => onchange({ ...value, [key]: choice })}
        />
        {help && <p className="helpText">{help}</p>}
      </div>
    );

    return (
      <div className="wch-TextStyleForm">
        {select('align', 'align_label', ['left', 'center', 'right'], 'align')}
        {select('vAlign', 'v_align_label', ['top', 'middle', 'bottom'], 'v_align', t('v_align_help'))}
        {select('titleSize', 'title_size_label', ['s', 'm', 'l', 'xl'], 'size')}
        {select('subtitleSize', 'subtitle_size_label', ['s', 'm', 'l'], 'size')}

        <Switch state={value.color === null} onchange={(auto: boolean) => onchange({ ...value, color: auto ? null : '#ffffffff' })}>
          {t('auto_color_label')}
        </Switch>
        <div className="Form-group">
          {value.color !== null && (
            <AlphaColorInput value={value.color} label={t('color_label')} onchange={(color: string) => onchange({ ...value, color })} />
          )}
          <p className="helpText">{t('color_help')}</p>
        </div>
      </div>
    );
  }
}
