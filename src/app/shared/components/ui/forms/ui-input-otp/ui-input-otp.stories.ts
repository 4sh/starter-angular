import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UiInputOtp } from './ui-input-otp';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

const meta: Meta<UiInputOtp> = {
  title: 'Components/ui/forms/ui-input-otp',
  component: UiInputOtp,
  decorators: [
    moduleMetadata({ imports: [UiInputOtp, UiButton, CommonModule, FormsModule, ReactiveFormsModule] }),
  ],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    length: {
      control: { type: 'number', min: 2, max: 8 },
      description: 'Nombre de cellules (caractères) à saisir.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    mask: {
      control: 'boolean',
      description: 'Masque les caractères saisis (`type="password"`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    integerOnly: {
      control: 'boolean',
      description: 'N’accepte que des chiffres (`inputmode="numeric"`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'default', 'large'],
      description: 'Taille des cellules.',
      table: { type: { summary: "'small' | 'default' | 'large'" }, defaultValue: { summary: "'default'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le contrôle (attribut natif sur chaque cellule).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Cellules en lecture seule (focalisables, non éditables).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force le style d’erreur (auto quand le contrôle attaché est invalide + touché).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autofocus: {
      control: 'boolean',
      description: 'Focalise la première cellule à l’initialisation.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible du groupe (obligatoire — pas de label visible).',
      table: { type: { summary: 'string' } },
    },
    valueChange: { action: 'valueChange', table: { category: 'Outputs' } },
    completed: { action: 'completed', table: { category: 'Outputs' } },
  },
};

export default meta;
type Story = StoryObj<UiInputOtp>;

/**
 * Un mot de passe à usage unique éclaté en cellules d’un caractère. `Tab` entre
 * dans le champ, `←`/`→` naviguent, `Retour arrière` efface et recule. La frappe
 * avance automatiquement, un collage répartit le code sur les cellules.
 */
export const Basic: Story = {
  args: { length: 4 },
  render: (args) => ({
    props: args,
    template: `
      <ui-input-otp
        [length]="length"
        [mask]="mask"
        [integerOnly]="integerOnly"
        [size]="size"
        [disabled]="disabled"
        [readonly]="readonly"
        [invalid]="invalid"
        ariaLabel="Code de vérification"
      />
    `,
  }),
};

/**
 * En composant contrôlé via `[(ngModel)]` : la valeur jointe est disponible à
 * tout instant côté parent.
 */
export const Controlled: Story = {
  render: () => ({
    props: { code: '' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center">
        <ui-input-otp [(ngModel)]="code" ariaLabel="Code de vérification" />
        <p style="margin: 0; font-size: .9rem; color: var(--form-low-content-default)">
          Valeur : <strong>{{ code || '—' }}</strong>
        </p>
      </div>
    `,
  }),
};

/** Avec `mask`, les caractères sont masqués (`type="password"`). */
export const Mask: Story = {
  render: () => ({
    props: { code: '' },
    template: `
      <ui-input-otp [(ngModel)]="code" [mask]="true" ariaLabel="Code secret" />
    `,
  }),
};

/** Avec `integerOnly`, seuls les chiffres sont acceptés (clavier numérique sur mobile). */
export const IntegerOnly: Story = {
  name: 'Integer Only',
  render: () => ({
    props: { code: '' },
    template: `
      <ui-input-otp [(ngModel)]="code" [integerOnly]="true" [length]="6" ariaLabel="Code numérique" />
    `,
  }),
};

/** Trois tailles : `small`, `default` (base) et `large`. */
export const Sizes: Story = {
  render: () => ({
    props: {},
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center">
        <ui-input-otp size="small" ariaLabel="Code (small)" />
        <ui-input-otp size="default" ariaLabel="Code (default)" />
        <ui-input-otp size="large" ariaLabel="Code (large)" />
      </div>
    `,
  }),
};

/** Avec `disabled`, le composant devient non-interactif. */
export const Disabled: Story = {
  render: () => ({
    props: { code: '1234' },
    template: `
      <ui-input-otp [(ngModel)]="code" [disabled]="true" ariaLabel="Code de vérification" />
    `,
  }),
};

/**
 * L’état d’erreur s’applique via `invalid`, intégrable aux formulaires Angular
 * (ici un `FormControl` requérant les 6 chiffres).
 */
export const Invalid: Story = {
  render: () => ({
    props: {
      control: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: .75rem; align-items: center">
        <ui-input-otp [formControl]="control" [integerOnly]="true" [length]="6" ariaLabel="Code de vérification" />
        @if (control.invalid && control.touched) {
          <p style="margin: 0; font-size: .85rem; color: var(--form-error-content-default)">
            Saisissez les 6 chiffres du code.
          </p>
        }
      </div>
    `,
  }),
};

/**
 * Le template `#input` remplace la cellule par défaut par votre propre UI. Il
 * reçoit `value`, `index`, `tabindex` (roving) et `events` — les gestionnaires à
 * brancher pour conserver le comportement (navigation, collage, avance auto).
 * Ici, des cellules « soulignées » sans boîte.
 */
export const Template: Story = {
  render: () => ({
    props: { code: '' },
    template: `
      <ui-input-otp [(ngModel)]="code" [integerOnly]="true" [length]="4" ariaLabel="Code de vérification">
        <ng-template #input let-value let-i="index" let-events="events" let-tabindex="tabindex">
          <input
            [value]="value"
            [attr.tabindex]="tabindex"
            maxlength="1"
            inputmode="numeric"
            aria-label="Chiffre"
            style="
              width: 3rem; height: 3.25rem; margin: 0; padding: 0;
              border: none; border-bottom: 2px solid var(--form-high-stroke-default);
              background: transparent; text-align: center;
              font-family: var(--fontfamily-base); font-size: var(--size-typography-text-xl);
              font-weight: var(--weight-bold); color: var(--form-high-content-default);
              outline: none; caret-color: var(--form-high-content-default);"
            (input)="events.input($event)"
            (keydown)="events.keydown($event)"
            (focus)="events.focus($event)"
            (blur)="events.blur($event)"
            (paste)="events.paste($event)"
          />
        </ng-template>
      </ui-input-otp>
    `,
  }),
};

/**
 * Implémentation d’exemple avec templating et éléments additionnels (séparateur
 * central, titres et actions), composée avec les composants existants de la
 * librairie (`ui-button`).
 */
/** Local state for the Sample: keeps the joined code + reacts to `completed`. */
function sampleState() {
  return {
    code: '',
    onComplete(value: string): void {
      this.code = value;
    },
  };
}

export const Sample: Story = {
  render: () => ({
    props: sampleState(),
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center; text-align: center; max-width: 26rem">
        <div>
          <h2 style="margin: 0 0 .25rem; font-family: var(--fontfamily-base); color: var(--global-high-content-default)">
            Authenticate Your Account
          </h2>
          <p style="margin: 0; color: var(--form-low-content-default)">
            Please enter the code sent to your phone.
          </p>
        </div>

        <ui-input-otp
          [(ngModel)]="code"
          [integerOnly]="true"
          [length]="6"
          ariaLabel="Code d’authentification"
          (completed)="onComplete($event)"
        >
          <ng-template #input let-value let-i="index" let-events="events" let-tabindex="tabindex">
            @if (i === 3) {
              <span aria-hidden="true" style="color: var(--form-low-content-default); padding: 0 .25rem">—</span>
            }
            <input
              [value]="value"
              [attr.tabindex]="tabindex"
              maxlength="1"
              inputmode="numeric"
              aria-label="Chiffre"
              style="
                width: 2.75rem; height: 2.75rem; margin: 0; padding: 0;
                border: 2px solid var(--form-high-stroke-default); border-radius: var(--radius-sm);
                background: var(--form-high-surface-default); text-align: center;
                font-family: var(--fontfamily-base); font-size: var(--size-typography-text-default);
                font-weight: var(--weight-bold); color: var(--form-high-content-default); outline: none;"
              (input)="events.input($event)"
              (keydown)="events.keydown($event)"
              (focus)="events.focus($event)"
              (blur)="events.blur($event)"
              (paste)="events.paste($event)"
            />
          </ng-template>
        </ui-input-otp>

        <div style="display: flex; gap: 1rem; align-items: center">
          <ui-button label="Resend Code" level="low" />
          <ui-button label="Submit Code" level="high" [disabled]="code.length < 6" />
        </div>
      </div>
    `,
  }),
};
