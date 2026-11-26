import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import classList from 'flarum/common/utils/classList';
import type { TextStyleSection } from '../../common/types';
import AlphaColorInput from './AlphaColorInput';

export interface TextStyleFormAttrs extends ComponentAttrs {
  value: TextStyleSection;
  onchange: (value: TextStyleSection) => void;
  /** Heroes without a description (discussions): no description size. */
  noSubtitle?: boolean;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.text_style.${key}`, params, true);

/** Options of a select, from their values: `{ s: t('size_s'), … }`. */
const options = (values: readonly string[], prefix: string) => Object.fromEntries(values.map((value) => [value, t(`${prefix}_${value}`)]));

/** Icons of the alignment and position buttons. */
const ICONS: Record<string, string> = {
  left: 'fas fa-align-left',
  center: 'fas fa-align-center',
  right: 'fas fa-align-right',
  top: 'fas fa-arrow-up',
  middle: 'fas fa-arrows-up-down',
  bottom: 'fas fa-arrow-down',
};

export default class TextStyleForm extends Component<TextStyleFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;
    const select = <K extends 'titleSize' | 'subtitleSize'>(key: K, label: string, values: readonly string[]) => (
      <div className="Form-group">
        <label for={`wch-textStyle-${key}`}>{t(label)}</label>
        <Select
          id={`wch-textStyle-${key}`}
          value={value[key]}
          options={options(values, 'size')}
          onchange={(choice: TextStyleSection[K]) => onchange({ ...value, [key]: choice })}
        />
      </div>
    );
    // Three buttons rather than a list: quicker, and the icons say what they do.
    const choices = <K extends 'align' | 'vAlign'>(key: K, label: string, values: readonly TextStyleSection[K][], prefix: string, help?: string) => (
      <div className="Form-group">
        <label>{t(label)}</label>
        <div className="ButtonGroup wch-ChoiceButtons" role="group" aria-label={t(label)}>
          {values.map((choice) => (
            <Button
              className={classList('Button', value[key] === choice && 'active')}
              icon={ICONS[choice]}
              aria-pressed={value[key] === choice}
              onclick={() => onchange({ ...value, [key]: choice })}
            >
              {t(`${prefix}_${choice}`)}
            </Button>
          ))}
        </div>
        {help && <p className="helpText">{help}</p>}
      </div>
    );

    return (
      <div className="wch-TextStyleForm">
        <div className="wch-TextStyleForm-grid">
          {choices('align', 'align_label', ['left', 'center', 'right'], 'align')}
          {choices('vAlign', 'v_align_label', ['top', 'middle', 'bottom'], 'v_align', t('v_align_help'))}
          {select('titleSize', 'title_size_label', ['s', 'm', 'l', 'xl'])}
          {!this.attrs.noSubtitle && select('subtitleSize', 'subtitle_size_label', ['s', 'm', 'l'])}
        </div>

        <Switch state={value.color === null} onchange={(auto: boolean) => onchange({ ...value, color: auto ? null : '#ffffffff' })}>
          {t('auto_color_label')}
        </Switch>
        <div className="Form-group">
          {value.color !== null && (
            <AlphaColorInput value={value.color} label={t('color_label')} legends onchange={(color: string) => onchange({ ...value, color })} />
          )}
          <p className="helpText">{t('color_help')}</p>
        </div>
      </div>
    );
  }
}
