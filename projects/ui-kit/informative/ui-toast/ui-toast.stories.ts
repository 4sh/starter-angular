import { Component, inject, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiToast } from '@4sh/ui-kit/informative/ui-toast';
import { UiToastContainer } from '@4sh/ui-kit/informative/ui-toast';
import { UiToastService } from '@4sh/ui-kit/informative/ui-toast';
import { UI_TOAST_POSITIONS, UiToastPosition } from '@4sh/ui-kit/informative/ui-toast';

// =====================================================================
// Interactive demo hosts. Each provides its OWN UiToastService instance so the
// stories stay isolated (a toast fired in one demo never leaks into another),
// and pins its container with `contained` so the stack stays inside the canvas.
// =====================================================================

/** Shared style for the boxed demo area (a positioned ancestor for `contained`). */
const DEMO_BOX =
  'position:relative; min-height:240px; padding:16px; border:1px dashed var(--global-border-default, #ccc); border-radius:12px; overflow:hidden;';

@Component({
  selector: 'demo-toast-basic',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Show a toast" (buttonClick)="show()" />
      <ui-toast-container position="top-right" [contained]="true" [life]="4000" />
    </div>
  `,
})
class ToastDemoBasic {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  private count = 0;
  protected show(): void {
    this.count++;
    this.toast.add({
      title: 'Notification',
      text: `This is toast #${this.count}.`,
    });
  }
}

@Component({
  selector: 'demo-toast-promise',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Enregistrer (async)" (buttonClick)="run()" [loading]="busy" />
      <ui-toast-container position="top-right" [contained]="true" />
    </div>
  `,
})
class ToastDemoPromise {
  protected readonly box = DEMO_BOX;
  protected busy = false;
  private readonly toast = inject(UiToastService);
  protected run(): void {
    if (this.busy) return;
    this.busy = true;
    const id = this.toast.add({
      level: 'highlight',
      title: 'Processing…',
      text: 'Saving.',
      icon: 'circle-notch',
      sticky: true,
      closable: false,
    });
    // Simulated async work; on resolve, swap the pending toast for a result.
    setTimeout(() => {
      this.toast.remove(id);
      this.toast.add({
        level: 'success',
        title: 'Saved',
        text: 'Your data has been saved.',
      });
      this.busy = false;
    }, 1800);
  }
}

@Component({
  selector: 'demo-toast-sticky',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Persistent toast" (buttonClick)="show()" />
      <ui-toast-container position="top-right" [contained]="true" />
    </div>
  `,
})
class ToastDemoSticky {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  protected show(): void {
    this.toast.add({
      level: 'warning',
      title: 'Action required',
      text: 'This message stays until dismissed manually.',
      sticky: true,
    });
  }
}

@Component({
  selector: 'demo-toast-custom',
  imports: [UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <button type="button" class="demo-trigger" (click)="show()">Show a custom toast</button>
      <ui-toast-container position="top-right" [contained]="true" [template]="tpl" />
      <ng-template #tpl let-message>
        <span style="font-weight:700;">{{ message.data?.name }}</span>
        <span style="font-size:0.875rem;">{{ message.data?.action }}</span>
        <span style="margin-top:4px; font-size:0.75rem; opacity:0.75;">{{ message.data?.time }}</span>
      </ng-template>
    </div>
  `,
})
class ToastDemoCustom {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  protected show(): void {
    this.toast.add({
      level: 'highlight',
      icon: 'user',
      data: { name: 'Mary Doe', action: 'commented on your document', time: 'Just now' },
    });
  }
}

@Component({
  selector: 'demo-toast-position',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Show" (buttonClick)="show()" />
      <ui-toast-container [position]="position()" [contained]="true" />
    </div>
  `,
})
class ToastDemoPosition {
  position = input<UiToastPosition>('top-right');
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  protected show(): void {
    this.toast.add({
      level: 'success',
      title: 'Position',
      text: `Anchored at « ${this.position()} ».`,
    });
  }
}

@Component({
  selector: 'demo-toast-expanded',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Banner" (buttonClick)="show()" />
      <ui-toast-container position="top-center" [contained]="true" [expanded]="true" />
    </div>
  `,
})
class ToastDemoExpanded {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  protected show(): void {
    this.toast.add({
      level: 'highlight',
      title: 'New version available',
      text: 'An application update is ready to install.',
    });
  }
}

@Component({
  selector: 'demo-toast-action',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Remove the item" level="error" (buttonClick)="show()" />
      <ui-toast-container position="bottom-right" [contained]="true" [template]="tpl" />
      <ng-template #tpl let-message let-close="closeFn">
        <span style="font-weight:700;">{{ message.title }}</span>
        <span style="font-size:0.875rem;">{{ message.text }}</span>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <ui-button size="small" level="high" label="Cancel" (buttonClick)="undo(); close()" />
          <ui-button size="small" level="low" label="Close" (buttonClick)="close()" />
        </div>
      </ng-template>
    </div>
  `,
})
class ToastDemoAction {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  protected show(): void {
    this.toast.add({
      level: 'default',
      icon: 'trash',
      title: 'Item removed',
      text: 'The item was moved to the trash.',
      sticky: true,
    });
  }
  protected undo(): void {
    this.toast.add({ level: 'success', title: 'Restored', text: 'The item was restored.' });
  }
}

@Component({
  selector: 'demo-toast-stacking',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <div style="display:flex; gap:8px;">
        <ui-button label="Add 5 toasts" (buttonClick)="burst()" />
        <ui-button level="low" label="Identical toast" (buttonClick)="duplicate()" />
      </div>
      <ui-toast-container
        position="top-right"
        [contained]="true"
        [stackVisibleLimit]="3"
        [stackGap]="4"
        [preventDuplicates]="true"
      />
    </div>
  `,
})
class ToastDemoStacking {
  protected readonly box = DEMO_BOX;
  private readonly toast = inject(UiToastService);
  private n = 0;
  protected burst(): void {
    for (let i = 0; i < 5; i++) {
      this.n++;
      this.toast.add({ level: 'default', title: `Toast ${this.n}`, text: 'stackVisibleLimit = 3.' });
    }
  }
  protected duplicate(): void {
    // Same content each time → preventDuplicates keeps a single instance.
    this.toast.add({ level: 'highlight', title: 'Duplicate', text: 'Shown only once.' });
  }
}

/** Args of the presentational `ui-toast` card (drives the API table + playground). */
interface ToastArgs {
  title: string;
  text: string;
  level: 'default' | 'highlight' | 'success' | 'warning' | 'error';
  subLevel: 'high' | 'low';
  icon: string | boolean;
  closable: boolean;
  expanded: boolean;
}

const meta: Meta<ToastArgs> = {
  title: 'Components/ui/informative/ui-toast',
  component: UiToast,
  decorators: [
    moduleMetadata({
      imports: [
        UiToast,
        UiToastContainer,
        UiButton,
        ToastDemoBasic,
        ToastDemoPromise,
        ToastDemoSticky,
        ToastDemoCustom,
        ToastDemoPosition,
        ToastDemoExpanded,
        ToastDemoAction,
        ToastDemoStacking,
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2175-2940&t=5wz150tVEFKDC8fC-1',
    },
    docs: {
      description: {
        component:
          'Transient notification. `UiToast` is the presentational card (`informative` tokens); ' +
          '`UiToastService` pushes messages (`add`/`clear`/`remove`) and `ui-toast-container` displays them, ' +
          'positions the stack, animates the enter/exit (motion system) and manages the auto-dismiss (paused on hover).',
      },
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Title line (bold).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    text: {
      control: { type: 'text' },
      description: 'Secondary content line.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: { type: 'inline-radio' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Semantic level (colors + default icon).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    subLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Intensity (`high` = solid, `low` = subtle).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"high"' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'FontAwesome name, `false` to hide, or `true` for the level\'s icon.',
      table: { type: { summary: 'string | boolean' }, defaultValue: { summary: 'true' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Show the close button.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    expanded: {
      control: { type: 'boolean' },
      description: 'Stretches the card across the stack\'s full width (banner mode).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<ToastArgs>;

/** Playground : la carte présentational seule, pilotée par les contrôles. */
export const Default: Story = {
  args: {
    title: 'Toast title',
    text: 'Toast text',
    level: 'default',
    subLevel: 'high',
    icon: true,
    closable: true,
    expanded: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:360px;">
        <ui-toast
          [title]="title"
          [text]="text"
          [level]="level"
          [subLevel]="subLevel"
          [icon]="icon"
          [closable]="closable"
          [expanded]="expanded"
        />
      </div>
    `,
  }),
};

/** Usage nominal : un bouton pousse un toast via le service. */
export const Basic: Story = {
  render: () => ({ template: `<demo-toast-basic />` }),
  parameters: { layout: 'padded' },
};

/** Les cinq niveaux sémantiques (cartes statiques). */
export const Levels: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; width:360px;">
        <ui-toast level="default" title="Information" text="Neutral information message." />
        <ui-toast level="highlight" title="Note" text="Highlighted information." />
        <ui-toast level="success" title="Success" text="The operation succeeded." />
        <ui-toast level="warning" title="Attention" text="Check before continuing." />
        <ui-toast level="error" title="Error" text="An error occurred." />
      </div>
    `,
  }),
};

/** Intensité basse (`subLevel="low"`) — variantes plus discrètes. */
export const SubLevelLow: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; width:360px;">
        <ui-toast level="default" subLevel="low" title="Information" text="Subtle variant." />
        <ui-toast level="success" subLevel="low" title="Success" text="Subtle variant." />
        <ui-toast level="error" subLevel="low" title="Error" text="Subtle variant." />
      </div>
    `,
  }),
};

/** Toast « en attente » puis résolu : idéal pour une opération asynchrone (Promise). */
export const Promise: Story = {
  render: () => ({ template: `<demo-toast-promise />` }),
  parameters: { layout: 'padded' },
};

/** Toast persistant (`sticky`) : jamais auto-fermé, fermeture manuelle uniquement. */
export const Sticky: Story = {
  render: () => ({ template: `<demo-toast-sticky />` }),
  parameters: { layout: 'padded' },
};

/** Contenu personnalisé via `template` (contexte `{ $implicit: message, closeFn }`). */
export const Custom: Story = {
  render: () => ({ template: `<demo-toast-custom />` }),
  parameters: { layout: 'padded' },
};

/** Choix de l’ancrage dans le viewport (7 positions). */
export const Position: StoryObj = {
  args: { position: 'top-right' },
  argTypes: {
    position: {
      control: { type: 'select' },
      options: [...UI_TOAST_POSITIONS],
      description: 'Anchoring of the stack in the viewport.',
      table: { type: { summary: 'UiToastPosition' }, defaultValue: { summary: '"top-right"' } },
    },
  },
  render: (args) => ({
    props: { position: args['position'] },
    template: `<demo-toast-position [position]="position" />`,
  }),
  parameters: {
    layout: 'padded',
    controls: { include: ['position'] },
  },
};

/** Mode bannière (`expanded`) : les toasts occupent toute la largeur de la pile. */
export const ExpandedMode: Story = {
  render: () => ({ template: `<demo-toast-expanded />` }),
  parameters: { layout: 'padded' },
};

/** Toast avec actions (annuler / fermer) via un `template` et des `ui-button`. */
export const Action: Story = {
  render: () => ({ template: `<demo-toast-action />` }),
  parameters: { layout: 'padded' },
};

/** Empilement : `stackVisibleLimit` (3 max), `stackGap` resserré, `preventDuplicates`. */
export const Stacking: Story = {
  render: () => ({ template: `<demo-toast-stacking />` }),
  parameters: { layout: 'padded' },
};
