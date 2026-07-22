import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UiInputTags, InputTagsCompleteEvent, InputTagsAddEvent, InputTagsRemoveEvent } from './ui-input-tags';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiChip } from '@app/shared/components/ui/informative/ui-chip/ui-chip';

const TECHNOS = [
  'Angular',
  'React',
  'Vue',
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
      description: 'Placeholder affiché tant qu’aucun tag n’est présent.',
      table: { type: { summary: 'string' } },
    },
    max: {
      control: 'number',
      description: 'Nombre maximal de tags autorisés.',
      table: { type: { summary: 'number' } },
    },
    delimiter: {
      control: 'text',
      description: 'Délimiteur qui découpe le texte saisi/collé en plusieurs tags.',
      table: { type: { summary: 'string | RegExp' } },
    },
    allowDuplicate: {
      control: 'boolean',
      description: 'Autorise l’ajout plusieurs fois de la même valeur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnBlur: {
      control: 'boolean',
      description: 'Ajoute la saisie courante comme tag à la perte de focus.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnTab: {
      control: 'boolean',
      description: 'Ajoute la saisie courante comme tag sur `Tab`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    addOnPaste: {
      control: 'boolean',
      description: 'Découpe le texte collé (via `delimiter`) et ajoute chaque partie.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    typeahead: {
      control: 'boolean',
      description: 'Affiche une liste de suggestions pendant la frappe (via `completeMethod`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    suggestions: {
      control: false,
      description: 'Suggestions affichées — remplies par le parent en réponse à `completeMethod`.',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    minLength: {
      control: 'number',
      description: 'Nombre minimal de caractères avant d’émettre `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Taille du champ.',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    chipLevel: {
      control: 'inline-radio',
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Famille de couleur des tags `ui-chip` par défaut (ignoré avec un template `#item`).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: "'default'" } },
    },
    chipSubLevel: {
      control: 'inline-radio',
      options: ['low', 'high'],
      description: 'Intensité des tags `ui-chip` par défaut (`low` discret / `high` soutenu).',
      table: { type: { summary: "'low' | 'high'" }, defaultValue: { summary: "'low'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le champ (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force le style d’erreur (auto quand le contrôle attaché est invalide + touché).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Libellé du champ.', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Texte d’aide sous le champ.', table: { type: { summary: 'string' } } },
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
        placeholder="Ajouter…"
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
        label="Mots-clés"
        placeholder="Séparez par des virgules…"
        helperText="Essayez de coller « rouge, vert, bleu »."
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
        <ui-input-tags label="Sans doublon (défaut)" placeholder="Ajouter…" [(ngModel)]="a" />
        <ui-input-tags label="Doublons autorisés" placeholder="Ajouter…" [allowDuplicate]="true" [(ngModel)]="b" />
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
        placeholder="Ajouter…"
        [max]="3"
        helperText="Ajoutez-en jusqu’à 3."
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
      <ui-input-tags label="Technologies" placeholder="Ajouter…" [(ngModel)]="tags" style="width: 24rem">
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
        <ui-input-tags label="Highlight (low)" chipLevel="highlight" placeholder="Ajouter…" [(ngModel)]="a" />
        <ui-input-tags label="Error (high)" chipLevel="error" chipSubLevel="high" placeholder="Ajouter…" [(ngModel)]="b" />
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
        placeholder="Tapez pour rechercher…"
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
          placeholder="Ajouter…"
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
        label="Compétences"
        placeholder="Au moins un tag…"
        errorText="Ajoutez au moins une compétence."
        [formControl]="control"
        style="width: 22rem"
      />
    `,
  }),
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
        <ui-input-tags label="Default" size="default" placeholder="Ajouter…" [(ngModel)]="a" />
        <ui-input-tags label="Small" size="small" placeholder="Ajouter…" [(ngModel)]="b" />
      </div>
    `,
  }),
};
