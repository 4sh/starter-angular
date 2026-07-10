import { Component, inject, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiToast } from './ui-toast';
import { UiToastContainer } from './ui-toast-container';
import { UiToastService } from './ui-toast.service';
import { UI_TOAST_POSITIONS, UiToastPosition } from './ui-toast.types';

// =====================================================================
// Interactive demo hosts. Each provides its OWN UiToastService instance so the
// stories stay isolated (a toast fired in one demo never leaks into another),
// and pins its container with `contained` so the stack stays inside the canvas.
// =====================================================================

/** Shared style for the boxed demo area (a positioned ancestor for `contained`). */
const DEMO_BOX =
  'position:relative; min-height:240px; padding:16px; border:1px dashed var(--global-low-stroke-default, #ccc); border-radius:12px; overflow:hidden;';

@Component({
  selector: 'toast-demo-basic',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Afficher un toast" (buttonClick)="show()" />
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
      text: `Ceci est le toast n°${this.count}.`,
    });
  }
}

@Component({
  selector: 'toast-demo-promise',
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
      title: 'Traitement…',
      text: 'Enregistrement en cours.',
      icon: 'circle-notch',
      sticky: true,
      closable: false,
    });
    // Simulated async work; on resolve, swap the pending toast for a result.
    setTimeout(() => {
      this.toast.remove(id);
      this.toast.add({
        level: 'success',
        title: 'Enregistré',
        text: 'Vos données ont bien été sauvegardées.',
      });
      this.busy = false;
    }, 1800);
  }
}

@Component({
  selector: 'toast-demo-sticky',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Toast persistant" (buttonClick)="show()" />
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
      title: 'Action requise',
      text: 'Ce message reste affiché jusqu’à fermeture manuelle.',
      sticky: true,
    });
  }
}

@Component({
  selector: 'toast-demo-custom',
  imports: [UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <button type="button" class="demo-trigger" (click)="show()">Afficher un toast personnalisé</button>
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
      data: { name: 'Marie Dupont', action: 'a commenté votre document', time: 'À l’instant' },
    });
  }
}

@Component({
  selector: 'toast-demo-position',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Afficher" (buttonClick)="show()" />
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
      text: `Ancré en « ${this.position()} ».`,
    });
  }
}

@Component({
  selector: 'toast-demo-expanded',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Bannière" (buttonClick)="show()" />
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
      title: 'Nouvelle version disponible',
      text: 'Une mise à jour de l’application est prête à être installée.',
    });
  }
}

@Component({
  selector: 'toast-demo-action',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <ui-button label="Supprimer l’élément" level="error" (buttonClick)="show()" />
      <ui-toast-container position="bottom-right" [contained]="true" [template]="tpl" />
      <ng-template #tpl let-message let-close="closeFn">
        <span style="font-weight:700;">{{ message.title }}</span>
        <span style="font-size:0.875rem;">{{ message.text }}</span>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <ui-button size="small" level="high" label="Annuler" (buttonClick)="undo(); close()" />
          <ui-button size="small" level="low" label="Fermer" (buttonClick)="close()" />
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
      title: 'Élément supprimé',
      text: 'L’élément a été déplacé vers la corbeille.',
      sticky: true,
    });
  }
  protected undo(): void {
    this.toast.add({ level: 'success', title: 'Restauré', text: 'L’élément a été restauré.' });
  }
}

@Component({
  selector: 'toast-demo-stacking',
  imports: [UiButton, UiToastContainer],
  providers: [UiToastService],
  template: `
    <div [style]="box">
      <div style="display:flex; gap:8px;">
        <ui-button label="Ajouter 5 toasts" (buttonClick)="burst()" />
        <ui-button level="low" label="Toast identique" (buttonClick)="duplicate()" />
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
    this.toast.add({ level: 'highlight', title: 'Doublon', text: 'Affiché une seule fois.' });
  }
}

/** Args of the presentational `ui-toast` card (drives the API table + playground). */
type ToastArgs = {
  title: string;
  text: string;
  level: 'default' | 'highlight' | 'success' | 'warning' | 'error';
  subLevel: 'high' | 'low';
  icon: string | boolean;
  closable: boolean;
  expanded: boolean;
};

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
          'Notification transitoire. `UiToast` est la carte présentational (tokens `informative`) ; ' +
          '`UiToastService` pousse les messages (`add`/`clear`/`remove`) et `ui-toast-container` les affiche, ' +
          'positionne la pile, anime l’entrée/sortie (système de motion) et gère l’auto-fermeture (pausée au survol).',
      },
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Ligne de titre (en gras).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    text: {
      control: { type: 'text' },
      description: 'Ligne de contenu secondaire.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: { type: 'inline-radio' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Niveau sémantique (couleurs + icône par défaut).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    subLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Intensité (`high` = plein, `low` = subtil).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"high"' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome, `false` pour masquer, ou `true` pour l’icône du niveau.',
      table: { type: { summary: 'string | boolean' }, defaultValue: { summary: 'true' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Afficher le bouton de fermeture.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    expanded: {
      control: { type: 'boolean' },
      description: 'Étire la carte sur toute la largeur de la pile (mode bannière).',
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
  render: () => ({ template: `<toast-demo-basic />` }),
  parameters: { layout: 'padded' },
};

/** Les cinq niveaux sémantiques (cartes statiques). */
export const Levels: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; width:360px;">
        <ui-toast level="default" title="Information" text="Message d’information neutre." />
        <ui-toast level="highlight" title="À noter" text="Information mise en avant." />
        <ui-toast level="success" title="Succès" text="L’opération a réussi." />
        <ui-toast level="warning" title="Attention" text="Vérifiez avant de continuer." />
        <ui-toast level="error" title="Erreur" text="Une erreur est survenue." />
      </div>
    `,
  }),
};

/** Intensité basse (`subLevel="low"`) — variantes plus discrètes. */
export const SubLevelLow: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; width:360px;">
        <ui-toast level="default" subLevel="low" title="Information" text="Variante subtile." />
        <ui-toast level="success" subLevel="low" title="Succès" text="Variante subtile." />
        <ui-toast level="error" subLevel="low" title="Erreur" text="Variante subtile." />
      </div>
    `,
  }),
};

/** Toast « en attente » puis résolu : idéal pour une opération asynchrone (Promise). */
export const Promise: Story = {
  render: () => ({ template: `<toast-demo-promise />` }),
  parameters: { layout: 'padded' },
};

/** Toast persistant (`sticky`) : jamais auto-fermé, fermeture manuelle uniquement. */
export const Sticky: Story = {
  render: () => ({ template: `<toast-demo-sticky />` }),
  parameters: { layout: 'padded' },
};

/** Contenu personnalisé via `template` (contexte `{ $implicit: message, closeFn }`). */
export const Custom: Story = {
  render: () => ({ template: `<toast-demo-custom />` }),
  parameters: { layout: 'padded' },
};

/** Choix de l’ancrage dans le viewport (7 positions). */
export const Position: StoryObj = {
  args: { position: 'top-right' },
  argTypes: {
    position: {
      control: { type: 'select' },
      options: [...UI_TOAST_POSITIONS],
      description: 'Ancrage de la pile dans le viewport.',
      table: { type: { summary: 'UiToastPosition' }, defaultValue: { summary: '"top-right"' } },
    },
  },
  render: (args) => ({
    props: { position: args['position'] },
    template: `<toast-demo-position [position]="position" />`,
  }),
  parameters: {
    layout: 'padded',
    controls: { include: ['position'] },
  },
};

/** Mode bannière (`expanded`) : les toasts occupent toute la largeur de la pile. */
export const ExpandedMode: Story = {
  render: () => ({ template: `<toast-demo-expanded />` }),
  parameters: { layout: 'padded' },
};

/** Toast avec actions (annuler / fermer) via un `template` et des `ui-button`. */
export const Action: Story = {
  render: () => ({ template: `<toast-demo-action />` }),
  parameters: { layout: 'padded' },
};

/** Empilement : `stackVisibleLimit` (3 max), `stackGap` resserré, `preventDuplicates`. */
export const Stacking: Story = {
  render: () => ({ template: `<toast-demo-stacking />` }),
  parameters: { layout: 'padded' },
};
