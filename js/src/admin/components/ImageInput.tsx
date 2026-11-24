import app from 'flarum/admin/app';
import Component, { type ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import type Mithril from 'mithril';
import type { ImageRef } from '../../common/types';
import { targetOf } from '../utils/scopes';
import { maxSizeMb, uploadLimits } from '../utils/uploadLimits';

export interface ImageInputAttrs extends ComponentAttrs {
  kind: 'background' | 'logo';
  image: ImageRef | null;
  onchange: (image: ImageRef | null) => void;
  /** The config being edited: uploaded images belong to it. */
  target: string;
  /** More buttons, at the end of the row. */
  actions?: Mithril.Children;
}

const t = (key: string, params = {}) => app.translator.trans(`walsgit-custom-heroes.admin.image.${key}`, params, true);

/** Upload, URL import and removal of a hero image. */
export default class ImageInput extends Component<ImageInputAttrs> {
  loading = false;
  url = '';

  view() {
    const { image, kind } = this.attrs;
    const urlId = `wch-${kind}-url`;

    return (
      <div className="wch-ImageInput">
        <div className="Form-group">
          <div className="ButtonGroup wch-ImageInput-buttons">
            <Button className="Button" icon="fas fa-upload" loading={this.loading} disabled={this.loading} onclick={() => this.pickFile()}>
              {t('upload_button')}
            </Button>
            {image && (
              <Button className="Button" icon="fas fa-times" disabled={this.loading} onclick={() => this.attrs.onchange(null)}>
                {t('remove_button')}
              </Button>
            )}
            {this.attrs.actions}
          </div>
          <p className="helpText">{t('upload_help', { size: maxSizeMb() })}</p>
        </div>

        <div className="Form-group">
          <label for={urlId}>{t('url_label')}</label>
          <div className="wch-ImageInput-url">
            <input
              id={urlId}
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
      </div>
    );
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
    const fields = { kind: this.attrs.kind, ...targetOf(this.attrs.target) };

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
        this.attrs.onchange(image);
      })
      // app.request already shows the error to the admin.
      .catch(() => {})
      .finally(() => {
        this.loading = false;
        m.redraw();
      });
  }
}
