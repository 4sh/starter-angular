import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { DEFAULT_EDITOR_TOOLS, UiEditor } from '@4sh/ui-kit/forms/ui-editor';

const meta: Meta<UiEditor> = {
  title: 'Components/ui/forms/ui-editor',
  component: UiEditor,
  decorators: [moduleMetadata({ imports: [UiEditor, FormsModule, ReactiveFormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    helperText: {
      control: 'text',
      description: "Texte d'aide (via ui-helper).",
      table: { type: { summary: 'string' } },
    },
    errorText: {
      control: 'text',
      description: "Message affiché à la place de l'aide quand en erreur.",
      table: { type: { summary: 'string' } },
    },
    placeholder: {
      control: 'text',
      description: "Texte indicatif affiché tant que l'éditeur est vide.",
      table: { type: { summary: 'string' } },
    },
    tools: {
      control: 'object',
      description:
        "Outils affichés dans la barre, dans l'ordre (`separator` = séparateur ; `blockFormat`, `fontFamily` et `fontSize` sont des listes déroulantes).",
      table: {
        type: { summary: 'EditorTool[]' },
        defaultValue: { summary: 'DEFAULT_EDITOR_TOOLS' },
      },
    },
    minRows: {
      control: { type: 'number', min: 1 },
      description: 'Hauteur minimale de la zone de saisie, en lignes.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    maxlength: {
      control: 'number',
      description: 'Nombre maximum de caractères **de texte** (le balisage ne compte pas).',
      table: { type: { summary: 'number' } },
    },
    showCount: {
      control: 'boolean',
      description: 'Affiche un compteur de caractères.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    toolbarPosition: {
      control: 'inline-radio',
      options: ['top', 'bottom'],
      description: "Position de la barre d'outils.",
      table: { type: { summary: 'EditorToolbarPosition' }, defaultValue: { summary: "'top'" } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    floatLabel: {
      control: 'select',
      options: [undefined, 'over', 'in', 'on'],
      labels: { undefined: 'aucun (libellé classique)' },
      table: { type: { summary: 'FieldFloatLabel' }, defaultValue: { summary: 'undefined' } },
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
    editorFocus: { action: 'editorFocus', table: { disable: true } },
    editorBlur: { action: 'editorBlur', table: { disable: true } },
    selectionChange: { action: 'selectionChange', table: { disable: true } },
  },
  args: {
    label: 'Description',
    placeholder: 'Rédigez votre texte…',
    tools: [...DEFAULT_EDITOR_TOOLS],
    minRows: 4,
    showCount: false,
    toolbarPosition: 'top',
    size: 'default',
    level: 'default',
  },
};

export default meta;
type Story = StoryObj<UiEditor>;

// --- Template-driven ([(ngModel)]) --------------------------------------
const TEMPLATE = `<div style="width:420px"><ui-editor
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [errorText]="errorText" [placeholder]="placeholder"
    [tools]="tools" [minRows]="minRows" [maxlength]="maxlength" [showCount]="showCount"
    [toolbarPosition]="toolbarPosition"
    [size]="size" [level]="level" [floatLabel]="floatLabel"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story =
  (value = ''): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

const RICH = `<p>Un paragraphe avec du <strong>gras</strong>, de l'<em>italique</em> et un <a href="https://example.com">lien</a>.</p><ul><li>Premier point</li><li>Second point</li></ul>`;

export const Default: Story = { render: story() };

export const WithValue: Story = {
  render: story(RICH),
  args: { label: 'Description', helperText: 'Le contenu est stocké en HTML.' },
};

export const WithHelper: Story = {
  render: story(),
  args: {
    label: 'Commentaire',
    placeholder: 'Votre avis…',
    helperText: 'Mise en forme simple : gras, italique, listes, liens.',
  },
};

/** La barre d'outils est configurable : seuls les outils listés sont rendus. */
export const MinimalToolbar: Story = {
  render: story('<p>Barre réduite au gras et à l’italique.</p>'),
  args: { label: 'Note', tools: ['bold', 'italic'] },
};

/**
 * `codeBlock` bascule le bloc sous le curseur entre `<pre>` et paragraphe. Pas de
 * coloration syntaxique : elle imposerait une dépendance tierce.
 */
export const CodeBlock: Story = {
  render: story('<p>Un exemple :</p><pre>npm run ui-kit:build</pre><p>et la suite.</p>'),
  args: { label: 'Documentation' },
};

/**
 * Le choix de police est **fermé aux trois familles du système**
 * (`--fontfamily-base`, `--fontfamily-title`, `--fontfamily-monospace`), et la
 * taille à l'échelle `--size-typography-text-*`. La liste affiche le nom réel de
 * chaque fonte, lu depuis le token à l'exécution.
 */
export const FontFamily: Story = {
  render: story(
    '<p><span class="ui-editor-font-title">Une accroche en police de titre</span></p>' +
      '<p>Un paragraphe en police standard.</p>' +
      '<p><span class="ui-editor-font-monospace">const x = 1;</span></p>',
  ),
  args: { label: 'Contenu' },
};

/**
 * `fontSize` n'est **pas** dans la barre par défaut : il ferait doublon avec
 * `blockFormat` à l'écran, sans porter la structure du document. Il s'ajoute
 * explicitement quand un projet en a besoin.
 */
export const FontSize: Story = {
  render: story(
    '<p><span class="ui-editor-size-xl">Très grand</span>, ' +
      '<span class="ui-editor-size-lg">grand</span>, normal, ' +
      '<span class="ui-editor-size-sm">petit</span>.</p>',
  ),
  args: {
    label: 'Contenu',
    tools: ['blockFormat', 'fontFamily', 'fontSize', 'separator', 'bold', 'italic'],
  },
};

/**
 * `blockFormat` change ce que le bloc **est**, pas seulement son apparence : un
 * titre porte la structure du document, et un lecteur d'écran navigue de titre en
 * titre.
 */
export const Headings: Story = {
  render: story(
    '<h1>Titre de niveau 1</h1><p>Un paragraphe.</p>' +
      '<h2>Titre de niveau 2</h2><p>Un autre paragraphe.</p>' +
      '<h3>Titre de niveau 3</h3><p>Encore un.</p>',
  ),
  args: { label: 'Article', minRows: 8 },
};

export const ToolbarBottom: Story = {
  render: story('<p>La barre d’outils est sous la zone de saisie.</p>'),
  args: { label: 'Message', toolbarPosition: 'bottom' },
};

export const Small: Story = {
  render: story('<p>Variante compacte.</p>'),
  args: { label: 'Compact', size: 'small', minRows: 3 },
};

export const Success: Story = {
  render: story('<p>Contenu validé.</p>'),
  args: { label: 'Bio', level: 'success', helperText: 'Parfait.' },
};

export const Disabled: Story = {
  render: story(RICH),
  args: { label: 'Description', disabled: true },
};

export const Readonly: Story = {
  render: story(RICH),
  args: { label: 'Description', readonly: true },
};

/** Le compteur mesure le **texte**, jamais le balisage. */
export const CharacterCount: Story = {
  render: () => ({
    props: { model: '<p>Un court message.</p>' },
    template: `<div style="width:420px"><ui-editor
      [(ngModel)]="model" label="Commentaire" placeholder="280 caractères max"
      [maxlength]="280" [showCount]="true" /></div>`,
  }),
};

// --- Validation (reactive forms) ---------------------------------------
export const Required: Story = {
  render: () => ({
    props: { control: new FormControl('', Validators.required) },
    template: `<div style="width:420px"><ui-editor
      [formControl]="control" label="Description" [required]="true"
      helperText="Champ obligatoire." errorText="Ce champ est requis." /></div>`,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-editor-signal-forms',
  standalone: true,
  imports: [UiEditor, FormField],
  template: `
    <div style="width:420px; display:grid; gap:12px; justify-items:start;">
      <ui-editor
        [formField]="field"
        label="Description"
        placeholder="Rédigez votre texte…"
        helperText="Champ obligatoire."
        errorText="Champ obligatoire."
      />
      <code>valid = {{ field().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal('');
  protected readonly field = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-editor-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Libellé flottant ---------------------------------------------------
export const FloatLabel: Story = {
  render: () => ({
    props: { a: '', b: RICH },
    template: `
      <div style="display:grid; grid-template-columns:repeat(2, 320px); gap:20px; align-items:start;">
        <ui-editor floatLabel="on" label="Description" [(ngModel)]="a" [minRows]="3" />
        <ui-editor floatLabel="on" label="Description" [(ngModel)]="b" [minRows]="3" />
      </div>
    `,
  }),
};
