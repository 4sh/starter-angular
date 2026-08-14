import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiStep,
  UiStepItem,
  UiStepList,
  UiStepPanel,
  UiStepPanels,
  UiStepper,
} from '@4sh/ui-kit/navigation/ui-stepper';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const meta: Meta<UiStepper> = {
  title: 'Components/ui/navigation/ui-stepper',
  component: UiStepper,
  decorators: [
    moduleMetadata({
      imports: [
        UiStepper,
        UiStepList,
        UiStep,
        UiStepPanels,
        UiStepPanel,
        UiStepItem,
        UiButton,
        UiTag,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2085-3935&t=qGat58xYmoFJ9Z9t-1',
    },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Axe de la progression : en-têtes en haut (horizontal) ou empilés (vertical).',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    linear: {
      control: { type: 'boolean' },
      description: "Empêche de sauter en avant : les étapes situées après l'étape active sont désactivées.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    lazy: {
      control: { type: 'boolean' },
      description: "Défaut de groupe : ne rend le contenu d'un panneau qu'à sa première activation.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Anime l'apparition du panneau actif (reduced-motion respecté).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    completedIcon: {
      control: { type: 'text' },
      description: 'Icône affichée dans le marqueur des étapes terminées (sinon le numéro).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    orientation: 'horizontal',
    linear: false,
    lazy: false,
    motion: true,
  },
};

export default meta;
type Story = StoryObj<UiStepper>;

const LOREM =
  'Fill in the requested information then move on. You can come back to this step at any time.';

// Fixed-width shell so the stepper reads like the Figma frame.
const box = (inner: string, width = 685) => `<div style="max-width:${width}px">${inner}</div>`;

// --- Horizontal (Basic) ----------------------------------------------------
// Combinaison ui-step-list + ui-step-panels : chaque étape et son panneau sont
// appariés par leur `value`.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, active: 1 },
    template: box(`
      <ui-stepper [(value)]="active" [orientation]="orientation" [linear]="linear" [motion]="motion" [completedIcon]="completedIcon">
        <ui-step-list ariaLabel="Account creation">
          <ui-step [value]="1">Account</ui-step>
          <ui-step [value]="2">Profile</ui-step>
          <ui-step [value]="3">Confirmation</ui-step>
        </ui-step-list>
        <ui-step-panels>
          <ui-step-panel [value]="1">Étape 1 , ${LOREM}</ui-step-panel>
          <ui-step-panel [value]="2">Étape 2 , ${LOREM}</ui-step-panel>
          <ui-step-panel [value]="3">Étape 3 , ${LOREM}</ui-step-panel>
        </ui-step-panels>
      </ui-stepper>`),
  }),
};

// --- Vertical --------------------------------------------------------------
// Le layout vertical utilise ui-step-item comme enveloppe d'un ui-step et de
// son ui-step-panel : le panneau s'affiche juste sous son en-tête.
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => ({
    props: { ...args, active: 1 },
    template: box(`
      <ui-stepper [(value)]="active" orientation="vertical" [motion]="motion" ariaLabel="Installation">
        <ui-step-item [value]="1">
          <ui-step [value]="1">Prerequisites</ui-step>
          <ui-step-panel [value]="1">Vérifiez que votre environnement est prêt. ${LOREM}</ui-step-panel>
        </ui-step-item>
        <ui-step-item [value]="2">
          <ui-step [value]="2">Configuration</ui-step>
          <ui-step-panel [value]="2">Renseignez les paramètres du projet. ${LOREM}</ui-step-panel>
        </ui-step-item>
        <ui-step-item [value]="3">
          <ui-step [value]="3">Done</ui-step>
          <ui-step-panel [value]="3">Everything is ready, you can start.</ui-step-panel>
        </ui-step-item>
      </ui-stepper>`, 480),
  }),
};

// --- Linear ----------------------------------------------------------------
// Avec `linear`, il faut compléter l'étape courante pour avancer : les étapes
// suivantes sont désactivées, on progresse via les boutons (`value` piloté).
export const Linear: Story = {
  args: { linear: true },
  render: (args) => ({
    props: { ...args, active: 1 },
    template: box(`
      <ui-stepper [(value)]="active" [linear]="linear" [motion]="motion" completedIcon="check">
        <ui-step-list ariaLabel="Order">
          <ui-step [value]="1">Cart</ui-step>
          <ui-step [value]="2">Delivery</ui-step>
          <ui-step [value]="3">Payment</ui-step>
        </ui-step-list>
        <ui-step-panels>
          <ui-step-panel [value]="1">
            <p>Check your cart.</p>
            <ui-button size="small" (buttonClick)="active = 2">Continuer</ui-button>
          </ui-step-panel>
          <ui-step-panel [value]="2">
            <p>Choose the delivery method.</p>
            <div style="display:flex; gap:8px">
              <ui-button size="small" level="low" (buttonClick)="active = 1">Retour</ui-button>
              <ui-button size="small" (buttonClick)="active = 3">Continuer</ui-button>
            </div>
          </ui-step-panel>
          <ui-step-panel [value]="3">
            <p>Complete the payment.</p>
            <ui-button size="small" level="low" (buttonClick)="active = 2">Retour</ui-button>
          </ui-step-panel>
        </ui-step-panels>
      </ui-stepper>`),
  }),
};

// --- Steps Only ------------------------------------------------------------
// Un ui-step-list seul, sans panneaux : simple indicateur de progression.
export const StepsOnly: Story = {
  render: (args) => ({
    props: { ...args, active: 2 },
    template: box(`
      <ui-stepper [(value)]="active" [motion]="motion" completedIcon="check">
        <ui-step-list ariaLabel="Progression">
          <ui-step [value]="1">Quote</ui-step>
          <ui-step [value]="2">Validation</ui-step>
          <ui-step [value]="3">Production</ui-step>
          <ui-step [value]="4">Delivery</ui-step>
        </ui-step-list>
      </ui-stepper>`),
  }),
};

// --- Template --------------------------------------------------------------
// Panneaux au balisage libre intégrant des composants de la librairie
// (ui-tag, ui-button) et marqueur d'étape terminée personnalisé.
export const Template: Story = {
  render: (args) => ({
    props: { ...args, active: 2 },
    template: box(`
      <ui-stepper [(value)]="active" [motion]="motion" completedIcon="check">
        <ui-step-list ariaLabel="Publication">
          <ui-step [value]="1" icon="pen">Drafting</ui-step>
          <ui-step [value]="2" icon="eye">Review</ui-step>
          <ui-step [value]="3" icon="rocket">Publication</ui-step>
        </ui-step-list>
        <ui-step-panels>
          <ui-step-panel [value]="1">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
              <strong>Drafting</strong> <ui-tag label="Done" level="success" size="small" />
            </div>
            <p>${LOREM}</p>
          </ui-step-panel>
          <ui-step-panel [value]="2">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
              <strong>Review</strong> <ui-tag label="En cours" level="highlight" size="small" />
            </div>
            <p>${LOREM}</p>
            <ui-button size="small" (buttonClick)="active = 3">Publish</ui-button>
          </ui-step-panel>
          <ui-step-panel [value]="3">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
              <strong>Publication</strong> <ui-tag label="Upcoming" level="warning" size="small" />
            </div>
            <p>${LOREM}</p>
          </ui-step-panel>
        </ui-step-panels>
      </ui-stepper>`),
  }),
};

// --- Controlled ------------------------------------------------------------
// L'étape active est pilotée de l'extérieur via le modèle two-way `[(value)]`.
export const Controlled: Story = {
  render: (args) => ({
    props: { ...args, active: 1 },
    template: box(`
      <div style="display:flex; gap:8px; margin-bottom:16px">
        <ui-button size="small" level="low" (buttonClick)="active = 1">1</ui-button>
        <ui-button size="small" level="low" (buttonClick)="active = 2">2</ui-button>
        <ui-button size="small" level="low" (buttonClick)="active = 3">3</ui-button>
      </div>
      <ui-stepper [(value)]="active" [motion]="motion">
        <ui-step-list ariaLabel="Controlled steps">
          <ui-step [value]="1">Un</ui-step>
          <ui-step [value]="2">Two</ui-step>
          <ui-step [value]="3">Three</ui-step>
        </ui-step-list>
        <ui-step-panels>
          <ui-step-panel [value]="1">Content 1</ui-step-panel>
          <ui-step-panel [value]="2">Content 2</ui-step-panel>
          <ui-step-panel [value]="3">Content 3</ui-step-panel>
        </ui-step-panels>
      </ui-stepper>
      <p style="margin-top:16px; font-size:13px">Active step: <strong>{{ active }}</strong></p>`),
  }),
};
