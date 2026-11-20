import Extend from 'flarum/common/extenders';
import commonExtend from '../common/extend';
import HeroesPage from './components/HeroesPage';

export default [...commonExtend, new Extend.Admin().page(HeroesPage)];
