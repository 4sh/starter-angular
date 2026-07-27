import {
  booleanAttribute,
  Component,
  computed,
  effect,
  input,
  isDevMode,
  model,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';

export type ChipSize = 'default' | 'small';

/**
 * ui-chip — compact, interactive entity token.
 *
 * A close relative of `ui-tag`, but interactive: it can carry a leading icon or
 * image (avatar-like), an optional remove action, and arbitrary projected content.
 * Typical uses: selected values in a multi-select, filter/entity chips, keyword lists.
 *
 * Categorised by `level` × `subLevel` (informative color families) and fully
 * token-driven. Interactive states (hover/focus on the remove action) are handled in
 * CSS via the same `informative.*` tokens — never through Angular props.
 *
 * Accessible: `label` is exposed as the default `aria-label` (overridable via
 * `ariaLabel` / `ariaLabelledBy`); the remove action is a native `<button>`, focusable
 * with Tab and removable with Enter/Space (native) plus Backspace/Delete.
 */
@Component({
  selector: 'ui-chip',
  imports: [UiIcon, NgTemplateOutlet],
  templateUrl: './ui-chip.html',
  styleUrl: './ui-chip.scss',
})
export class UiChip {
  /** Text content of the chip. */
  label = input<string>();
  /** Color family. */
  level = input<UiFeedbackLevel>('default');
  /** Intensity: high (solid) or low (subtle). Chips default to the discreet `low`. */
  subLevel = input<UiSubLevel>('low');
  /** Size. */
  size = input<ChipSize>('default');
  /** FontAwesome name of the leading icon (ignored when `image` is set). */
  icon = input<string>();
  /** Leading image source (avatar-like). Takes priority over `icon`. */
  image = input<string>();
  /** Alternative text for the image (leave empty for a decorative image next to a label). */
  alt = input<string>();
  /** Pill shape when true (default); rounded-rectangle when false. */
  rounded = input(true, { transform: booleanAttribute });
  /** Displays a remove action at the end of the chip. */
  removable = input(false, { transform: booleanAttribute });
  /** FontAwesome name of the remove icon. */
  removeIcon = input<string>('xmark');
  /** Disables the chip (the remove action / selection becomes non-interactive). */
  disabled = input(false, { transform: booleanAttribute });
  /**
   * Turns the whole chip into a selectable toggle (choice/filter chip). The root
   * becomes a native `<button aria-pressed>`; clicking toggles `selected`.
   * Mutually exclusive with `removable` (nesting interactive elements is invalid).
   */
  selectable = input(false, { transform: booleanAttribute });
  /** Two-way selection state (only meaningful when `selectable`). */
  selected = model(false);
  /** FontAwesome name shown in the leading slot while selected (selectable mode). */
  selectedIcon = input<string>('check');
  /** Explicit accessible name (overrides the `label` default). */
  ariaLabel = input<string>();
  /** Id of the element labelling the chip (overrides `ariaLabel`/`label`). */
  ariaLabelledBy = input<string>();
  /** Accessible name of the remove action. */
  removeAriaLabel = input<string>('Supprimer');
  /**
   * `tabindex` of the remove action. Leave unset for the natural tab order;
   * set `-1` when the chip lives inside a roving-focus container (e.g.
   * `ui-input-tags`) so the button is not a separate tab stop.
   */
  removeTabindex = input<number>();

  /** Emitted when the chip is removed (click or keyboard on the remove action). */
  remove = output<Event>();
  /** Emitted when a selectable chip is toggled (click or keyboard on the chip). */
  chipClick = output<Event>();
  /** Emitted when the image fails to load (the chip then falls back to icon/label). */
  imageError = output<Event>();

  /** @ignore Set once the current image source failed to load. */
  private readonly imageFailed = signal(false);

  constructor() {
    // Reset the load-error flag whenever the source changes.
    effect(() => {
      this.image();
      this.imageFailed.set(false);
    });

    // A11y safeguard: a chip with only a visual (icon/image) needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.isVisualOnly() && !this.accessibleName()) {
          console.warn(
            '[ui-chip] Chip sans texte : renseignez `label`, `ariaLabel` ou `ariaLabelledBy`.',
          );
        }
      });

      // `selectable` and `removable` can't coexist (nested interactive elements).
      effect(() => {
        if (this.selectable() && this.removable()) {
          console.warn(
            '[ui-chip] `selectable` et `removable` sont exclusifs : l’action de suppression est ignorée.',
          );
        }
      });
    }
  }

  /** @ignore There is a textual label. */
  protected readonly hasLabel = computed(() => !!this.label()?.length);

  /** @ignore The leading image is shown (source set and not failed). */
  protected readonly showImage = computed(() => !!this.image() && !this.imageFailed());

  /** @ignore Selectable + selected: the leading slot shows the selected icon. */
  protected readonly showSelectedIcon = computed(
    () => this.selectable() && this.selected() && !!this.selectedIcon(),
  );

  /** @ignore The leading image is shown (not overridden by the selected icon). */
  protected readonly showLeadingImage = computed(() => !this.showSelectedIcon() && this.showImage());

  /** @ignore The leading font icon is shown (no image / selected icon taking its place). */
  protected readonly showIcon = computed(() => !this.showImage() && !!this.icon());

  /** @ignore The leading font icon is shown (not overridden by the selected icon). */
  protected readonly showLeadingIcon = computed(() => !this.showSelectedIcon() && this.showIcon());

  /** @ignore The remove action is rendered (never inside a selectable button). */
  protected readonly showRemove = computed(() => this.removable() && !this.selectable());

  /** @ignore A visual (icon/image) with no textual label. */
  protected readonly isVisualOnly = computed(
    () => (this.showImage() || this.showIcon()) && !this.hasLabel(),
  );

  /** @ignore Resolved accessible name from the explicit label / ariaLabel. */
  protected readonly accessibleName = computed<string | null>(
    () => this.ariaLabel() ?? this.label() ?? null,
  );

  /** @ignore Root `aria-label`: explicit name, suppressed when `ariaLabelledBy` wins. */
  protected readonly rootAriaLabel = computed<string | null>(() =>
    this.ariaLabelledBy() ? null : this.accessibleName(),
  );

  /** @ignore Leading icon size derived from the chip size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore Remove icon is compact regardless of chip size. */
  protected readonly removeIconSize: UiIconSize = 'sm';

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-chip', `_${this.level()}`, `_${this.subLevel()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (!this.rounded()) c.push('_square');
    if (this.showRemove()) c.push('_removable');
    if (this.disabled()) c.push('_disabled');
    if (this.selectable()) c.push('_selectable');
    if (this.selectable() && this.selected()) c.push('_selected');
    return c.join(' ');
  });

  /** @ignore */
  protected onImageError(event: Event): void {
    this.imageFailed.set(true);
    this.imageError.emit(event);
  }

  /** @ignore */
  protected onRemove(event: Event): void {
    if (this.disabled()) return;
    this.remove.emit(event);
  }

  /** @ignore Backspace/Delete on the remove button also removes (Enter/Space are native). */
  protected onRemoveKeydown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.onRemove(event);
    }
  }

  /** @ignore Toggle the selection (selectable mode). Enter/Space fire this via native click. */
  protected onToggle(event: Event): void {
    if (this.disabled()) return;
    this.selected.set(!this.selected());
    this.chipClick.emit(event);
  }
}
