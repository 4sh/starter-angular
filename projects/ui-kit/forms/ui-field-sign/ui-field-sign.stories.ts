import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiFieldSign, type FieldSignValue } from '@4sh/ui-kit/forms/ui-field-sign';

/** A short signature, as the field itself exports it (SVG, transparent background). */
const SAMPLE_SIGNATURE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">' +
      '<g fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M40 110Q55 40 70 95Q80 130 95 80Q105 50 112 98Q120 120 135 90Q150 60 160 100Q170 125 190 85"/>' +
      '<path d="M200 92Q215 70 230 95Q240 112 255 88Q268 70 280 96"/>' +
      '<path d="M45 128L270 122"/>' +
      '</g></svg>',
  );

/** First characters of a data URL: enough to see what the form holds. */
const preview = (value: FieldSignValue | undefined): string =>
  value ? `${value.slice(0, 30)}… (${value.length} chars)` : 'null';

const meta: Meta<UiFieldSign> = {
  title: 'Components/ui/forms/ui-field-sign',
  component: UiFieldSign,
  decorators: [moduleMetadata({ imports: [UiFieldSign, FormsModule, ReactiveFormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=4219-1970',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    format: {
      control: 'inline-radio',
      options: ['png', 'svg'],
      description: 'Format of the emitted data URL.',
      table: { type: { summary: 'FieldSignFormat' }, defaultValue: { summary: '"png"' } },
    },
    exportColor: {
      control: 'color',
      description:
        'Ink colour **of the export**: any CSS colour, `var(--token)` included (resolved to `rgb()`); `black` when invalid. The screen ink follows the tokens.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"black"' } },
    },
    placeholder: {
      control: 'text',
      description: 'Hint shown in the empty area.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Signez ici"' } },
    },
    clearable: {
      control: 'boolean',
      description: 'Renders the clear button.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    clearAriaLabel: {
      control: 'text',
      description: 'Accessible name of the clear button.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Effacer la signature"' } },
    },
    signedLabel: {
      control: 'text',
      description: 'State announced once the area is signed (the hint is announced while empty).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Signature saisie"' } },
    },
    requiredLabel: {
      control: 'text',
      description:
        'Announced after the state when the field is `required` — the visual `*` is hidden from assistive tech.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"obligatoire"' } },
    },
    unreadableLabel: {
      control: 'text',
      description:
        'Shown and announced in place of a signature from the form that cannot be loaded.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Signature illisible"' } },
    },
    helperText: { control: 'text', table: { type: { summary: 'string' } } },
    errorText: { control: 'text', table: { type: { summary: 'string' } } },
    showMessageIcon: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    required: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange', table: { disable: true } },
    padFocus: { action: 'padFocus', table: { disable: true } },
    padBlur: { action: 'padBlur', table: { disable: true } },
    imageError: { action: 'imageError', table: { disable: true } },
    messageIcon: {
      control: false,
      description: 'Overrides the glyph shown by `showMessageIcon`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: false,
      description: 'Accessible name when no visible label is provided.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'Id of an external element that labels this control.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    inputId: {
      control: false,
      description: 'Id of the drawing area (generated when omitted).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    name: {
      control: false,
      description: 'Not rendered: the value lives in the Angular form, not in a native field.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    tabindex: {
      control: false,
      description: '`tabindex` of the drawing area (`0` by default).',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    label: 'Customer signature',
    format: 'png',
    exportColor: 'black',
    placeholder: 'Signez ici',
    clearable: true,
    clearAriaLabel: 'Effacer la signature',
    signedLabel: 'Signature saisie',
    requiredLabel: 'obligatoire',
    unreadableLabel: 'Signature illisible',
    size: 'default',
    level: 'default',
    showMessageIcon: false,
  },
};

export default meta;
type Story = StoryObj<UiFieldSign>;

const TEMPLATE = `<div style="width:360px"><ui-field-sign
    [(ngModel)]="model"
    [label]="label" [format]="format" [exportColor]="exportColor" [placeholder]="placeholder"
    [clearable]="clearable" [clearAriaLabel]="clearAriaLabel" [signedLabel]="signedLabel"
    [requiredLabel]="requiredLabel" [unreadableLabel]="unreadableLabel"
    [helperText]="helperText" [errorText]="errorText" [size]="size" [level]="level"
    [showMessageIcon]="showMessageIcon" [messageIcon]="messageIcon"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story =
  (value: FieldSignValue = null): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story() };
export const WithHelper: Story = {
  render: story(),
  args: { helperText: 'With a finger, a stylus or a mouse.' },
};
export const WithValue: Story = {
  render: story(SAMPLE_SIGNATURE),
  args: { helperText: 'A value written by the form stays under new strokes.' },
};
export const Svg: Story = {
  render: story(),
  args: {
    label: 'Signature (SVG)',
    format: 'svg',
    helperText: 'Emits an `image/svg+xml` data URL.',
  },
};
export const Required: Story = {
  render: story(),
  args: { required: true, helperText: 'Required to confirm the delivery note.' },
};
export const Error: Story = {
  render: story(),
  args: { level: 'error', helperText: 'A signature is required.' },
};
export const Small: Story = { render: story(), args: { label: 'Initials', size: 'small' } };
export const ReadOnly: Story = { render: story(SAMPLE_SIGNATURE), args: { readonly: true } };
export const Disabled: Story = { render: story(SAMPLE_SIGNATURE), args: { disabled: true } };

// --- Template Driven ([(ngModel)] + native validation) ------------------
export const TemplateDriven: Story = {
  name: 'Template Driven',
  render: () => ({
    props: { model: null, preview },
    template: `
      <form #f="ngForm" style="width:360px; display:grid; gap:12px;">
        <ui-field-sign [(ngModel)]="model" name="signature" required label="Customer signature" format="svg" />
        <code>model = {{ preview(model) }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: {
      control: new FormControl<FieldSignValue>(null, Validators.required),
      preview,
    },
    template: `
      <div style="width:360px; display:grid; gap:12px; justify-items:start;">
        <ui-field-sign [formControl]="control" label="Customer signature" format="svg" />
        <code>value = {{ preview(control.value) }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Enable / disable
        </button>
        <button type="button" (click)="control.reset()">Reset</button>
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-field-sign-signal-forms',
  standalone: true,
  imports: [UiFieldSign, FormField],
  template: `
    <div style="width:360px; display:grid; gap:12px;">
      <ui-field-sign [formField]="signature" label="Customer signature" format="svg" />
      <code>value = {{ preview(signature().value()) }} · valid = {{ signature().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly preview = preview;
  protected readonly model = signal<FieldSignValue>(null);
  protected readonly signature = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-field-sign-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};
