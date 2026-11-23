/**
 * TestBed spec for `ui-file-upload` (FSHSP-264): stored files (`initialFiles`) listed with the
 * new ones, `add()` going through the same validation and upload as a selection, the cumulated
 * limit (`maxTotalSize`) and total (`showTotal`), and the row actions (`openable`,
 * `fileActionsTemplate`). Files are non-images, so no object URL is needed under jsdom.
 */
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UiFileUpload } from './ui-file-upload';
import {
  UiStoredFile,
  UiUploadErrorEvent,
  UiUploadFile,
  UiUploadHandlerEvent,
} from './ui-file-upload.model';

@Component({
  imports: [UiFileUpload],
  template: `<ui-file-upload
      ariaLabel="Pièces"
      mode="drag"
      accept=".pdf,.txt"
      [multiple]="true"
      [showControls]="false"
      [customUpload]="true"
      [auto]="true"
      [maxFileSize]="1000"
      [maxTotalSize]="300"
      [showTotal]="true"
      [openable]="true"
      [initialFiles]="initialFiles()"
      [fileActionsTemplate]="actions"
      (uploadHandler)="handled.push($event)"
      (uploadError)="errors.push($event)"
      (fileOpen)="opened.push($event)"
      (removed)="removed.push($event)"
      (filesChange)="changes.push($event)"
    />
    <ng-template #actions let-file>
      <button type="button" class="see">Voir {{ file.name }}</button>
    </ng-template>`,
})
class UploadHost {
  readonly upload = viewChild.required(UiFileUpload);
  readonly initialFiles = signal<UiStoredFile[]>([]);
  readonly handled: UiUploadHandlerEvent[] = [];
  readonly errors: UiUploadErrorEvent[] = [];
  readonly opened: UiUploadFile[] = [];
  readonly removed: UiUploadFile[] = [];
  readonly changes: UiUploadFile[][] = [];
}

/** Single-file uploader with the default toolbar (drag mode), to check what it acts on. */
@Component({
  imports: [UiFileUpload],
  template: `<ui-file-upload
    ariaLabel="Pièce"
    mode="drag"
    [customUpload]="true"
    [initialFiles]="initialFiles()"
    (removed)="removed.push($event)"
  />`,
})
class SingleUploadHost {
  readonly upload = viewChild.required(UiFileUpload);
  readonly initialFiles = signal<UiStoredFile[]>([]);
  readonly removed: UiUploadFile[] = [];
}

const CONTRACT: UiStoredFile = {
  id: 'srv-1',
  name: 'contrat.pdf',
  size: 200,
  type: 'application/pdf',
};

function pdf(name: string, size: number): File {
  return new File(['x'.repeat(size)], name, { type: 'application/pdf' });
}

async function setup(stored: UiStoredFile[] = []) {
  await TestBed.configureTestingModule({ imports: [UploadHost] }).compileComponents();
  const fixture: ComponentFixture<UploadHost> = TestBed.createComponent(UploadHost);
  const host = fixture.componentInstance;
  host.initialFiles.set(stored);
  await flush(fixture);
  return { fixture, host, upload: host.upload() };
}

async function flush(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
}

function query<T extends Element>(fixture: ComponentFixture<unknown>, selector: string): T[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<T>(selector));
}

function rowNames(fixture: ComponentFixture<unknown>): string[] {
  return query(fixture, '.ui-file-upload-list-name').map((el) => el.textContent?.trim() ?? '');
}

describe('UiFileUpload — stored files, add(), total and row actions (FSHSP-264)', () => {
  it('lists the stored files, as completed and without a browser File', async () => {
    const { fixture, upload } = await setup([CONTRACT]);
    expect(rowNames(fixture)).toEqual(['contrat.pdf']);
    expect(upload.files()[0]).toMatchObject({ id: 'srv-1', status: 'completed', progress: 100 });
    expect(upload.files()[0].file).toBeUndefined();
  });

  it('adds a file through add() like a selection: listed, then handed to uploadHandler', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);

    expect(rowNames(fixture)).toEqual(['contrat.pdf', 'photo.pdf']);
    expect(host.handled).toHaveLength(1);
    expect(host.handled[0].files.map((f) => f.name)).toEqual(['photo.pdf']);
    expect(host.handled[0].files[0].file).toBeInstanceOf(File);
  });

  it('validates add() like a selection, refusal messages included', async () => {
    const { fixture, host, upload } = await setup();
    upload.add([new File(['x'], 'image.png', { type: 'image/png' }), pdf('big.pdf', 2000)]);
    await flush(fixture);

    expect(rowNames(fixture)).toEqual([]);
    expect(host.errors.map((e) => e.reason)).toEqual(['type', 'size']);
    expect(query(fixture, '.ui-file-upload-message')).toHaveLength(2);
  });

  it('refuses a file that takes the selection past maxTotalSize, stored files included', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('trop.pdf', 150), pdf('ok.pdf', 80)]);
    await flush(fixture);

    expect(rowNames(fixture)).toEqual(['contrat.pdf', 'ok.pdf']);
    expect(host.errors.map((e) => e.reason)).toEqual(['total-size']);
    expect(host.errors[0].message).toBe('Taille totale dépassée (300 B max) : trop.pdf');
  });

  it('shows the file count and the total size under the list', async () => {
    const { fixture, upload } = await setup([CONTRACT]);
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);

    const total = query(fixture, '.ui-file-upload-total')[0];
    expect(total.textContent?.trim()).toBe('2 fichiers · 250 B');
  });

  it('emits fileOpen when a file name is activated', async () => {
    const { fixture, host } = await setup([CONTRACT]);
    const name = query<HTMLButtonElement>(fixture, 'button.ui-file-upload-list-name')[0];
    expect(name.getAttribute('aria-label')).toBe('Ouvrir contrat.pdf');
    name.click();
    await flush(fixture);

    expect(host.opened.map((f) => f.id)).toEqual(['srv-1']);
  });

  it('renders fileActionsTemplate in each default row', async () => {
    const { fixture } = await setup([CONTRACT]);
    const actions = query(fixture, '.ui-file-upload-list .see');
    expect(actions.map((el) => el.textContent?.trim())).toEqual(['Voir contrat.pdf']);
  });

  it('hands a removed stored file back with its server id', async () => {
    const { fixture, host } = await setup([CONTRACT]);
    query<HTMLButtonElement>(fixture, '.ui-file-upload-list-remove')[0].click();
    await flush(fixture);

    expect(host.removed.map((f) => f.id)).toEqual(['srv-1']);
    expect(rowNames(fixture)).toEqual([]);
  });

  it('keeps the added files when initialFiles is rebuilt with the same content', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);

    host.initialFiles.set([{ ...CONTRACT }]);
    await flush(fixture);
    expect(rowNames(fixture)).toEqual(['contrat.pdf', 'photo.pdf']);
  });

  it('resets the selection to new initialFiles, without emitting filesChange', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);
    host.handled[0].markUploaded(host.handled[0].files[0]);
    await flush(fixture);
    const changesBefore = host.changes.length;

    host.initialFiles.set([CONTRACT, { id: 'srv-2', name: 'photo.pdf', size: 50 }]);
    await flush(fixture);
    expect(upload.files().map((f) => f.id)).toEqual(['srv-1', 'srv-2']);
    expect(host.changes.length).toBe(changesBefore);
  });

  it('keeps a file still uploading when initialFiles arrives', async () => {
    const { fixture, host, upload } = await setup();
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);
    expect(upload.files()[0].status).toBe('uploading');

    host.initialFiles.set([CONTRACT]);
    await flush(fixture);
    expect(rowNames(fixture)).toEqual(['contrat.pdf', 'photo.pdf']);
  });

  it('leaves a failed upload out of maxTotalSize', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('rate.pdf', 90)]);
    await flush(fixture);
    host.handled[0].markError(host.handled[0].files[0]);
    await flush(fixture);

    upload.add([pdf('nouveau.pdf', 90)]);
    await flush(fixture);
    expect(host.errors.map((e) => e.reason)).toEqual(['upload']);
    expect(rowNames(fixture)).toEqual(['contrat.pdf', 'rate.pdf', 'nouveau.pdf']);
  });

  it('clears only the files picked in the browser', async () => {
    const { fixture, host, upload } = await setup([CONTRACT]);
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);

    upload.clear();
    await flush(fixture);
    expect(rowNames(fixture)).toEqual(['contrat.pdf']);
    expect(host.changes.at(-1)?.map((f) => f.id)).toEqual(['srv-1']);
    expect(host.removed).toEqual([]);
  });
});

describe('UiFileUpload — single file with a stored one (FSHSP-264)', () => {
  async function setupSingle() {
    await TestBed.configureTestingModule({ imports: [SingleUploadHost] }).compileComponents();
    const fixture = TestBed.createComponent(SingleUploadHost);
    fixture.componentInstance.initialFiles.set([CONTRACT]);
    await flush(fixture);
    return { fixture, host: fixture.componentInstance, upload: fixture.componentInstance.upload() };
  }

  it('shows no toolbar for stored files alone', async () => {
    const { fixture, upload } = await setupSingle();
    expect(query(fixture, '.ui-file-upload-toolbar')).toHaveLength(0);

    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);
    expect(query(fixture, '.ui-file-upload-toolbar')).toHaveLength(1);
  });

  it('emits removed for the stored file a new one replaces', async () => {
    const { fixture, host, upload } = await setupSingle();
    upload.add([pdf('photo.pdf', 50)]);
    await flush(fixture);

    expect(host.removed.map((f) => f.id)).toEqual(['srv-1']);
    expect(rowNames(fixture)).toEqual(['photo.pdf']);
  });
});
