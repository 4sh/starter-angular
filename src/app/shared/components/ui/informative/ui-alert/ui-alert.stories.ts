import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiInput } from '@app/shared/components/ui/forms/ui-input/ui-input';
import { UiAlert } from '@app/shared/components/ui/informative/ui-alert/ui-alert';

/**
 * Demo host for the "Life" story: a real component so the `@if` toggle is driven
 * by a signal (Storybook's plain `props` methods don't reliably trigger CD).
 * Re-showing destroys/re-creates the alert, restarting its `life` timer.
 */
@Component({
  selector: 'sb-alert-life',
  imports: [UiAlert, UiButton],
  template: `
    <div style="display:flex; flex-direction:column; gap:12px; max-width:520px; align-items:flex-start;">
      <ui-button label="Afficher l'alerte (3s)" icon="bell" (buttonClick)="show()" />
      @if (visible()) {
        <ui-alert
          level="success"
          title="Enregistré"
          text="Ce message disparaît après 3 secondes."
          [life]="3000"
          (close)="visible.set(false)"
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
  selector: 'sb-alert-forms',
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
          title="Le formulaire contient des erreurs"
          text="Corrigez le champ signalé avant de continuer."
        />
      } @else if (submitted() && form.valid) {
        <ui-alert level="success" title="Formulaire valide" text="Vous pouvez continuer." />
      }

      <ui-input
        label="Email"
        type="email"
        formControlName="email"
        placeholder="prenom.nom@exemple.fr"
        [required]="true"
        [invalid]="isFieldInvalid()"
        errorText="Saisissez une adresse e-mail valide."
      />

      <ui-button type="submit" label="Valider" />
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
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Fermer"' } },
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
    close: { action: 'close', table: { category: 'Events' } },
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
export const Info: Story = { args: { level: 'default', title: 'Information', text: 'Un message informatif.' } };
export const Highlight: Story = { args: { level: 'highlight', title: 'À noter', text: 'Une information mise en avant.' } };
export const Success: Story = { args: { level: 'success', title: 'Succès', text: 'Opération réalisée.' } };
export const Warning: Story = { args: { level: 'warning', title: 'Attention', text: 'Vérifiez les informations.' } };
export const Error: Story = { args: { level: 'error', title: 'Erreur', text: "L'opération a échoué." } };

/** Icon : icône personnalisée ou masquée. */
export const CustomIcon: Story = { args: { level: 'highlight', icon: 'bell', title: 'Notification', text: 'Icône surchargée.' } };
export const NoIcon: Story = { args: { level: 'success', icon: false, title: 'Sans icône', text: 'Icône masquée.' } };

/** Variant : sous-niveau low (discret) vs high (soutenu). */
export const SubLevelLow: Story = { args: { level: 'error', subLevel: 'low', title: 'Erreur', text: 'Variante low.' } };

/** Sizes : default et large. */
export const Large: Story = { args: { level: 'success', size: 'large', title: 'Succès', text: 'Taille large.' } };

/** Dynamic : plusieurs messages via un bloc `@for`, retirés à la fermeture. */
export const Dynamic: Story = {
  render: () => ({
    props: {
      messages: [
        { id: 1, level: 'success', title: 'Succès', text: 'Fichier importé.' },
        { id: 2, level: 'warning', title: 'Attention', text: 'Quota bientôt atteint.' },
        { id: 3, level: 'error', title: 'Erreur', text: 'Import du 2e fichier échoué.' },
      ] as { id: number; level: string; title: string; text: string }[],
      remove(this: { messages: { id: number }[] }, id: number) {
        this.messages = this.messages.filter((m) => m.id !== id);
      },
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; max-width:520px;">
        @for (m of messages; track m.id) {
          <ui-alert [level]="m.level" [title]="m.title" [text]="m.text" (close)="remove(m.id)" />
        }
      </div>
    `,
  }),
};

/** Life : disparaît automatiquement après un délai (ms). Cliquer réaffiche. */
export const Life: Story = {
  render: () => ({
    moduleMetadata: { imports: [AlertLifeDemo] },
    template: `<sb-alert-life />`,
  }),
};

/** Forms : le résumé d'erreurs apparaît à la validation et disparaît quand le champ devient valide. */
export const Forms: Story = {
  render: () => ({
    moduleMetadata: { imports: [AlertFormsDemo] },
    template: `<sb-alert-forms />`,
  }),
};
