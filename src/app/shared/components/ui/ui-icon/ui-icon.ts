import { booleanAttribute, Component, computed, inject, input, isDevMode } from '@angular/core';
import {
  fontAwesomeFamily,
  UI_ICON_BUILTIN_FAMILIES,
  UI_ICON_DEFAULT_FAMILY,
  UI_ICON_FAMILIES,
  UiIconFamily,
  UiIconType,
} from './ui-icon-families';

export type UiIconSize = 'sm' | 'md' | 'default' | 'lg' | 'xl';
export type { UiIconType };

/**
 * ui-icon — renders an icon from a configurable font family.
 *
 * FontAwesome is the built-in default. Register other families (Material Symbols,
 * Bootstrap Icons, a custom font…) with `provideUiIconFamilies()` and pick one per
 * icon via `family`, or change the app-wide default.
 *
 * Accessible: decorative by default (aria-hidden); pass `decorative=false` + `ariaLabel`
 * when the icon conveys meaning on its own.
 */
@Component({
  selector: 'ui-icon',
  templateUrl: './ui-icon.html',
  styleUrl: './ui-icon.scss',
})
export class UiIcon {
  /** Icon name for the selected family (e.g. "circle-user"). */
  name = input.required<string>();
  /** Icon size. */
  size = input<UiIconSize>('default');
  /** Visual variant, interpreted by the family (filled vs outlined). */
  type = input<UiIconType>('solid');
  /** Family key (default: configured default, else "fontawesome"). */
  family = input<string>();
  /** Purely decorative icon (hidden from screen readers). */
  decorative = input(true, { transform: booleanAttribute });
  /** Accessible label (required when not decorative). */
  ariaLabel = input<string>();

  private readonly registered = inject(UI_ICON_FAMILIES, { optional: true });
  private readonly configuredDefault = inject(UI_ICON_DEFAULT_FAMILY, { optional: true });

  /** Built-in families + registered ones (registered win on key clash). */
  private readonly families = computed<Record<string, UiIconFamily>>(() =>
    Object.assign({}, UI_ICON_BUILTIN_FAMILIES, ...(this.registered ?? [])),
  );

  /** @ignore Resolved family, falling back to FontAwesome on unknown key. */
  private readonly resolvedFamily = computed(() => {
    const key = this.family() ?? this.configuredDefault ?? 'fontawesome';
    const family = this.families()[key];
    if (!family && isDevMode()) {
      console.warn(`[ui-icon] Unknown icon family "${key}". Falling back to "fontawesome".`);
    }
    return family ?? fontAwesomeFamily;
  });

  /** @ignore */
  protected readonly classes = computed(
    () => `ui-icon _${this.size()} ${this.resolvedFamily().classes(this.name(), this.type())}`,
  );

  /** @ignore Text content for ligature fonts (null for class-based fonts like FontAwesome). */
  protected readonly content = computed(
    () => this.resolvedFamily().content?.(this.name(), this.type()) ?? null,
  );
}
