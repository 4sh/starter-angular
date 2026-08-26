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
        "Outils affichés dans la barre, dans l'ordre (`separator` = séparateur ; `fontFamily` et `fontSize` sont des `ui-select`, pas des boutons).",
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
const TEMPLATE = `<div style="width:750px"><ui-editor
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
 * `fontFamily` et `fontSize` sont tous deux **dans la barre par défaut**, à
 * égalité : ni l'un ni l'autre n'est une option gardée derrière `tools`. Le
 * choix de police est fermé aux trois familles du système
 * (`--fontfamily-base`, `--fontfamily-title`, `--fontfamily-monospace`), et la
 * taille à l'échelle `--size-typography-text-*`. Chacun se rend en `ui-select`
 * (`size="small"`), et affiche la valeur en vigueur au repos — la police lit
 * le nom réel de la fonte, résolu depuis le token à l'exécution.
 */
export const FontFamily: Story = {
  render: story(
    '<p><span class="ui-editor-font-title">Une accroche en police de titre</span></p>' +
      '<p>Un paragraphe en police standard.</p>' +
      '<p><span class="ui-editor-font-monospace">const x = 1;</span></p>',
  ),
  args: { label: 'Contenu' },
};

/** Les quatre tailles de l'échelle `--size-typography-text-*`. */
export const FontSize: Story = {
  render: story(
    '<p><span class="ui-editor-size-xl">Très grand</span>, ' +
      '<span class="ui-editor-size-lg">grand</span>, normal, ' +
      '<span class="ui-editor-size-sm">petit</span>.</p>',
  ),
  args: { label: 'Contenu' },
};

/**
 * `indent`/`outdent` ne sont **pas** dans la barre par défaut (même logique
 * que `fontSize` : opt-in via `tools`). Passthrough `execCommand` — aucune
 * classe ni conversion, contrairement à la police/taille.
 */
export const IndentOutdent: Story = {
  render: story(
    '<ul><li>Premier point</li><li>Second point<ul><li>Sous-point</li></ul></li></ul>',
  ),
  args: {
    label: 'Plan',
    tools: ['bulletList', 'orderedList', 'separator', 'indent', 'outdent'],
  },
};

/**
 * `alignLeft`/`alignCenter`/`alignRight`/`alignJustify` sont dans la barre par
 * défaut : passthrough `execCommand('justify*')`, mutuellement exclusifs par
 * construction du navigateur (appliquer l'un désactive l'état des autres), donc
 * ils suivent le même modèle `aria-pressed` que gras/italique/souligné plutôt
 * que celui d'un menu.
 */
export const TextAlign: Story = {
  render: story(
    '<p style="text-align: center;">Centré.</p>' +
      '<p style="text-align: right;">Aligné à droite.</p>' +
      '<p style="text-align: justify;">Justifié : ce paragraphe est assez long pour que la justification s\'y voie clairement sur plusieurs lignes.</p>',
  ),
  args: { label: 'Contenu' },
};

/**
 * `textColor`/`highlightColor` ne sont **pas** dans la barre par défaut (même
 * logique d'opt-in que `fontSize`/`indent`/`outdent`). Chacun ouvre son propre
 * `ui-swatch-picker` (`popup`, `size="small"`) ancré au bouton `ui-button`, qui
 * affiche un liseré sous son icône dans la couleur active au curseur. La
 * palette est celle par défaut de `ui-swatch-picker`, réutilisée telle quelle
 * pour que le nuancier et les classes générées restent le même jeu de tokens.
 */
export const ColorPickers: Story = {
  render: story(
    '<p><span class="ui-editor-color-red-500">Texte en rouge</span>, ' +
      '<span class="ui-editor-highlight-orange-100">surligné en orange clair</span> ' +
      'et du texte normal.</p>',
  ),
  args: {
    label: 'Contenu',
    tools: ['bold', 'italic', 'separator', 'textColor', 'highlightColor'],
  },
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
    template: `<div style="width:640px"><ui-editor
      [(ngModel)]="model" label="Commentaire" placeholder="280 caractères max"
      [maxlength]="280" [showCount]="true" /></div>`,
  }),
};

// --- Validation (reactive forms) ---------------------------------------
export const Required: Story = {
  render: () => ({
    props: { control: new FormControl('', Validators.required) },
    template: `<div style="width:640px"><ui-editor
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
    <div style="width:640px; display:grid; gap:12px; justify-items:start;">
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
