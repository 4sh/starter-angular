import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

/**
 * Manages light/dark mode via the `[data-theme]` attribute on <html>,
 * aligned with the generated tokens (semantics: modeLight → :root, modeDark → [data-theme='dark']).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  readonly currentMode = signal<ThemeMode>(this.getStoredMode());

  constructor() {
    effect(() => {
      const mode = this.currentMode();
      const root = this.document.documentElement;

      if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme-mode', mode);
      }
    });
  }

  toggle() {
    this.currentMode.update(mode => (mode === 'light' ? 'dark' : 'light'));
  }

  get isDark(): boolean {
    return this.currentMode() === 'dark';
  }

  private getStoredMode(): ThemeMode {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || 'light';
    }
    return 'light';
  }
}
