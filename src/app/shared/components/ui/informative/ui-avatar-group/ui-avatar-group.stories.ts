import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiAvatarGroup } from '@app/shared/components/ui/informative/ui-avatar-group/ui-avatar-group';
import { UiAvatar, AvatarSize } from '@app/shared/components/ui/informative/ui-avatar/ui-avatar';

interface GroupStoryArgs {
  size: AvatarSize;
}

const meta: Meta<GroupStoryArgs> = {
  title: 'Components/ui/informative/ui-avatar-group',
  component: UiAvatarGroup,
  decorators: [moduleMetadata({ imports: [UiAvatarGroup, UiAvatar] })],
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
      options: ['small', 'default', 'large'],
      description: 'Taille appliquée aux avatars projetés (démo).',
      table: { type: { summary: 'AvatarSize' }, defaultValue: { summary: '"default"' } },
    },
  },
  args: { size: 'default' },
};

export default meta;
type Story = StoryObj<GroupStoryArgs>;

// Empilement de photos de profil qui se chevauchent.
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-avatar-group>
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=11" alt="Alice" />
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=12" alt="Bob" />
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=13" alt="Carol" />
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=14" alt="Dan" />
      </ui-avatar-group>`,
  }),
};

// Débordement : le dernier avatar « +N » est un simple avatar Label.
export const WithOverflow: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-avatar-group>
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=15" alt="Alice" />
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=16" alt="Bob" />
        <ui-avatar [size]="size" image="https://i.pravatar.cc/128?img=17" alt="Carol" />
        <ui-avatar [size]="size" label="+5" ariaLabel="5 autres membres" />
      </ui-avatar-group>`,
  }),
};

// Mélange initiales / icône.
export const Mixed: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-avatar-group>
        <ui-avatar [size]="size" label="AL" ariaLabel="Alice" />
        <ui-avatar [size]="size" label="BO" ariaLabel="Bob" />
        <ui-avatar [size]="size" icon="user" ariaLabel="Invité" />
      </ui-avatar-group>`,
  }),
};
