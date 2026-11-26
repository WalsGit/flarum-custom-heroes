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

/** "23 / 100": the length limits are not visible otherwise. */
const count = (text: string, max: number) => <p className="helpText wch-TextForm-count">{t('count', { count: text.length, max })}</p>;

export default class TextForm extends Component<TextFormAttrs> {
  view() {
    const { value, onchange } = this.attrs;

    return (
      <div className="wch-TextForm">
        <div className="Form-group">
          <label for="wch-text-afterClose">{t('after_close_label')}</label>
          <Select
            id="wch-text-afterClose"
            value={value.afterClose}
            options={{ hero: t('after_close_hero'), none: t('after_close_none') }}
            onchange={(afterClose: TextSection['afterClose']) => onchange({ ...value, afterClose })}
          />
        </div>

        {value.afterClose === 'hero' && [
          <div className="Form-group">
            <label for="wch-text-title">{t('title_label')}</label>
            <input
              id="wch-text-title"
              className="FormControl"
              maxlength={MAX_TITLE}
              value={value.title}
              oninput={(e: InputEvent) => onchange({ ...value, title: (e.target as HTMLInputElement).value })}
            />
            {count(value.title, MAX_TITLE)}
          </div>,
          <div className="Form-group">
            <label for="wch-text-message">{t('message_label')}</label>
            <textarea
              id="wch-text-message"
              className="FormControl"
              rows={3}
              maxlength={MAX_MESSAGE}
              value={value.message}
              oninput={(e: InputEvent) => onchange({ ...value, message: (e.target as HTMLTextAreaElement).value })}
            />
            {count(value.message, MAX_MESSAGE)}
            <p className="helpText">{t('message_help')}</p>
          </div>,
        ]}
      </div>
    );
  }
}
