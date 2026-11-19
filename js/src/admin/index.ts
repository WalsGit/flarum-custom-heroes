import app from 'flarum/admin/app';

export { default as extend } from './extend';

app.initializers.add('walsgit-custom-heroes', () => {
  console.log('[walsgit/flarum-custom-heroes] Hello, admin!');
});
