import Component, { type ComponentAttrs } from 'flarum/common/Component';
import app from 'flarum/admin/app';
import { joinColor, splitColor } from '../utils/color';

export interface AlphaColorInputAttrs extends ComponentAttrs {
  value: string;
  onchange: (value: string) => void;
  label: string;
}

/** A color with its opacity, as `#rrggbbaa`. */
export default class AlphaColorInput extends Component<AlphaColorInputAttrs> {
  view() {
    const { value, onchange, label } = this.attrs;
    const { rgb, opacity } = splitColor(value);

    return (
      <div className="wch-AlphaColor">
        <input
          type="color"
          className="wch-AlphaColor-color"
          value={rgb}
          aria-label={label}
          oninput={(e: InputEvent) => onchange(joinColor((e.target as HTMLInputElement).value, opacity))}
        />
        <input
          type="range"
          className="wch-AlphaColor-opacity"
          min="0"
          max="100"
          value={opacity}
          aria-label={app.translator.trans('walsgit-custom-heroes.admin.overlay.opacity_label', { label }, true)}
          oninput={(e: InputEvent) => onchange(joinColor(rgb, Number((e.target as HTMLInputElement).value)))}
        />
        <span className="wch-AlphaColor-value">{opacity}%</span>
      </div>
    );
  }
}
