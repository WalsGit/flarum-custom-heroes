import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import { backgroundImageAttrs } from '../../common/backgroundImage';
import type { BackgroundSection, ForumPayload, ImageRef } from '../../common/types';
import { targetOf } from '../utils/scopes';
import { maxSizeMb, uploadLimits } from '../utils/uploadLimits';

export interface BackgroundFormAttrs extends ComponentAttrs {
  value: BackgroundSection;
  onchange: (value: BackgroundSection) => void;
  /** The config being edited: uploaded images belong to it. */
  target: string;
}

/** Below this width, a background looks blurry on a large screen (the hero spans the whole window). */
const SHARP_WIDTH = 1440;

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.background.${key}`, params, true);

export default class BackgroundForm extends Component<BackgroundFormAttrs> {
  loading = false;
  url = '';

  view() {
    const { value, target } = this.attrs;
    const assetsUrl = app.forum.attribute<ForumPayload>('walsgitCustomHeroes').assetsUrl;

    return (
      <div className="wch-BackgroundForm">
        <div className="wch-BackgroundForm-preview">
          {value.image ? <img alt="" {...backgroundImageAttrs(assetsUrl, target, value.image)} sizes="320px" /> : <span>{t('no_image')}</span>}
        </div>

        {value.image && value.image.width < SHARP_WIDTH && (
          <p className="helpText wch-BackgroundForm-warning">{t('small_image_warning', { width: value.image.width, recommended: SHARP_WIDTH })}</p>
        )}

        <div className="Form-group">
          <div className="ButtonGroup wch-BackgroundForm-buttons">
            <Button className="Button" icon="fas fa-upload" loading={this.loading} disabled={this.loading} onclick={() => this.pickFile()}>
              {t('upload_button')}
            </Button>
            {value.image && (
              <Button className="Button" icon="fas fa-times" disabled={this.loading} onclick={() => this.update({ image: null })}>
                {t('remove_button')}
              </Button>
            )}
          </div>
          <p className="helpText">{t('upload_help', { size: maxSizeMb() })}</p>
        </div>

        <div className="Form-group">
          <label for="wch-background-url">{t('url_label')}</label>
          <div className="wch-BackgroundForm-url">
            <input
              id="wch-background-url"
              className="FormControl"
              type="url"
              placeholder="https://"
              value={this.url}
              oninput={(e: InputEvent) => (this.url = (e.target as HTMLInputElement).value)}
            />
            <Button className="Button" icon="fas fa-download" disabled={this.loading || !this.url} onclick={() => this.send({ url: this.url })}>
              {t('import_button')}
            </Button>
          </div>
          <p className="helpText">{t('url_help')}</p>
        </div>

        <div className="Form-group">
          <label>{t('position_label')}</label>
          <Select
            value={value.position}
            options={{ center: t('position_center'), top: t('position_top'), bottom: t('position_bottom') }}
            onchange={(position: BackgroundSection['position']) => this.update({ position })}
          />
        </div>
      </div>
    );
  }

  update(changes: Partial<BackgroundSection>) {
    this.attrs.onchange({ ...this.attrs.value, ...changes });
  }

  pickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) return;

      // Checked here too: above PHP's limits, the request would not even reach the extension.
      if (file.size > uploadLimits().maxSize) {
        app.alerts.show({ type: 'error' }, t('too_large', { size: maxSizeMb() }));
        return;
      }

      const body = new FormData();
      body.append('image', file);
      this.send(body);
    };
    input.click();
  }

  send(body: FormData | Record<string, string>) {
    const fields = { kind: 'background', ...targetOf(this.attrs.target) };

    if (body instanceof FormData) {
      Object.entries(fields).forEach(([key, value]) => body.append(key, value));
    } else {
      Object.assign(body, fields);
    }

    this.loading = true;

    app
      .request<ImageRef>({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/walsgit-custom-heroes/images',
        body,
        serialize: body instanceof FormData ? (raw: FormData) => raw : undefined,
      })
      .then((image) => {
        this.url = '';
        this.update({ image });
      })
      // app.request already shows the error to the admin.
      .catch(() => {})
      .finally(() => {
        this.loading = false;
        m.redraw();
      });
  }
}
