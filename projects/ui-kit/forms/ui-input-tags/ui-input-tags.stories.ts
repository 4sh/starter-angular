import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiInputTags, InputTagsCompleteEvent, InputTagsAddEvent, InputTagsRemoveEvent } from '@4sh/ui-kit/forms/ui-input-tags';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiChip } from '@4sh/ui-kit/informative/ui-chip';

const TECHNOS = [
  'Angular',
  'React',
  'View',
  'Svelte',
  'Solid',
  'Qwik',
  'Ember',
  'Preact',
  'Lit',
  'Alpine',
];

const norm = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Interactive completer: filters `data` into `results` on each `completeMethod`. */
function completer(data: readonly string[]) {
  return {
    results: [] as string[],
    complete(event: InputTagsCompleteEvent): void {
      const q = norm(event.query);
      this.results = data.filter((d) => norm(d).includes(q));
    },
  };
}

const meta: Meta<UiInputTags> = {
  title: 'Components/ui/forms/ui-input-tags',
  component: UiInputTags,
  decorators: [moduleMetadata({ imports: [UiInputTags, UiIcon, UiChip, CommonModule, FormsModule, ReactiveFormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder shown as long as no tag is present.',
      table: { type: { summary: 'string' } },
    },
    max: {
      control: 'number',
      description: 'Maximum number of tags allowed.',
      table: { type: { summary: 'number' } },
    },
    delimiter: {
      control: 'text',
      description: 'Delimiter that splits typed/pasted text into several tags.',
      table: { type: { summary: 'string | RegExp' } },
    },
    allowDuplicate: {
      control: 'boolean',
      description: 'Allows adding the same value more than once.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnBlur: {
      control: 'boolean',
      description: 'Adds the current input as a tag on blur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnTab: {
      control: 'boolean',
      description: 'Adds the current input as a tag on `Tab`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnPaste: {
      control: 'boolean',
      description: 'Splits pasted text (via `delimiter`) and adds each part.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    typeahead: {
      control: 'boolean',
      description: 'Shows a suggestion list while typing (via `completeMethod`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    suggestions: {
      control: false,
      description: 'Displayed suggestions — filled by the parent in response to `completeMethod`.',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    minLength: {
      control: 'number',
      description: 'Minimum number of characters before emitting `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Field size.',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    chipLevel: {
      control: 'inline-radio',
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Color family of the default `ui-chip` tags (ignored with a `#item` template).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: "'default'" } },
    },
    chipSubLevel: {
      control: 'inline-radio',
      options: ['low', 'high'],
      description: 'Intensity of the default `ui-chip` tags (`low` subtle / `high` strong).',
      table: { type: { summary: "'low' | 'high'" }, defaultValue: { summary: "'low'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the field (native attribute).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Forces the error style (automatic when the attached control is invalid + touched).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Field label.', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Helper text under the field.', table: { type: { summary: 'string' } } },
    tagAdd: { action: 'tagAdd', table: { category: 'Outputs' } },
    tagRemove: { action: 'tagRemove', table: { category: 'Outputs' } },
    valueChange: { action: 'valueChange', table: { category: 'Outputs' } },
    completeMethod: { action: 'completeMethod', table: { category: 'Outputs' } },
    optionSelect: { action: 'optionSelect', table: { category: 'Outputs' } },
  },
};

export default meta;
type Story = StoryObj<UiInputTags>;

/**
 * Saisie de plusieurs tags : `Entrée` ajoute la valeur saisie, `Retour arrière`
 * (champ vide) retire le dernier. `←`/`→` naviguent entre les tags,
 * `Suppr`/`Retour arrière` sur un tag le retire.
 */
export const Basic: Story = {
  render: () => ({
    props: { tags: ['Angular', 'TypeScript'] },
    template: `
      <ui-input-tags
        label="Technologies"
        placeholder="Add…"
        [(ngModel)]="tags"
        style="width: 22rem"
      />
    `,
  }),
};

/**
 * Un délimiteur (ici la virgule) ajoute des tags en plus de `Entrée`. Avec
 * `addOnPaste`, un texte collé est découpé selon le délimiteur.
 */
export const Delimiter: Story = {
  render: () => ({
    props: { tags: [] as string[] },
    template: `
      <ui-input-tags
        label="Keywords"
        placeholder="Separate with commas…"
        helperText="Try pasting “red, green, blue”."
        delimiter=","
        [addOnPaste]="true"
        [(ngModel)]="tags"
        style="width: 22rem"
      />
    `,
  }),
};

/** Par défaut, les doublons sont refusés. `allowDuplicate` les autorise. */
export const AllowDuplicate: Story = {
  name: 'Allow Duplicate',
  render: () => ({
    props: { a: ['Angular'], b: ['Angular'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 22rem">
        <ui-input-tags label="No duplicates (default)" placeholder="Add…" [(ngModel)]="a" />
        <ui-input-tags label="Duplicates allowed" placeholder="Add…" [allowDuplicate]="true" [(ngModel)]="b" />
      </div>
    `,
  }),
};

/** `max` limite le nombre de tags : au-delà, la saisie est bloquée. */
export const Max: Story = {
  render: () => ({
    props: { tags: ['Angular', 'React'] },
    template: `
      <ui-input-tags
        label="3 technologies max"
        placeholder="Add…"
        [max]="3"
        helperText="Add up to 3."
        [(ngModel)]="tags"
        style="width: 22rem"
      />
    `,
  }),
};

/**
 * Par défaut, chaque tag est un [`ui-chip`](?path=/docs/components-ui-informative-ui-chip--docs).
 * Le template `#item` permet un rendu **entièrement personnalisé** (contexte `value` / `label` /
 * `index` / `onRemove`) — utile pour des tags avec icône, avatar, couleur métier, etc.
 */
export const Template: Story = {
  render: () => ({
    props: { tags: ['Angular', 'Svelte'] },
    template: `
      <ui-input-tags label="Technologies" placeholder="Add…" [(ngModel)]="tags" style="width: 24rem">
        <ng-template #item let-value let-remove="onRemove">
          <ui-chip
            [ariaLabel]="value"
            level="highlight"
            size="small"
            [removable]="true"
            [removeTabindex]="-1"
            removeAriaLabel="Retirer"
            (remove)="remove($event)"
          >
            <ui-icon name="code" size="sm" />
            {{ value }}
          </ui-chip>
        </ng-template>
      </ui-input-tags>
    `,
  }),
};

/**
 * Les tags `ui-chip` par défaut se colorent via `chipLevel` (famille) et `chipSubLevel`
 * (intensité `low`/`high`) — sans recourir à un template.
 */
export const Styled: Story = {
  render: () => ({
    props: { a: ['Angular', 'React'], b: ['Prod', 'Critique'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 22rem">
        <ui-input-tags label="Highlight (low)" chipLevel="highlight" placeholder="Add…" [(ngModel)]="a" />
        <ui-input-tags label="Error (high)" chipLevel="error" chipSubLevel="high" placeholder="Add…" [(ngModel)]="b" />
      </div>
    `,
  }),
};

/**
 * Avec `typeahead`, une liste de suggestions s’affiche pendant la frappe.
 * Utilisez `completeMethod` pour fournir les résultats.
 */
export const Typeahead: Story = {
  render: () => ({
    props: { ...completer(TECHNOS), tags: ['Angular'] },
    template: `
      <ui-input-tags
        label="Frameworks"
        placeholder="Type to search…"
        [typeahead]="true"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        [(ngModel)]="tags"
        style="width: 22rem"
      />
    `,
  }),
};

/** Journal des événements `tagAdd` / `tagRemove`. */
function eventLog() {
  return {
    tags: ['Angular'],
    log: [] as string[],
    onAdd(e: InputTagsAddEvent): void {
      this.log = [`+ ${e.value}`, ...this.log].slice(0, 5);
    },
    onRemove(e: InputTagsRemoveEvent): void {
      this.log = [`− ${e.value} (index ${e.index})`, ...this.log].slice(0, 5);
    },
  };
}

/** `tagAdd` et `tagRemove` notifient les changements de tags. */
export const Events: Story = {
  render: () => ({
    props: eventLog(),
    template: `
      <div style="width: 24rem">
        <ui-input-tags
          label="Technologies"
          placeholder="Add…"
          [(ngModel)]="tags"
          (tagAdd)="onAdd($event)"
          (tagRemove)="onRemove($event)"
        />
        <ul style="margin-top: .75rem; font-size: .85rem; color: var(--form-low-content-default)">
          @for (line of log; track $index) { <li>{{ line }}</li> }
        </ul>
      </div>
    `,
  }),
};

/**
 * L’état d’erreur s’applique via `invalid`, intégrable aux formulaires Angular
 * (ici un `FormControl` requérant au moins un tag).
 */
export const Invalid: Story = {
  render: () => ({
    props: {
      control: new FormControl<string[]>([], {
        nonNullable: true,
        validators: [Validators.required, (c) => (c.value?.length ? null : { required: true })],
      }),
    },
    template: `
      <ui-input-tags
        label="Skills"
        placeholder="At least one tag…"
        errorText="Add at least one skill."
        [formControl]="control"
        style="width: 22rem"
      />
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-input-tags-signal-forms',
  standalone: true,
  imports: [UiInputTags, FormField, CommonModule],
  template: `
    <div style="width: 22rem; display: grid; gap: 12px; justify-items: start;">
      <ui-input-tags [formField]="skills" label="Skills" placeholder="Add…" style="width: 100%" />
      <code>value = {{ skills().value() | json }} · valid = {{ skills().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal<string[]>(['Angular']);
  protected readonly skills = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-input-tags-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

/** Avec `disabled`, le champ ne peut être ni édité ni focalisé. */
export const Disabled: Story = {
  render: () => ({
    props: { tags: ['Angular', 'TypeScript'] },
    template: `
      <ui-input-tags label="Technologies" [disabled]="true" [(ngModel)]="tags" style="width: 22rem" />
    `,
  }),
};

/** Tailles `default` et `small`. */
export const Sizes: Story = {
  render: () => ({
    props: { a: ['Angular'], b: ['Angular'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 22rem">
        <ui-input-tags label="Default" size="default" placeholder="Add…" [(ngModel)]="a" />
        <ui-input-tags label="Small" size="small" placeholder="Add…" [(ngModel)]="b" />
      </div>
    `,
  }),
};
