import Component, { type ComponentAttrs } from 'flarum/common/Component';
import type { MobileBehavior, Placement } from '../../common/types';
export type PlacementChanges = {
    placement?: Placement;
    mobile?: MobileBehavior;
};
export interface PlacementFieldsAttrs extends ComponentAttrs {
    placement: Placement;
    mobile: MobileBehavior;
    /** A corner already used by the other section (buttons or icons), in the config the hero will use. */
    taken: Placement | null;
    /** No placement below the text (fof/polls puts its own buttons there). */
    noBelowText?: boolean;
    onchange: (changes: PlacementChanges) => void;
}
/** Where buttons or icons go, and what they do on mobile. */
export default class PlacementFields extends Component<PlacementFieldsAttrs> {
    view(): JSX.Element[];
}
