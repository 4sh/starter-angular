import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { UiIcon, UiIconFamilyScope, provideUiIconFamilies } from '@4sh/ui-kit/base/ui-icon';

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
/** Famille de démonstration : remappe quelques noms sur d'autres glyphes FontAwesome,
 *  pour rendre la bascule visible sans charger une seconde police. */
const DEMO_GLYPHS: Record<string, string> = { star: 'certificate', bell: 'bullhorn' };
const demoFamily = { classes: (name: string) => `fa-solid fa-${DEMO_GLYPHS[name] ?? name}` };

export default meta;
type Story = StoryObj<UiIcon>;

export const Solid: Story = { args: { name: 'circle-user', size: 'lg', type: 'solid' } };
export const Outline: Story = { args: { name: 'circle-user', size: 'lg', type: 'outline' } };
export const Meaningful: Story = {
  args: {
    name: 'triangle-exclamation',
    size: 'lg',
    type: 'solid',
    decorative: false,
    ariaLabel: 'Attention',
  },
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

/**
 * Famille appliquée à tout un **sous-arbre** via la directive `uiIconFamily` : chaque `ui-icon`
 * descendant sans `family` explicite bascule — y compris les icônes qu'un composant du kit
 * instancie en interne (chevrons, coches…) et celles relocalisées dans un overlay CDK.
 *
 * (La famille « demo » simule une autre bibliothèque en remappant quelques noms sur des glyphes
 * FontAwesome, pour un rendu visible sans charger de police supplémentaire.)
 */
export const ScopedFamily: Story = {
  decorators: [
    applicationConfig({ providers: [provideUiIconFamilies({ demo: demoFamily })] }),
    moduleMetadata({ imports: [UiIcon, UiIconFamilyScope] }),
  ],
  render: () => ({
    template: `<div style="display:flex; gap:48px; align-items:center">
      <div style="display:flex; gap:16px">
        <ui-icon name="star" size="xl" />
        <ui-icon name="bell" size="xl" />
      </div>
      <div uiIconFamily="demo" style="display:flex; gap:16px">
        <ui-icon name="star" size="xl" />
        <ui-icon name="bell" size="xl" />
      </div>
    </div>`,
  }),
};
