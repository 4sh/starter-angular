import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { provideUiIconFamilies } from '@app/shared/components/ui/ui-icon/ui-icon-families';

const meta: Meta<UiIcon> = {
  title: 'Components/ui/ui-icon',
  component: UiIcon,
  decorators: [moduleMetadata({ imports: [UiIcon] })],
  parameters: { layout: 'centered' },
  argTypes: {
    name: {
      control: { type: 'text' },
      description: "Nom de l'icône pour la famille sélectionnée (ex. circle-user)",
      table: { type: { summary: 'string' } },
    },
    family: {
      control: { type: 'text' },
      description: "Clé de la famille d'icônes (défaut : famille configurée, sinon fontawesome).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'fontawesome' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'default', 'lg', 'xl'],
      table: { type: { summary: 'UiIconSize' }, defaultValue: { summary: 'default' } },
    },
    type: {
      control: { type: 'inline-radio' },
      options: ['solid', 'outline'],
      table: { type: { summary: 'UiIconType' }, defaultValue: { summary: 'solid' } },
    },
    decorative: {
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: { control: { type: 'text' }, table: { type: { summary: 'string' } } },
  },
};
export default meta;
type Story = StoryObj<UiIcon>;

export const Solid: Story = { args: { name: 'circle-user', size: 'lg', type: 'solid' } };
export const Outline: Story = { args: { name: 'circle-user', size: 'lg', type: 'outline' } };
export const Meaningful: Story = {
  args: { name: 'triangle-exclamation', size: 'lg', type: 'solid', decorative: false, ariaLabel: 'Attention' },
};

/**
 * Famille personnalisée enregistrée via `provideUiIconFamilies()`, sélectionnée par `family`.
 * (Ici la famille "brand" mappe sur les classes FontAwesome pour un rendu visible sans police
 * supplémentaire ; en pratique on y brancherait Material Symbols, Bootstrap Icons, etc.)
 */
export const CustomFamily: Story = {
  decorators: [
    applicationConfig({
      providers: [provideUiIconFamilies({ brand: { classes: (name) => `fa-solid fa-${name}` } })],
    }),
  ],
  args: { name: 'star', size: 'xl', family: 'brand' },
};
