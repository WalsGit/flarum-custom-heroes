import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import type { GradientStop, OverlaySection } from '../../common/types';
import AlphaColorInput from './AlphaColorInput';

export interface OverlayFormAttrs extends ComponentAttrs {
  value: OverlaySection;
  onchange: (value: OverlaySection) => void;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.overlay.${key}`, params, true);

/** What a type starts with when the admin picks it. */
const DEFAULTS: Record<OverlaySection['type'], OverlaySection> = {
  none: { type: 'none' },
  solid: { type: 'solid', color: '#00000080' },
  gradient: {
    type: 'gradient',
    angle: 180,
    stops: [
      { color: '#000000b3', at: 0 },
      { color: '#00000033', at: 100 },
    ],
  },
};

const int = (e: Event, min: number, max: number) => Math.min(max, Math.max(min, parseInt((e.target as HTMLInputElement).value, 10) || 0));

/** Adds a color halfway between the last two, so that the gradient does not change at first. */
function withStopAdded(stops: GradientStop[]): GradientStop[] {
  const last = stops[stops.length - 1];
  const before = stops[stops.length - 2];

  return [...stops.slice(0, -1), { color: before.color, at: Math.round((before.at + last.at) / 2) }, last];
}

export default class OverlayForm extends Component<OverlayFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;

    return (
      <div className="wch-OverlayForm">
        <div className="Form-group">
          <label>{t('type_label')}</label>
          <Select
            value={value.type}
            options={{ none: t('type_none'), solid: t('type_solid'), gradient: t('type_gradient') }}
            onchange={(type: OverlaySection['type']) => onchange(DEFAULTS[type])}
          />
        </div>

        {value.type === 'solid' && (
          <div className="Form-group">
            <label>{t('color_label')}</label>
            <AlphaColorInput value={value.color} label={t('color_label')} onchange={(color: string) => onchange({ ...value, color })} />
          </div>
        )}

        {value.type === 'gradient' && this.gradient(value)}
      </div>
    );
  }

  gradient(value: Extract<OverlaySection, { type: 'gradient' }>) {
    const { onchange } = this.attrs;
    const setStops = (stops: GradientStop[]) => onchange({ ...value, stops });

    return [
      <div className="Form-group">
        <label for="wch-overlay-angle">{t('angle_label')}</label>
        <div className="wch-OverlayForm-angle">
          <input
            id="wch-overlay-angle"
            className="FormControl"
            type="number"
            min="0"
            max="360"
            value={value.angle}
            onchange={(e: Event) => onchange({ ...value, angle: int(e, 0, 360) })}
          />
          <span>°</span>
        </div>
        <p className="helpText">{t('angle_help')}</p>
      </div>,
      <div className="Form-group">
        <label>{t('stops_label')}</label>
        {value.stops.map((stop, index) => (
          <div className="wch-OverlayForm-stop" key={index}>
            <AlphaColorInput
              value={stop.color}
              label={t('stop_label', { number: index + 1 })}
              onchange={(color: string) => setStops(value.stops.map((s, i) => (i === index ? { ...s, color } : s)))}
            />
            <input
              className="FormControl wch-OverlayForm-at"
              type="number"
              min="0"
              max="100"
              value={stop.at}
              aria-label={t('stop_position_label', { number: index + 1 })}
              onchange={(e: Event) => setStops(value.stops.map((s, i) => (i === index ? { ...s, at: int(e, 0, 100) } : s)))}
            />
            <span>%</span>
            <Button
              className="Button Button--icon Button--link"
              icon="fas fa-times"
              aria-label={t('remove_stop_button')}
              disabled={value.stops.length <= 2}
              onclick={() => setStops(value.stops.filter((_, i) => i !== index))}
            />
          </div>
        ))}
        {value.stops.length < 4 && (
          <Button className="Button" icon="fas fa-plus" onclick={() => setStops(withStopAdded(value.stops))}>
            {t('add_stop_button')}
          </Button>
        )}
        <p className="helpText">{t('stops_help')}</p>
      </div>,
    ];
  }
}
