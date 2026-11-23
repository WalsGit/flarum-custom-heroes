import app from 'flarum/forum/app';
import extendHero from './extendHero';
import extendWelcomeHero from './extendWelcomeHero';

export { default as extend } from './extend';

app.initializers.add('walsgit-custom-heroes', () => {
  extendHero();
  extendWelcomeHero();
});
