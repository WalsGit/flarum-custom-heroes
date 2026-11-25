import Component, { type ComponentAttrs } from 'flarum/common/Component';
import app from 'flarum/admin/app';
import type Mithril from 'mithril';
import { joinColor, splitColor } from '../utils/color';

export interface AlphaColorInputAttrs extends ComponentAttrs {
  value: string;
  onchange: (value: string) => void;
  label: string;
  /** Shows what each control sets ("Color", "Opacity") above it. */
  legends?: boolean;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.overlay.${key}`, params, true);

/** A color with its opacity, as `#rrggbbaa`. */
export default class AlphaColorInput extends Component<AlphaColorInputAttrs> {
  view() {
    const { value, onchange, label, legends } = this.attrs;
    const { rgb, opacity } = splitColor(value);
    const color = (
      <input
        type="color"
        className="wch-AlphaColor-color"
        value={rgb}
        aria-label={label}
        oninput={(e: InputEvent) => onchange(joinColor((e.target as HTMLInputElement).value, opacity))}
      />
    );
    const alpha = (
      <div className="wch-AlphaColor-alpha">
        <input
          type="range"
          className="wch-AlphaColor-opacity"
          min="0"
          max="100"
          value={opacity}
          aria-label={t('opacity_label', { label })}
          oninput={(e: InputEvent) => onchange(joinColor(rgb, Number((e.target as HTMLInputElement).value)))}
        />
        <span className="wch-AlphaColor-value">{opacity}%</span>
      </div>
    );

    return legends ? (
      <div className="wch-AlphaColor">
        {legend(t('legend_color'), color)}
        {legend(t('legend_opacity'), alpha)}
      </div>
    ) : (
      <div className="wch-AlphaColor">
        {color}
        {alpha}
      </div>
    );
  }
}

/** A small caption above a control, saying what it sets. */
export function legend(text: string, control: Mithril.Children) {
  return (
    <div className="wch-Legend">
      {/* Visual only: the controls carry their own labels. */}
      <span className="wch-Legend-text" aria-hidden="true">
        {text}
      </span>
      {control}
    </div>
  );
}
