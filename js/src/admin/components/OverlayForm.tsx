import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import type { Corner, GradientStop, LinearGradient, OverlaySection, RadialGradient } from '../../common/types';
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
  // A vignette: clear in the middle, darker on the edges.
  radial: {
    type: 'radial',
    shape: 'ellipse',
    position: 'center',
    stops: [
      { color: '#00000000', at: 0 },
      { color: '#000000b3', at: 100 },
    ],
  },
};

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

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
            options={{ none: t('type_none'), solid: t('type_solid'), gradient: t('type_gradient'), radial: t('type_radial') }}
            onchange={(type: OverlaySection['type']) => onchange(DEFAULTS[type])}
          />
        </div>

        {value.type === 'solid' && (
          <div className="Form-group">
            <label>{t('color_label')}</label>
            <AlphaColorInput value={value.color} label={t('color_label')} onchange={(color: string) => onchange({ ...value, color })} />
          </div>
        )}

        {value.type === 'gradient' && [this.linearDirection(value), this.stops(value)]}
        {value.type === 'radial' && [this.radialShape(value), this.stops(value)]}
      </div>
    );
  }

  linearDirection(value: LinearGradient) {
    const { onchange } = this.attrs;
    const { stops } = value;
    const corner = 'corner' in value ? value.corner : null;

    return (
      <div className="Form-group">
        <label>{t('direction_label')}</label>
        <div className="wch-OverlayForm-angle">
          <Select
            value={corner ?? 'angle'}
            options={{ angle: t('direction_angle'), ...Object.fromEntries(CORNERS.map((c) => [c, t(`from_${c.replace('-', '_')}`)])) }}
            onchange={(choice: 'angle' | Corner) =>
              onchange(choice === 'angle' ? { type: 'gradient', angle: 180, stops } : { type: 'gradient', corner: choice, stops })
            }
          />
          {!corner &&
            'angle' in value && [
              <input
                className="FormControl"
                type="number"
                min="0"
                max="360"
                value={value.angle}
                aria-label={t('angle_label')}
                onchange={(e: Event) => onchange({ type: 'gradient', angle: int(e, 0, 360), stops })}
              />,
              <span>°</span>,
            ]}
        </div>
        <p className="helpText">{corner ? t('corner_help') : t('angle_help')}</p>
      </div>
    );
  }

  radialShape(value: RadialGradient) {
    const { onchange } = this.attrs;

    return (
      <div className="Form-group wch-OverlayForm-radial">
        <label>
          <span>{t('shape_label')}</span>
          <Select
            value={value.shape}
            options={{ ellipse: t('shape_ellipse'), circle: t('shape_circle') }}
            onchange={(shape: RadialGradient['shape']) => onchange({ ...value, shape })}
          />
        </label>
        <label>
          <span>{t('center_label')}</span>
          <Select
            value={value.position}
            options={{ center: t('center_center'), ...Object.fromEntries(CORNERS.map((c) => [c, t(`center_${c.replace('-', '_')}`)])) }}
            onchange={(position: RadialGradient['position']) => onchange({ ...value, position })}
          />
        </label>
      </div>
    );
  }

  stops(value: LinearGradient | RadialGradient) {
    const { onchange } = this.attrs;
    const setStops = (stops: GradientStop[]) => onchange({ ...value, stops });

    return (
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
      </div>
    );
  }
}
