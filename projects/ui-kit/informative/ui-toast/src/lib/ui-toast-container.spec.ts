import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UiToastContainer } from './ui-toast-container';
import { UiToastService } from './ui-toast.service';

@Component({
  imports: [UiToastContainer],
  template: `<ui-toast-container [stackVisibleLimit]="1" [life]="1000" [motionDisabled]="true" />`,
})
class Host {}

async function setup() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  const service = TestBed.inject(UiToastService);
  fixture.detectChanges();
  const titles = (): string[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.ui-toast-title') as NodeListOf<HTMLElement>,
    ).map((t) => t.textContent?.trim() ?? '');
  const advance = (ms: number) => {
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
  };
  return { fixture, service, titles, advance };
}

describe('ui-toast-container queue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows a queued message once a slot frees, with its full life', async () => {
    const { fixture, service, titles, advance } = await setup();

    service.add({ title: 'Premier' });
    service.add({ title: 'Second' });
    fixture.detectChanges();
    expect(titles()).toEqual(['Second']);

    advance(1000);
    expect(titles()).toEqual(['Premier']);

    advance(999);
    expect(titles()).toEqual(['Premier']);

    advance(1);
    expect(titles()).toEqual([]);
  });
});
