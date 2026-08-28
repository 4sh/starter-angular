import { booleanAttribute, Component, input } from '@angular/core';
import { UiRipple, UiRippleScope } from '@4sh/ui-kit/ripple';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

/**
 * Interactive harness for the ripple (Storybook only). Shows the two local
 * activation levels side by side: `[uiRipple]` on one element, `[uiRippleScope]`
 * on a container whose interactive descendants ripple without a directive.
 * @ignore
 */
@Component({
  selector: 'ui-ripple-demo',
  imports: [UiRipple, UiRippleScope, UiButton],
  template: `
    <div class="ripple-demo" [class._custom]="custom()">
      <button
        type="button"
        class="ripple-demo-tile"
        [uiRipple]="!disabled()"
        [rippleCentered]="centered()"
      >
        Élément ciblé
        <small>[uiRipple]</small>
      </button>

      <div class="ripple-demo-group" [uiRippleScope]="!disabled()" [rippleCentered]="centered()">
        <ui-button label="Enregistrer" icon="check" />
        <ui-button label="Annuler" level="low" variant="outlined" />
        <div class="ripple-demo-tile _plain" data-ripple="on">
          Zone marquée
          <small>data-ripple="on"</small>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ripple-demo {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        gap: var(--units-lg);
      }
      /* Custom : la même onde, retaillée par les seuls hooks CSS. */
      .ripple-demo._custom {
        --ui-ripple-color: var(--actions-warning-surface-default);
        --ui-ripple-opacity: 0.5;
        --ui-ripple-duration: 620ms;
        --ui-ripple-scale: 1.15;
      }
      .ripple-demo-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--units-2xs);
        min-width: 180px;
        padding: var(--units-xl);
        border: var(--stroke-sm) solid var(--global-border-default);
        border-radius: var(--radius-md);
        background-color: var(--global-background-muted);
        color: var(--global-text-default);
        font-family: var(--fontfamily-base);
        font-weight: var(--weight-bold);
        cursor: pointer;
      }
      .ripple-demo-tile small {
        color: var(--global-text-muted);
        font-weight: var(--weight-regular);
        font-size: var(--size-typography-text-sm);
      }
      .ripple-demo-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--units-md);
        padding: var(--units-lg);
        border: var(--stroke-sm) dashed var(--global-border-default);
        border-radius: var(--radius-md);
      }
    `,
  ],
})
export class UiRippleDemo {
  /** Retunes the wave through the `--ui-ripple-*` hooks (Custom story). */
  custom = input(false, { transform: booleanAttribute });
  /** Starts the wave at the centre instead of the pointer. */
  centered = input(false, { transform: booleanAttribute });
  /** Turns the effect off on both blocks. */
  disabled = input(false, { transform: booleanAttribute });
}
