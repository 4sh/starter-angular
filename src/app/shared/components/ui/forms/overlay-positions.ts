import {ConnectedPosition} from '@angular/cdk/overlay';

/**
 * Standard dropdown-panel anchoring shared by the overlay form fields
 * (`ui-select`, `ui-autocomplete`, `ui-input-tags`, `ui-datepicker`):
 * below the field, flipped above when `autoFlip`.
 */
export function dropdownOverlayPositions(autoFlip: boolean): ConnectedPosition[] {
    const below: ConnectedPosition = {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 8
    };
    const above: ConnectedPosition = {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -8
    };
    return autoFlip ? [below, above] : [below];
}
