import app from 'flarum/forum/app';

export { default as extend } from './extend';

app.initializers.add('walsgit-custom-heroes', () => {
  console.log('[walsgit/flarum-custom-heroes] Hello, forum!');
});
