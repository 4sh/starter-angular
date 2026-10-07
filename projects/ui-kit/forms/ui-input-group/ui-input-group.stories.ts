import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiInputGroup } from '@4sh/ui-kit/forms/ui-input-group';
import { UiInputGroupAddon } from '@4sh/ui-kit/forms/ui-input-group';
import { UiInput } from '@4sh/ui-kit/forms/ui-input';
import { UiInputNumber } from '@4sh/ui-kit/forms/ui-input-number';
import { UiSelect } from '@4sh/ui-kit/forms/ui-select';
import { UiCheckbox } from '@4sh/ui-kit/forms/ui-checkbox';
import { UiRadio } from '@4sh/ui-kit/forms/ui-radio';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

interface PhoneCode {
  name: string;
  code: string;
  dial: string;
}

const PHONE_CODES: PhoneCode[] = [
  { name: 'France', code: 'fr', dial: '+33' },
  { name: 'Belgique', code: 'be', dial: '+32' },
  { name: 'Suisse', code: 'ch', dial: '+41' },
  { name: 'Luxembourg', code: 'lu', dial: '+352' },
  { name: 'Allemagne', code: 'de', dial: '+49' },
  { name: 'Espagne', code: 'es', dial: '+34' },
  { name: 'Italie', code: 'it', dial: '+39' },
  { name: 'Royaume-Uni', code: 'gb', dial: '+44' },
  { name: 'États-Unis', code: 'us', dial: '+1' },
  { name: 'Canada', code: 'ca', dial: '+1' },
];

const CURRENCIES = ['EUR', 'USD', 'CHF', 'GBP'];

const CITIES = [
  { label: 'Paris', value: 'par' },
  { label: 'Lyon', value: 'lyo' },
  { label: 'Marseille', value: 'mrs' },
  { label: 'Bordeaux', value: 'bod' },
  { label: 'Lille', value: 'lil' },
];

const meta: Meta<UiInputGroup> = {
  title: 'Components/ui/forms/ui-input-group',
  component: UiInputGroup,
  decorators: [
    moduleMetadata({
      imports: [
        UiInputGroup,
        UiInputGroupAddon,
        UiInput,
        UiInputNumber,
        UiSelect,
        UiCheckbox,
        UiRadio,
        UiButton,
        UiIcon,
        FormsModule,
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description:
        'Taille transmise au libellé et aux `ui-input-group-addon` projetés (les contrôles gardent leur propre `size`).',
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    label: {
      control: 'text',
      description:
        'Libellé au-dessus du groupe (via `ui-label`). Il nomme le groupe (`role="group"`), pas les contrôles, qui gardent leur `ariaLabel`.',
      table: { type: { summary: 'string' } },
    },
    required: {
      control: 'boolean',
      description:
        'Astérisque sur le libellé, purement visuel : les contrôles obligatoires portent eux-mêmes `required`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    message: {
      control: 'text',
      description:
        'Message sous le groupe (aide ou erreur, via `ui-helper`), relié au groupe par `aria-describedby`.',
      table: { type: { summary: 'string' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      description:
        'Statut de validation : teinte le message et les bordures des champs et add-ons projetés. Prime sur le `level` propre des contrôles.',
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    showMessageIcon: {
      control: 'boolean',
      description: "Préfixe le message d'une icône décorative. Éteinte par défaut.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    messageIcon: {
      control: 'text',
      description:
        "Glyphe du message. Vide = l'icône déduite du `level`. N'allume pas l'icône à lui seul.",
      table: { type: { summary: 'string' } },
    },
    merged: {
      control: 'boolean',
      description:
        'Une seule boîte autour de la rangée : ni trait ni espace entre les items, un seul anneau de focus.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    size: 'default',
    required: false,
    level: 'default',
    showMessageIcon: false,
    merged: false,
  },
};

export default meta;
type Story = StoryObj<UiInputGroup>;

// Empile plusieurs groupes dans une colonne de largeur fixe.
// Colonne flex (et non grid) : une piste grid `auto` s'étirerait à la taille
// max-content de la rangée, plus large que la colonne demandée.
const stack = (inner: string, width = 340) =>
  `<div style="display:flex; flex-direction:column; gap:16px; width:${width}px;">${inner}</div>`;

// Rendu d'un indicatif : drapeau local + code international.
const flag = (size = 20) =>
  `<img [src]="'assets/img/common/svg/flags/' + c.code + '.svg'" alt="" width="${size}" height="${Math.round(
    (size * 3) / 4,
  )}" style="border-radius:2px; object-fit:cover;" />`;

// --- Basic : un contrôle + des add-ons texte ou icône -----------------------
export const Basic: Story = {
  render: (args) => ({
    props: args,
    template: stack(`
      <ui-input-group [size]="size">
        <ui-input-group-addon><ui-icon name="user" size="sm" /></ui-input-group-addon>
        <ui-input placeholder="Nom d'utilisateur" ariaLabel="Nom d'utilisateur" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>https://</ui-input-group-addon>
        <ui-input placeholder="mon-site" ariaLabel="Adresse du site" />
        <ui-input-group-addon>.com</ui-input-group-addon>
      </ui-input-group>`),
  }),
};

// --- Field : libellé au-dessus, message en dessous -----------------------------
export const Field: Story = {
  name: 'Label & Message',
  args: {
    label: 'Site web',
    message: 'Le nom de domaine seul, sans « www. ».',
  },
  render: (args) => ({
    props: args,
    template: stack(`
      <ui-input-group
        [size]="size"
        [label]="label"
        [required]="required"
        [message]="message"
        [level]="level"
        [showMessageIcon]="showMessageIcon"
        [messageIcon]="messageIcon"
        [merged]="merged">
        <ui-input-group-addon>https://</ui-input-group-addon>
        <ui-input placeholder="mon-site" ariaLabel="Nom de domaine" [size]="size" />
        <ui-input-group-addon>.fr</ui-input-group-addon>
      </ui-input-group>`),
  }),
};

// --- Levels : le statut teinte le message et toutes les bordures du groupe ------
export const Levels: Story = {
  render: (args) => ({
    props: { ...args, amount1: 1200, amount2: 1200, amount3: 120000 },
    template: stack(`
      <ui-input-group [size]="size" label="Montant" message="Montant hors taxes.">
        <ui-input-number [(ngModel)]="amount1" ariaLabel="Montant" />
        <ui-input-group-addon>€</ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size" label="Montant" level="success" message="Montant dans le budget.">
        <ui-input-number [(ngModel)]="amount2" ariaLabel="Montant" />
        <ui-input-group-addon>€</ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size" label="Montant" level="error" message="Montant supérieur au plafond de 100 000 €.">
        <ui-input-number [(ngModel)]="amount3" ariaLabel="Montant" invalid />
        <ui-input-group-addon>€</ui-input-group-addon>
      </ui-input-group>`),
  }),
};

// --- Merged : une seule boîte, sans trait entre les items ----------------------
export const Merged: Story = {
  render: (args) => ({
    props: { ...args, amount: 1200, currencies: CURRENCIES, currency: 'EUR' },
    template: stack(`
      <ui-input-group [size]="size" label="Site web" merged>
        <ui-input-group-addon>https://</ui-input-group-addon>
        <ui-input placeholder="mon-site" ariaLabel="Nom de domaine" [size]="size" />
        <ui-input-group-addon>.fr</ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size" label="Montant" merged>
        <ui-input-number [(ngModel)]="amount" ariaLabel="Montant" [showButtons]="false" [size]="size" />
        <ui-select
          style="--ui-input-group-item-flex: none"
          panelWidth="auto"
          ariaLabel="Devise"
          [size]="size"
          [(ngModel)]="currency"
          [options]="currencies" />
      </ui-input-group>`),
  }),
};

// --- Multiple : plusieurs add-ons de chaque côté ----------------------------
export const Multiple: Story = {
  render: (args) => ({
    props: { ...args, price: 100 },
    template: stack(
      `
      <ui-input-group [size]="size">
        <ui-input-group-addon><ui-icon name="clock" size="sm" /></ui-input-group-addon>
        <ui-input-group-addon><ui-icon name="star" size="sm" /></ui-input-group-addon>
        <ui-input-number [(ngModel)]="price" placeholder="Prix" ariaLabel="Prix" />
        <ui-input-group-addon>€</ui-input-group-addon>
        <ui-input-group-addon>,00</ui-input-group-addon>
      </ui-input-group>`,
      400,
    ),
  }),
};

// --- Button : boutons d'un côté ou de l'autre du contrôle -------------------
export const Button: Story = {
  render: (args) => ({
    props: args,
    template: stack(`
      <ui-input-group [size]="size">
        <ui-button label="Rechercher" [size]="size" />
        <ui-input placeholder="Mot-clé" ariaLabel="Mot-clé" />
        <ui-input-group-addon>8 résultats</ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input placeholder="Mot-clé" ariaLabel="Mot-clé" />
        <ui-button icon="magnifying-glass" ariaLabel="Rechercher" level="low" variant="outlined" [size]="size" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-button icon="check" ariaLabel="Valider le vote" level="success" [size]="size" />
        <ui-input placeholder="Vote" ariaLabel="Vote" />
        <ui-button icon="xmark" ariaLabel="Annuler le vote" level="error" [size]="size" />
      </ui-input-group>`),
  }),
};

// --- Checkbox & Radio : contrôles de sélection dans un add-on ---------------
export const CheckboxRadio: Story = {
  name: 'Checkbox & Radio',
  render: (args) => ({
    props: { ...args, checked1: false, checked2: false, priceMode: 'ttc', siteMode: undefined },
    template: stack(`
      <ui-input-group [size]="size">
        <ui-input placeholder="Prix" ariaLabel="Prix" />
        <ui-input-group-addon>
          <ui-radio name="priceMode" value="ttc" ariaLabel="Prix TTC" [(ngModel)]="priceMode" />
        </ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>
          <ui-checkbox ariaLabel="Mémoriser le nom d'utilisateur" [(ngModel)]="checked1" />
        </ui-input-group-addon>
        <ui-input placeholder="Nom d'utilisateur" ariaLabel="Nom d'utilisateur" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>
          <ui-checkbox ariaLabel="Site vérifié" [(ngModel)]="checked2" />
        </ui-input-group-addon>
        <ui-input placeholder="Site" ariaLabel="Site" />
        <ui-input-group-addon>
          <ui-radio name="siteMode" value="pro" ariaLabel="Site professionnel" [(ngModel)]="siteMode" />
        </ui-input-group-addon>
      </ui-input-group>`),
  }),
};

// --- Select : une liste déroulante posée dans le groupe ---------------------
export const Select: Story = {
  render: (args) => ({
    props: { ...args, cities: CITIES, city1: undefined, city2: undefined },
    template: stack(
      `
      <ui-input-group [size]="size">
        <ui-input-group-addon><ui-icon name="location-dot" size="sm" /></ui-input-group-addon>
        <ui-select
          placeholder="Choisir une ville"
          ariaLabel="Ville"
          [(ngModel)]="city1"
          [options]="cities"
          optionLabel="label"
          optionValue="value" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>www</ui-input-group-addon>
        <ui-input placeholder="mon-site" ariaLabel="Adresse du site" />
        <ui-select
          placeholder="Ville"
          ariaLabel="Ville de rattachement"
          [(ngModel)]="city2"
          [options]="cities"
          optionLabel="label"
          optionValue="value" />
      </ui-input-group>`,
      420,
    ),
  }),
};

// --- Phone Number : indicatif (drapeau local) + numéro ----------------------
export const PhoneNumber: Story = {
  args: {
    merged: true,
    dialIcon: true,
  } as Story['args'],

  argTypes: {
    dialIcon: {
      name: 'chevron (indicatif)',
      control: 'boolean',
      description: 'Chevron du `ui-select` de l’indicatif (`showIcon`). Propre à cette story.',
    },
  } as Story['argTypes'],

  name: 'Phone Number',

  render: (args) => ({
    props: {
      ...args,
      phoneCodes: PHONE_CODES,
      dial: PHONE_CODES[0],
      phone: '06 12 34',
      // Règle de démo (9 chiffres) : la validation par pays reste au projet.
      phoneError: (value?: string) =>
        (value ?? '').replace(/\D/g, '').length >= 9 ? undefined : 'Numéro invalide',
    },
    template: stack(
      `
      <ui-input-group
        [size]="size"
        label="Téléphone"
        required
        [merged]="merged"
        [level]="phoneError(phone) ? 'error' : 'default'"
        [message]="phoneError(phone)">
        <!-- panelWidth="auto" : sinon la liste prend la largeur de l'indicatif. -->
        <ui-select
          style="--ui-input-group-item-flex: none"
          panelWidth="auto"
          ariaLabel="Indicatif du pays"
          [showIcon]="dialIcon"
          [filter]="true"
          filterBy="name,dial,code"
          filterPlaceholder="Pays ou indicatif"
          [(ngModel)]="dial"
          [options]="phoneCodes"
          optionLabel="dial">
          <ng-template #selectedItem let-c>
            <span style="display:flex; align-items:center; gap:8px;">
              ${flag(20)}
              <span>{{ c.dial }}</span>
            </span>
          </ng-template>
          <ng-template #item let-c>
            <span style="display:flex; align-items:center; gap:8px;">
              ${flag(20)}
              <span>{{ c.name }}</span>
              <span style="margin-left:auto; opacity:.7;">{{ c.dial }}</span>
            </span>
          </ng-template>
        </ui-select>
        <ui-input
          type="tel"
          placeholder="06 12 34 56 78"
          ariaLabel="Numéro de téléphone"
          [(ngModel)]="phone"
          required
          [invalid]="!!phoneError(phone)" />
      </ui-input-group>`,
      340,
    ),
  }),
};

// --- Small : le groupe transmet sa taille aux add-ons -----------------------
export const Small: Story = {
  render: () => ({
    props: {},
    template: stack(`
      <ui-input-group size="small">
        <ui-input-group-addon><ui-icon name="user" size="sm" /></ui-input-group-addon>
        <ui-input size="small" placeholder="Nom d'utilisateur" ariaLabel="Nom d'utilisateur" />
        <ui-button size="small" icon="magnifying-glass" ariaLabel="Rechercher" level="low" variant="outlined" />
      </ui-input-group>`),
  }),
};
