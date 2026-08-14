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
  { name: 'Belgium', code: 'be', dial: '+32' },
  { name: 'Switzerland', code: 'ch', dial: '+41' },
  { name: 'Luxembourg', code: 'lu', dial: '+352' },
  { name: 'Germany', code: 'de', dial: '+49' },
  { name: 'Spain', code: 'es', dial: '+34' },
  { name: 'Italy', code: 'it', dial: '+39' },
  { name: 'United Kingdom', code: 'gb', dial: '+44' },
  { name: 'United States', code: 'us', dial: '+1' },
  { name: 'Canada', code: 'ca', dial: '+1' },
];

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
        'Size passed down to the projected `ui-input-group-addon` (the controls keep their own `size`).',
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
  },
  args: {
    size: 'default',
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
        <ui-input placeholder="Username" ariaLabel="Username" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>https://</ui-input-group-addon>
        <ui-input placeholder="my-site" ariaLabel="Website address" />
        <ui-input-group-addon>.com</ui-input-group-addon>
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
        <ui-input-number [(ngModel)]="price" placeholder="Price" ariaLabel="Price" />
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
        <ui-button label="Search" [size]="size" />
        <ui-input placeholder="Keyword" ariaLabel="Keyword" />
        <ui-input-group-addon>8 results</ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input placeholder="Keyword" ariaLabel="Keyword" />
        <ui-button icon="magnifying-glass" ariaLabel="Search" level="low" variant="outlined" [size]="size" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-button icon="check" ariaLabel="Confirm vote" level="success" [size]="size" />
        <ui-input placeholder="Vote" ariaLabel="Vote" />
        <ui-button icon="xmark" ariaLabel="Cancel vote" level="error" [size]="size" />
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
        <ui-input placeholder="Price" ariaLabel="Price" />
        <ui-input-group-addon>
          <ui-radio name="priceMode" value="ttc" ariaLabel="Price incl. tax" [(ngModel)]="priceMode" />
        </ui-input-group-addon>
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>
          <ui-checkbox ariaLabel="Remember username" [(ngModel)]="checked1" />
        </ui-input-group-addon>
        <ui-input placeholder="Username" ariaLabel="Username" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>
          <ui-checkbox ariaLabel="Verified site" [(ngModel)]="checked2" />
        </ui-input-group-addon>
        <ui-input placeholder="Site" ariaLabel="Site" />
        <ui-input-group-addon>
          <ui-radio name="siteMode" value="pro" ariaLabel="Business site" [(ngModel)]="siteMode" />
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
          placeholder="Choose a city"
          ariaLabel="City"
          [(ngModel)]="city1"
          [options]="cities"
          optionLabel="label"
          optionValue="value" />
      </ui-input-group>

      <ui-input-group [size]="size">
        <ui-input-group-addon>www</ui-input-group-addon>
        <ui-input placeholder="my-site" ariaLabel="Website address" />
        <ui-select
          placeholder="City"
          ariaLabel="Home city"
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
  name: 'Phone Number',
  render: (args) => ({
    props: { ...args, phoneCodes: PHONE_CODES, dial: PHONE_CODES[0] },
    template: stack(
      `
      <ui-input-group [size]="size">
        <!-- Compact dial-code zone: panelWidth="auto" decouples the list's width
             from the field's, otherwise countries would be truncated. -->
        <ui-select
          style="max-width:120px"
          panelWidth="auto"
          ariaLabel="Country code"
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
        <ui-input type="tel" placeholder="06 12 34 56 78" ariaLabel="Phone number" />
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
        <ui-input size="small" placeholder="Username" ariaLabel="Username" />
        <ui-button size="small" icon="magnifying-glass" ariaLabel="Search" level="low" variant="outlined" />
      </ui-input-group>`),
  }),
};
