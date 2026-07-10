import { Component, computed, input, signal } from '@angular/core';
import { UiMotion, UiMotionPreset } from './ui-motion';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

/**
 * Interactive harness for the motion presets (Storybook only). Renders a toggle
 * button and a box that enters/leaves with the chosen preset, so the enter AND
 * leave animations can be observed on demand.
 * @ignore
 */
@Component({
  selector: 'ui-motion-demo',
  imports: [UiMotion, UiButton],
  template: `
    <div class="motion-demo">
      <ui-button
        [label]="visible() ? 'Masquer' : 'Afficher'"
        size="small"
        level="low"
        [icon]="visible() ? 'eye-slash' : 'eye'"
        (buttonClick)="toggle()"
      />

      <div class="motion-demo-stage">
        @if (visible()) {
          <div
            class="motion-demo-box"
            [uiMotion]="preset()"
            #m="uiMotion"
            [motionDuration]="duration() || null"
            [motionDisabled]="disabled()"
            [animate.enter]="m.enter()"
            [animate.leave]="m.leave()"
          >
            <span class="motion-demo-box-inner">{{ preset() }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .motion-demo {
        display: flex;
        flex-direction: column;
        gap: var(--units-md);
        align-items: flex-start;
      }
      .motion-demo-stage {
        display: flex;
        align-items: flex-start;
        min-height: 96px;
      }
      .motion-demo-box {
        border-radius: var(--radius-md);
        background-color: var(--actions-high-surface-default);
        color: var(--actions-high-content-default);
        box-shadow: var(--shadow-default-md);
      }
      .motion-demo-box-inner {
        display: block;
        padding: var(--units-lg) var(--units-xl);
        font-family: var(--fontfamily-base);
        font-weight: var(--weight-bold);
      }
    `,
  ],
})
export class UiMotionDemo {
  /** Preset to demonstrate. */
  preset = input<UiMotionPreset>('fade');
  /** Optional per-instance duration override (e.g. `"400ms"`). */
  duration = input<string>('');
  /** Disable the animation (instant appear/remove). */
  disabled = input<boolean>(false);

  /** @ignore */
  protected readonly visible = signal(true);
  /** @ignore */
  protected readonly _ = computed(() => this.preset());

  /** @ignore */
  protected toggle(): void {
    this.visible.update((v) => !v);
  }
}
