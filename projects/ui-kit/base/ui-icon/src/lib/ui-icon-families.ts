import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';

/** Visual variant of an icon, interpreted by each family (filled vs outlined). */
export type UiIconType = 'solid' | 'outline';

/**
 * Describes how an icon font family turns a name + variant into markup, so
 * ui-icon can render any font (FontAwesome, Material Symbols, Bootstrap Icons…).
 */
export interface UiIconFamily {
  /** CSS classes applied to the `<i>`. */
  classes: (name: string, type: UiIconType) => string;
  /** Text content of the `<i>` — ligature fonts (e.g. Material Symbols) put the name here. */
  content?: (name: string, type: UiIconType) => string | null;
}

/** Built-in FontAwesome Free family (the default). */
export const fontAwesomeFamily: UiIconFamily = {
  classes: (name, type) => `${type === 'outline' ? 'fa-regular' : 'fa-solid'} fa-${name}`,
};

/** Families always available, keyed by name. Registered families are merged on top. */
export const UI_ICON_BUILTIN_FAMILIES: Record<string, UiIconFamily> = {
  fontawesome: fontAwesomeFamily,
};

/** Registered icon families (multi provider). Merged over the built-ins. */
export const UI_ICON_FAMILIES = new InjectionToken<Record<string, UiIconFamily>[]>('UI_ICON_FAMILIES');

/** Family key used when a `ui-icon` does not set `family`. */
export const UI_ICON_DEFAULT_FAMILY = new InjectionToken<string>('UI_ICON_DEFAULT_FAMILY');

export function provideUiIconFamilies(
  families: Record<string, UiIconFamily>,
  options?: { default?: string },
): EnvironmentProviders {
  const providers: Provider[] = [{ provide: UI_ICON_FAMILIES, useValue: families, multi: true }];
  if (options?.default) {
    providers.push({ provide: UI_ICON_DEFAULT_FAMILY, useValue: options.default });
  }
  return makeEnvironmentProviders(providers);
}
