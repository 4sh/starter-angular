import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiFileUpload } from '@4sh/ui-kit/forms/ui-file-upload';
import { UiFileUploadList } from '@4sh/ui-kit/forms/ui-file-upload';
import { UiUploadHandlerEvent } from '@4sh/ui-kit/forms/ui-file-upload';

/**
 * Simulated upload: advances each file's progress on a timer, then marks it
 * complete. Stands in for a real endpoint so the progress + spinner are visible
 * in Storybook (a real integration would set `url` or do the work in here).
 */
function simulateUpload(event: UiUploadHandlerEvent): void {
  event.files.forEach((file, index) => {
    let progress = 0;
    const tick = (): void => {
      progress += 12 + Math.random() * 18;
      if (progress >= 100) {
        event.setProgress(file, 100);
        event.markUploaded(file);
      } else {
        event.setProgress(file, progress);
        setTimeout(tick, 260);
      }
    };
    setTimeout(tick, 200 + index * 180);
  });
}

const meta: Meta<UiFileUpload> = {
  title: 'Components/ui/forms/ui-file-upload',
  component: UiFileUpload,
  decorators: [moduleMetadata({ imports: [UiFileUpload, UiFileUploadList] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=154-4706&t=inUHXSiILDu9zvad-1',
    },
  },
  argTypes: {
    mode: {
      control: { type: 'inline-radio' },
      options: ['field', 'drag'],
      description: 'Disposition : champ compact ou zone de glisser-déposer.',
      table: { type: { summary: 'UiFileUploadMode' }, defaultValue: { summary: '"field"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      table: { type: { summary: 'UiFileUploadSize' }, defaultValue: { summary: '"default"' } },
    },
    multiple: {
      control: { type: 'boolean' },
      description: 'Autorise la sélection de plusieurs fichiers.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: { type: 'text' },
      description: 'Nom natif : un `<form>` englobant soumet la sélection courante sous ce nom.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    accept: {
      control: { type: 'text' },
      description: 'Filtre natif de type MIME/extension (ex. "image/*,.pdf").',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    auto: {
      control: { type: 'boolean' },
      description: 'Téléverse chaque fichier dès sa sélection.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    customUpload: {
      control: { type: 'boolean' },
      description: 'Délègue le téléversement à la sortie `uploadHandler`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    hint: {
      control: { type: 'text' },
      description: 'Petit texte indicatif sous la zone (types acceptés, taille max).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ripple: {
      control: false,
      description:
        "Onde de pression sur la zone de dépôt et les actions quand l'effet ripple est activé (`provideUiRipple()` ou `[uiRippleScope]`). `false` la coupe sur ce composant, même en activation globale.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    maxFileSize: {
      control: false,
      description: 'Taille maximale par fichier, en octets.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    fileLimit: {
      control: false,
      description: 'Nombre maximal de fichiers conservés simultanément.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    url: {
      control: false,
      description: "Point d'accès de l'uploader intégré.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    method: {
      control: false,
      description: "Méthode HTTP de l'uploader intégré.",
      table: { type: { summary: "'post' | 'put'" }, defaultValue: { summary: '"post"' } },
    },
    fieldName: {
      control: false,
      description: 'Nom du champ utilisé pour chaque fichier dans le corps multipart.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"files"' } },
    },
    withCredentials: {
      control: false,
      description:
        "Envoie les identifiants (cookies) avec la requête d'envoi de l'uploader intégré.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showFileList: {
      control: false,
      description: 'Affiche la liste des fichiers sous le contrôle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showControls: {
      control: false,
      description: "Affiche les boutons Envoyer/Annuler de la barre d'outils (mode drag).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    browseLabel: {
      control: false,
      description: 'Libellé du bouton Parcourir.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Parcourir"' } },
    },
    chooseLabel: {
      control: false,
      description: 'Placeholder affiché en mode champ avant toute sélection.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Choisir un fichier…"' } },
    },
    uploadLabel: {
      control: false,
      description: "Libellé du bouton Envoyer de la barre d'outils (mode drag).",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Téléverser"' } },
    },
    cancelLabel: {
      control: false,
      description: "Libellé du bouton de la barre d'outils qui vide la sélection (mode drag).",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Effacer"' } },
    },
    dragLinkLabel: {
      control: false,
      description: 'Lien et invite de la zone de glisser-déposer.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Cliquer pour téléverser"' },
      },
    },
    dragPromptLabel: {
      control: false,
      description: 'Texte après le lien de la zone de glisser-déposer (mode drag).',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"ou glisser-déposer les fichiers ici"' },
      },
    },
    ariaLabel: {
      control: false,
      description: "Nom accessible de l'ensemble du contrôle.",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Téléversement de fichiers"' },
      },
    },
    filesSummaryLabel: {
      control: false,
      description:
        'Résumé multi-fichiers en mode champ, où `{0}` est remplacé par le nombre de fichiers.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"{0} fichiers"' } },
    },
    invalidTypeMessage: {
      control: false,
      description:
        'Message de rejet : type de fichier non accepté, où `{0}` est le nom du fichier.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Type de fichier non autorisé : {0}"' },
      },
    },
    invalidSizeMessage: {
      control: false,
      description: 'Message de rejet : fichier trop volumineux, où `{0}` est le nom du fichier.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Fichier trop volumineux : {0}"' },
      },
    },
    limitReachedMessage: {
      control: false,
      description: 'Message de rejet : `fileLimit` atteint, où `{0}` est la limite.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Nombre maximum de fichiers atteint ({0})."' },
      },
    },
    uploadErrorMessage: {
      control: false,
      description: 'Erreur affichée quand un envoi échoue sans message du serveur.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Échec du téléversement"' } },
    },
    networkErrorMessage: {
      control: false,
      description: "Erreur affichée quand la requête d'envoi échoue au niveau réseau.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Erreur réseau"' } },
    },
    httpErrorMessage: {
      control: false,
      description: 'Erreur affichée sur une réponse non 2xx, où `{0}` est le statut HTTP.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Erreur {0}"' } },
    },
    fileTemplate: {
      control: false,
      description:
        'Remplace une ligne de fichier (contexte : `{ $implicit: UiUploadFile, remove }`).',
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    contentTemplate: {
      control: false,
      description:
        'Remplace la section de contenu (contexte : `{ $implicit: UiUploadFile[], remove, clear }`).',
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    toolbarTemplate: {
      control: false,
      description:
        "Contenu personnalisé de la barre d'outils (contexte : `{ $implicit: UiUploadFile[], choose, upload, clear }`).",
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    mode: 'field',
    size: 'default',
    multiple: false,
    auto: false,
    customUpload: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<UiFileUpload>;

/**
 * Basic — sélection de fichiers avec prise en charge du glisser-déposer
 * (équivalent du type « Field »).
 */
export const Basic: Story = {
  args: {
    mode: 'field',
    multiple: true,
    accept: 'image/*',
    ariaLabel: 'Téléverser des fichiers',
  },
};

/**
 * Auto — avec `auto`, un fichier est téléversé instantanément après sa sélection.
 */
export const Auto: Story = {
  render: (args) => ({
    props: { ...args, onUploadHandler: simulateUpload },
    template: `
      <ui-file-upload
        [mode]="mode" [size]="size" [multiple]="multiple" [accept]="accept"
        [auto]="true" [customUpload]="true" [hint]="hint"
        ariaLabel="Téléversement automatique"
        (uploadHandler)="onUploadHandler($event)"
      />
    `,
  }),
  args: { mode: 'field', multiple: true, accept: 'image/*' },
};

/**
 * Advanced — glisser-déposer, multi-fichiers, suivi de progression et validations
 * (type + taille + nombre).
 */
export const Advanced: Story = {
  render: (args) => ({
    props: { ...args, onUploadHandler: simulateUpload },
    template: `
      <div style="width: 460px; max-width: 90vw">
        <ui-file-upload
          [mode]="mode" [size]="size" [multiple]="true" [customUpload]="true"
          accept="image/*,.pdf"
          [maxFileSize]="5242880"
          [fileLimit]="5"
          hint="JPG, PNG, PDF · 5 fichiers max · 5 Mo par fichier"
          ariaLabel="Téléverser des documents"
          (uploadHandler)="onUploadHandler($event)"
        />
      </div>
    `,
  }),
  args: { mode: 'drag', size: 'default' },
};

/**
 * Custom Upload — l'implémentation du téléversement peut être remplacée en
 * activant `customUpload` et en fournissant un gestionnaire personnalisé.
 */
export const CustomUpload: Story = {
  render: (args) => ({
    props: {
      ...args,
      onUploadHandler: (event: UiUploadHandlerEvent) => {
        // Ici : envoyez `event.files` vers votre propre service / SDK, puis
        // signalez la progression et l'issue via les callbacks fournis.
        simulateUpload(event);
      },
    },
    template: `
      <div style="width: 460px; max-width: 90vw">
        <ui-file-upload
          mode="drag" [multiple]="true" [customUpload]="true"
          accept="image/*"
          hint="Gestionnaire de téléversement personnalisé"
          ariaLabel="Téléversement personnalisé"
          (uploadHandler)="onUploadHandler($event)"
        />
      </div>
    `,
  }),
  args: {},
};

/**
 * Image Preview — aperçu en grille avec vignettes + nom / taille. Au survol
 * d'une image, le bouton de suppression apparaît.
 */
export const ImagePreview: Story = {
  render: (args) => ({
    props: { ...args, onUploadHandler: simulateUpload },
    template: `
      <div style="width: 520px; max-width: 92vw">
        <ui-file-upload
          mode="drag" [multiple]="true" [customUpload]="true"
          accept="image/*"
          hint="Images uniquement"
          ariaLabel="Téléverser des images"
          [contentTemplate]="grid"
          (uploadHandler)="onUploadHandler($event)"
        />
        <ng-template #grid let-files let-remove="remove">
          @if (files.length) {
            <ul class="sb-preview-grid" role="list">
              @for (f of files; track f.id) {
                <li class="sb-preview-cell">
                  <img [src]="f.objectUrl" [alt]="f.name" />
                  <button type="button" class="sb-preview-remove"
                          [attr.aria-label]="'Supprimer ' + f.name" (click)="remove(f)">✕</button>
                  <span class="sb-preview-name" [title]="f.name">{{ f.name }}</span>
                </li>
              }
            </ul>
          }
        </ng-template>
        <style>
          .sb-preview-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
            gap:12px; margin:0; padding:0; list-style:none; }
          .sb-preview-cell { position:relative; border-radius:8px; overflow:hidden;
            border:1px solid var(--form-high-stroke-default); background:var(--form-high-surface-default); }
          .sb-preview-cell img { display:block; width:100%; height:96px; object-fit:cover; }
          .sb-preview-name { display:block; padding:6px 8px; font-size:12px;
            color:var(--form-high-content-default); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .sb-preview-remove { position:absolute; top:6px; right:6px; width:26px; height:26px;
            border:none; border-radius:50%; background:rgba(0,0,0,.55); color:#fff; cursor:pointer;
            opacity:0; transition:opacity .15s; }
          .sb-preview-cell:hover .sb-preview-remove,
          .sb-preview-remove:focus-visible { opacity:1; }
        </style>
      </div>
    `,
  }),
  args: {},
};

/**
 * Template — l'UI est personnalisable via des templates : `file` (par fichier),
 * `content` (section de contenu, reçoit les fichiers) et `toolbar` (barre d'actions).
 */
export const Template: Story = {
  render: (args) => ({
    props: { ...args, onUploadHandler: simulateUpload },
    template: `
      <div style="width: 480px; max-width: 92vw">
        <ui-file-upload
          mode="drag" [multiple]="true" [customUpload]="true"
          accept="image/*,.pdf"
          ariaLabel="Téléverser des fichiers"
          [toolbarTemplate]="toolbar"
          [fileTemplate]="file"
          (uploadHandler)="onUploadHandler($event)"
        />

        <ng-template #toolbar let-files let-choose="choose" let-upload="upload" let-clear="clear">
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button type="button" class="sb-btn" (click)="choose()">Parcourir</button>
            <button type="button" class="sb-btn" [disabled]="!files.length" (click)="upload()">
              Envoyer ({{ files.length }})
            </button>
            <button type="button" class="sb-btn ghost" [disabled]="!files.length" (click)="clear()">Vider</button>
          </div>
        </ng-template>

        <ng-template #file let-f let-remove="remove">
          <div class="sb-row">
            <span>📄 {{ f.name }} — {{ f.status }}</span>
            <button type="button" class="sb-btn ghost" [attr.aria-label]="'Retirer ' + f.name" (click)="remove(f)">Retirer</button>
          </div>
        </ng-template>

        <style>
          .sb-btn { padding:8px 14px; border-radius:8px; border:2px solid var(--actions-high-stroke-default);
            background:var(--actions-high-surface-default); color:var(--actions-high-content-default);
            font-weight:700; cursor:pointer; }
          .sb-btn.ghost { background:transparent; color:var(--actions-low-content-default);
            border-color:var(--actions-low-stroke-default); }
          .sb-btn:disabled { opacity:.5; cursor:not-allowed; }
          .sb-row { display:flex; align-items:center; justify-content:space-between; gap:12px;
            padding:8px 12px; border:1px solid var(--form-high-stroke-default); border-radius:8px;
            color:var(--form-high-content-default); }
        </style>
      </div>
    `,
  }),
  args: {},
};

/** Champ compact désactivé. */
export const Disabled: Story = {
  args: { mode: 'field', disabled: true, ariaLabel: 'Téléversement désactivé' },
};
