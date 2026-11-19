import app from 'flarum/admin/app';

export { default as extend } from './extend';

app.initializers.add('walsgit-custom-heroes', () => {
  // The admin page comes in a later step.
});
