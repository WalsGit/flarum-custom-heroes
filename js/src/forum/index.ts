import app from 'flarum/forum/app';
import extendHero from './extendHero';

export { default as extend } from './extend';

app.initializers.add('walsgit-custom-heroes', () => {
  extendHero();
});
