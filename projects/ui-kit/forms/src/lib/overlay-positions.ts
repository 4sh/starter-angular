import { ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Standard dropdown-panel anchoring shared by the overlay form fields
 * (`ui-select`, `ui-autocomplete`, `ui-input-tags`, `ui-datepicker`):
 * below the field, flipped above when `autoFlip`, flipped horizontally
 * (right-aligned) whenever there isn't enough room on the right.
 */
export function dropdownOverlayPositions(autoFlip: boolean): ConnectedPosition[] {
  const belowStart: ConnectedPosition = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 8,
  };
  const belowEnd: ConnectedPosition = {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 8,
  };
  const aboveStart: ConnectedPosition = {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -8,
  };
  const aboveEnd: ConnectedPosition = {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -8,
  };
  return autoFlip ? [belowStart, belowEnd, aboveStart, aboveEnd] : [belowStart, belowEnd];
}
