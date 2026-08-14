import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiInput } from '@4sh/ui-kit/forms/ui-input';
import { UiAlert } from '@4sh/ui-kit/informative/ui-alert';

/**
 * Demo host for the "Life" story: a real component so the `@if` toggle is driven
 * by a signal (Storybook's plain `props` methods don't reliably trigger CD).
 * Re-showing destroys/re-creates the alert, restarting its `life` timer.
 */
@Component({
  selector: 'demo-alert-life',
  imports: [UiAlert, UiButton],
  template: `
    <div style="display:flex; flex-direction:column; gap:12px; max-width:520px; align-items:flex-start;">
      <ui-button label="Afficher l'alerte (3s)" icon="bell" (buttonClick)="show()" />
      @if (visible()) {
        <ui-alert
          level="success"
          title="Saved"
          text="This message disappears after 3 seconds."
          [life]="3000"
          (closed)="visible.set(false)"
        />
      }
    </div>
  `,
})
class AlertLifeDemo {
  protected readonly visible = signal(true);

  protected show(): void {
    // Toggle off then on so @if re-creates the alert → fresh life timer.
    this.visible.set(false);
    setTimeout(() => this.visible.set(true));
  }
}

/**
 * Demo host for the "Forms" story: a reactive form whose error summary alert
 * mirrors real validation — it appears once the field is invalid (after a submit
 * or blur) and disappears the moment the value becomes valid.
 */
@Component({
  selector: 'demo-alert-forms',
  imports: [UiAlert, UiInput, UiButton, ReactiveFormsModule],
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="submitted.set(true)"
      style="display:flex; flex-direction:column; gap:16px; max-width:520px;"
    >
      @if (submitted() && form.invalid) {
        <ui-alert
          level="error"
          [closable]="false"
          title="The form contains errors"
          text="Fix the flagged field before continuing."
        />
      } @else if (submitted() && form.valid) {
        <ui-alert level="success" title="Valid form" text="You can continue." />
      }

      <ui-input
        label="Email"
        type="email"
        formControlName="email"
        placeholder="prenom.nom@exemple.fr"
        [required]="true"
        [invalid]="isFieldInvalid()"
        errorText="Enter a valid email address."
      />

      <ui-button type="submit" label="Submit" />
    </form>
  `,
})
class AlertFormsDemo {
  protected readonly submitted = signal(false);
  protected readonly form = new FormGroup({
    email: new FormControl('invalide', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected isFieldInvalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || this.submitted());
  }
}

const meta: Meta<UiAlert> = {
  title: 'Components/ui/informative/ui-alert',
  component: UiAlert,
  decorators: [moduleMetadata({ imports: [UiAlert] })],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=148-921&t=ZkEBcmc0a9eKeNGH-1',
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Ligne de titre (gras).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    text: {
      control: { type: 'text' },
      description: 'Corps du message.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: { type: 'select' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Niveau de feedback (famille de couleur + icône par défaut).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    subLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Intensité : high (soutenu) ou low (discret).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'large'],
      description: 'Taille de rendu.',
      table: { type: { summary: 'UiAlertSize' }, defaultValue: { summary: '"default"' } },
    },
    icon: {
      control: { type: 'text' },
      description:
        "Icône de tête : nom FontAwesome pour surcharger, `false` pour masquer, `true` pour l'icône par défaut du niveau.",
      table: { type: { summary: 'string | boolean' }, defaultValue: { summary: 'true' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Affiche le bouton de fermeture.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeIcon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome du bouton de fermeture.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"times-circle"' } },
    },
    closeAriaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible du bouton de fermeture.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Close"' } },
    },
    life: {
      control: { type: 'number' },
      description: 'Délai (ms) avant auto-disparition. `0` = jamais.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la région alerte.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    closed: { action: 'closed', table: { category: 'Events' } },
  },
  args: {
    title: 'Alert title',
    text: 'Alert text',
    level: 'default',
    subLevel: 'high',
    size: 'default',
    icon: true,
    closable: true,
  },
};

export default meta;
type Story = StoryObj<UiAlert>;

/** Basic : message inline informatif. */
export const Basic: Story = {};

// --- Level : la sévérité du message ---------------------------------
export const Info: Story = { args: { level: 'default', title: 'Information', text: 'An informational message.' } };
export const Highlight: Story = { args: { level: 'highlight', title: 'Note', text: 'Highlighted information.' } };
export const Success: Story = { args: { level: 'success', title: 'Success', text: 'Operation completed.' } };
export const Warning: Story = { args: { level: 'warning', title: 'Attention', text: 'Check the information.' } };
export const Error: Story = { args: { level: 'error', title: 'Error', text: "The operation failed." } };

/** Icon : icône personnalisée ou masquée. */
export const CustomIcon: Story = { args: { level: 'highlight', icon: 'bell', title: 'Notification', text: 'Icon overridden.' } };
export const NoIcon: Story = { args: { level: 'success', icon: false, title: 'No icon', text: 'Icon hidden.' } };

/** Variant : sous-niveau low (discret) vs high (soutenu). */
export const SubLevelLow: Story = { args: { level: 'error', subLevel: 'low', title: 'Error', text: 'Low variant.' } };

/** Sizes : default et large. */
export const Large: Story = { args: { level: 'success', size: 'large', title: 'Success', text: 'Large size.' } };

/** Dynamic : plusieurs messages via un bloc `@for`, retirés à la fermeture. */
export const Dynamic: Story = {
  render: () => ({
    props: {
      messages: [
        { id: 1, level: 'success', title: 'Success', text: 'File imported.' },
        { id: 2, level: 'warning', title: 'Attention', text: 'Quota almost reached.' },
        { id: 3, level: 'error', title: 'Error', text: 'Second file import failed.' },
      ] as { id: number; level: string; title: string; text: string }[],
      remove(this: { messages: { id: number }[] }, id: number) {
        this.messages = this.messages.filter((m) => m.id !== id);
      },
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; max-width:520px;">
        @for (m of messages; track m.id) {
          <ui-alert [level]="m.level" [title]="m.title" [text]="m.text" (closed)="remove(m.id)" />
        }
      </div>
    `,
  }),
};

/** Life : disparaît automatiquement après un délai (ms). Cliquer réaffiche. */
export const Life: Story = {
  render: () => ({
    moduleMetadata: { imports: [AlertLifeDemo] },
    template: `<demo-alert-life />`,
  }),
};

/** Forms : le résumé d'erreurs apparaît à la validation et disparaît quand le champ devient valide. */
export const Forms: Story = {
  render: () => ({
    moduleMetadata: { imports: [AlertFormsDemo] },
    template: `<demo-alert-forms />`,
  }),
};
