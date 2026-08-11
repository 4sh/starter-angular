import { Component, computed, input } from '@angular/core';

/** Visual shape of the placeholder. */
export type UiSkeletonShape = 'text' | 'circle' | 'rectangle';
/** Size preset (per-shape default dimensions). */
export type UiSkeletonSize = 'default' | 'small';
/** Loading animation style. */
export type UiSkeletonAnimation = 'wave' | 'pulse' | 'none';

/**
 * ui-skeleton — a placeholder shown in place of content while it loads.
 *
 * Renders a single token-colored box whose shape and dimensions come from
 * design tokens. Three shapes (`text`, `circle`, `rectangle`) ship with
 * sensible default sizes; `width` / `height` / `borderRadius` override any of
 * them with a raw CSS value for bespoke layouts (cards, grids, lists, tables).
 *
 * The background color is exposed through the `--ui-skeleton-background` custom
 * property (and the sweeping reflection tint through `--ui-skeleton-shine`) for
 * one-off theming.
 *
 * Accessible: the host is `aria-hidden` so screen readers skip it (loading is a
 * purely visual state); group several skeletons under a container carrying
 * `aria-busy="true"` to announce the loading region. Motion honours the OS
 * reduced-motion preference and the kit-wide `data-motion="off"` switch.
 */
@Component({
  selector: 'ui-skeleton',
  templateUrl: './ui-skeleton.html',
  styleUrl: './ui-skeleton.scss',
  host: {
    '[attr.aria-hidden]': 'true',
  },
})
export class UiSkeleton {
  /** Shape of the placeholder. */
  shape = input<UiSkeletonShape>('text');
  /** Size preset (per-shape default dimensions). */
  size = input<UiSkeletonSize>('default');
  /** Raw CSS width, overriding the shape default (e.g. "100%", "10rem"). */
  width = input<string>();
  /** Raw CSS height, overriding the shape default (e.g. "1rem", "50px"). */
  height = input<string>();
  /** Raw CSS border-radius, overriding the shape default. */
  borderRadius = input<string>();
  /** Loading animation (base is `wave` — a reflection sweeping across the box). */
  animation = input<UiSkeletonAnimation>('wave');

  /** @ignore Inline style overrides (win over the token-driven defaults). */
  protected readonly boxStyle = computed(() => ({
    width: this.width() ?? null,
    height: this.height() ?? null,
    'border-radius': this.borderRadius() ?? null,
  }));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-skeleton', `_${this.shape()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    const anim = this.animation();
    if (anim === 'pulse') c.push('_pulse');
    else if (anim === 'none') c.push('_static');
    return c.join(' ');
  });
}
