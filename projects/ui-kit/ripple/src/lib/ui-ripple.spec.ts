/**
 * Activation contract of the ripple: which element receives the wave, and when
 * none is produced at all.
 *
 * jsdom has no layout, so every host that must ripple gets a stubbed
 * `getBoundingClientRect` (the engine bails on a zero-sized box), and the press
 * is a `MouseEvent` carrying `isPrimary` rather than a `PointerEvent` (absent
 * from jsdom).
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideUiRipple, UiRipple, UiRippleScope } from './ui-ripple';

@Component({
  imports: [UiRipple, UiRippleScope],
  template: `
    <button class="targeted" [uiRipple]="targetedOn()">Ciblé</button>

    <div class="scope" [uiRippleScope]="scopeOn()">
      <button class="inside">Délégué</button>
      <button class="inside-disabled" disabled>Désactivé</button>
      <button class="inside-own" uiRipple>Directive interne</button>
      <div class="opted-out" data-ripple="off">
        <button class="inside-opted-out">Exclu</button>
      </div>
      <span class="plain">Non interactif</span>
    </div>
  `,
})
class Host {
  readonly targetedOn = signal(true);
  readonly scopeOn = signal(true);
}

function box(el: HTMLElement, width = 120, height = 40): void {
  el.getBoundingClientRect = () =>
    ({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height }) as DOMRect;
}

function press(el: HTMLElement, clientX = 30, clientY = 20): void {
  const event = new MouseEvent('pointerdown', { bubbles: true, clientX, clientY, button: 0 });
  Object.defineProperty(event, 'isPrimary', { value: true });
  el.dispatchEvent(event);
}

/** Waves alive on an element, `null` when it never got a layer. */
function inks(el: HTMLElement): number | null {
  const layer = el.querySelector(':scope > .ui-ripple-layer');
  return layer ? layer.childElementCount : null;
}

describe('Ripple activation', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;
  const at = <T extends HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`missing ${selector}`);
    box(el);
    return el;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  it('[uiRipple] adds an aria-hidden layer and one wave, sized on the farthest corner', () => {
    const target = at('.targeted');
    press(target, 30, 20);

    const layer = target.querySelector(':scope > .ui-ripple-layer');
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(inks(target)).toBe(1);

    // farthest corner from (30, 20) in a 120x40 box: hypot(90, 20)
    const ink = layer?.firstElementChild as HTMLElement;
    const radius = Math.hypot(90, 20);
    expect(ink.style.width).toBe(`${radius * 2}px`);
    expect(ink.style.left).toBe(`${30 - radius}px`);
  });

  it('[uiRippleScope] ripples the pressed descendant, never the container', () => {
    const scope = at('.scope');
    const inside = at('.inside');
    press(inside);

    expect(inks(inside)).toBe(1);
    expect(inks(scope)).toBeNull();
  });

  it('leaves a non-interactive descendant alone until it is marked', () => {
    const plain = at('.plain');
    press(plain);
    expect(inks(plain)).toBeNull();

    plain.dataset['ripple'] = 'on';
    press(plain);
    expect(inks(plain)).toBe(1);
  });

  it('produces a single wave when a scope and a directive overlap', () => {
    const scope = at('.scope');
    const own = at('.inside-own');
    press(own);

    expect(inks(own)).toBe(1);
    expect(inks(scope)).toBeNull();
  });

  it('skips a disabled control and a `data-ripple="off"` subtree', () => {
    at('.scope');
    press(at('.inside-disabled'));
    press(at('.inside-opted-out'));

    expect(inks(at('.inside-disabled'))).toBeNull();
    expect(inks(at('.inside-opted-out'))).toBeNull();
  });

  it('opts out through the inputs, and marks the subtree for the outer scopes', async () => {
    fixture.componentInstance.targetedOn.set(false);
    fixture.componentInstance.scopeOn.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const target = at('.targeted');
    const inside = at('.inside');
    press(target);
    press(inside);

    expect(target.getAttribute('data-ripple')).toBe('off');
    expect(at('.scope').getAttribute('data-ripple')).toBe('off');
    expect(inks(target)).toBeNull();
    expect(inks(inside)).toBeNull();
  });

  it('produces nothing under the kit-wide `data-motion="off"` switch', () => {
    document.documentElement.dataset['motion'] = 'off';
    const target = at('.targeted');
    press(target);
    delete document.documentElement.dataset['motion'];

    expect(inks(target)).toBeNull();
  });
});

@Component({
  template: `
    <button class="anywhere">Sans directive</button>
    <div data-ripple="off"><button class="excluded">Exclu</button></div>
  `,
})
class Plain {}

describe('Ripple, global activation', () => {
  async function setup(options?: Parameters<typeof provideUiRipple>[0]): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [Plain], providers: [provideUiRipple(options)] });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(Plain);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('provideUiRipple() ripples a button that carries no directive at all', async () => {
    const root = await setup();
    const button = root.querySelector<HTMLElement>('.anywhere');
    if (!button) throw new Error('missing button');
    box(button);
    press(button);

    expect(inks(button)).toBe(1);
  });

  it('still honours `data-ripple="off"` on an ancestor', async () => {
    const root = await setup();
    const button = root.querySelector<HTMLElement>('.excluded');
    if (!button) throw new Error('missing button');
    box(button);
    press(button);

    expect(inks(button)).toBeNull();
  });

  it('registers the options without activating anything when `global` is false', async () => {
    const root = await setup({ global: false });
    const button = root.querySelector<HTMLElement>('.anywhere');
    if (!button) throw new Error('missing button');
    box(button);
    press(button);

    expect(inks(button)).toBeNull();
  });
});
