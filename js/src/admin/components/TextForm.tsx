import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Select from 'flarum/common/components/Select';
import type { TextSection } from '../../common/types';

export interface TextFormAttrs extends ComponentAttrs {
  value: TextSection;
  onchange: (value: TextSection) => void;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.text.${key}`, params, true);

/** Lengths validated by the server. */
const MAX_TITLE = 100;
const MAX_MESSAGE = 500;

/** The Welcome texts of the core, as plain text: a starting point for a custom text. */
function coreText(): TextSection & { source: 'custom' } {
  const message = new DOMParser().parseFromString(app.forum.attribute<string>('welcomeMessage') ?? '', 'text/html').body.textContent ?? '';

  return {
    source: 'custom',
    title: (app.forum.attribute<string>('welcomeTitle') ?? '').trim().slice(0, MAX_TITLE),
    message: message.trim().slice(0, MAX_MESSAGE),
  };
}

export default class TextForm extends Component<TextFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;

    return (
      <div className="wch-TextForm">
        <div className="Form-group">
          <label>{t('source_label')}</label>
          <Select
            value={value.source}
            options={{ core: t('source_core'), custom: t('source_custom') }}
            onchange={(source: TextSection['source']) => onchange(source === 'custom' ? coreText() : { source: 'core' })}
          />
          <p className="helpText">{t('source_help')}</p>
        </div>

        {value.source === 'custom' && [
          <div className="Form-group">
            <label>{t('title_label')}</label>
            <input
              className="FormControl"
              maxlength={MAX_TITLE}
              value={value.title}
              oninput={(e: InputEvent) => onchange({ ...value, title: (e.target as HTMLInputElement).value })}
            />
          </div>,
          <div className="Form-group">
            <label>{t('message_label')}</label>
            <textarea
              className="FormControl"
              rows={4}
              maxlength={MAX_MESSAGE}
              value={value.message}
              oninput={(e: InputEvent) => onchange({ ...value, message: (e.target as HTMLTextAreaElement).value })}
            />
            <p className="helpText">{t('message_help')}</p>
          </div>,
        ]}
      </div>
    );
  }
}
