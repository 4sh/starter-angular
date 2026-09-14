/**
 * TestBed spec for `ui-image`'s `secured` source: the fetch goes through
 * `HttpClient` (so interceptors authenticate it), the response `Blob` is shown
 * from an object URL, and **that URL is revoked** — on source change and on
 * destroy. The revocation is the point: a list of secured images that never
 * revokes leaks one blob per render for the life of the document.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UiImage } from './ui-image';

@Component({
  imports: [UiImage],
  template: `
    <ui-image
      [src]="src()"
      secured
      alt="Justificatif"
      [width]="80"
      [height]="80"
      (loadFailed)="failed.set($event)"
    />
  `,
})
class Host {
  readonly src = signal('/api/documents/1');
  readonly failed = signal<string | null>(null);
}

describe('ui-image (secured)', () => {
  let fixture: ComponentFixture<Host>;
  let http: HttpTestingController;
  let created: string[];
  let revoked: string[];

  const img = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img');

  /** Answer the pending GET for `url` with a one-pixel payload. */
  const respond = async (url: string) => {
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['x'], { type: 'image/png' }));
    // `httpResource` publishes its value on a microtask, after the flush.
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    created = [];
    revoked = [];
    let seq = 0;
    // jsdom implements neither: they are the whole contract under test, so they
    // are recorded rather than mocked away.
    Object.assign(URL, {
      createObjectURL: (_blob: Blob) => {
        const url = `blob:test/${++seq}`;
        created.push(url);
        return url;
      },
      revokeObjectURL: (url: string) => void revoked.push(url),
    });

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  it('fetches through HttpClient and shows the blob from an object URL', async () => {
    await respond('/api/documents/1');

    expect(created).toEqual(['blob:test/1']);
    expect(img()!.getAttribute('src')).toBe('blob:test/1');
    // `blob:` never reaches NgOptimizedImage, which refuses it.
    expect(img()!.hasAttribute('ng-img')).toBe(false);
    http.verify();
  });

  it('shows the loading indicator while the fetch is in flight', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('ui-spinner')).not.toBeNull();
    expect(host.querySelector('img')).toBeNull();

    await respond('/api/documents/1');
    expect(host.querySelector('ui-spinner')).toBeNull();
  });

  it('revokes the previous object URL when the source changes', async () => {
    await respond('/api/documents/1');
    expect(revoked).toEqual([]);

    fixture.componentInstance.src.set('/api/documents/2');
    fixture.detectChanges();
    await respond('/api/documents/2');

    expect(created).toEqual(['blob:test/1', 'blob:test/2']);
    expect(revoked).toEqual(['blob:test/1']);
    expect(img()!.getAttribute('src')).toBe('blob:test/2');
    http.verify();
  });

  it('revokes the object URL when the component is destroyed', async () => {
    await respond('/api/documents/1');
    fixture.destroy();
    expect(revoked).toEqual(['blob:test/1']);
  });

  it('falls back to the placeholder and reports the failed URL on an HTTP error', async () => {
    http
      .expectOne('/api/documents/1')
      .flush(new Blob(['nope']), { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.ui-image-placeholder')).not.toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect(created).toEqual([]);
    // A failed fetch never reaches an `<img>`, so only the component can report it.
    expect(fixture.componentInstance.failed()).toBe('/api/documents/1');
    http.verify();
  });
});
