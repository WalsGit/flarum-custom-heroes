import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { CornersGradient, LinearGradient, OverlaySection, RadialGradient } from '../../common/types';
export interface OverlayFormAttrs extends ComponentAttrs {
    value: OverlaySection;
    onchange: (value: OverlaySection) => void;
}
export default class OverlayForm extends Component<OverlayFormAttrs> {
    view(): JSX.Element;
    linearDirection(value: LinearGradient): JSX.Element;
    radialShape(value: RadialGradient): JSX.Element;
    /** The four colors, laid out like the corners they start from. */
    corners(value: CornersGradient): JSX.Element;
    stops(value: LinearGradient | RadialGradient): JSX.Element;
}
