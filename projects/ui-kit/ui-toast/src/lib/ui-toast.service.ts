import { computed, Injectable, signal } from '@angular/core';
import { UiToastId, UiToastMessage } from './ui-toast.types';

/** Process-wide counter guaranteeing unique auto-generated toast ids. */
let nextId = 0;

/**
 * ui-toast service — programmatic entry point to push and clear toasts.
 *
 * Signal-based store:
 * `add`/`addAll` append messages, `clear`/`remove` drop them. One or more
 * {@link UiToastContainer} instances read this store reactively and render the
 * slice that matches their `key`. Provided in root, so a single injection is
 * shared across the app.
 *
 * @example
 * ```ts
 * private readonly toast = inject(UiToastService);
 * this.toast.add({ level: 'success', title: 'Enregistré', text: 'Profil mis à jour.' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UiToastService {
  /** @ignore Backing store of live messages. */
  private readonly _messages = signal<UiToastMessage[]>([]);

  /** Live messages, in insertion order (read-only). */
  readonly messages = this._messages.asReadonly();

  /** Total number of live messages across every key. */
  readonly count = computed(() => this._messages().length);

  /**
   * Push a single message. Returns its (possibly generated) id so the caller
   * can dismiss it later (e.g. resolving a "loading" toast into a result).
   */
  add(message: UiToastMessage): UiToastId {
    const id = message.id ?? `ui-toast-${nextId++}`;
    this._messages.update((list) => [...list, { ...message, id }]);
    return id;
  }

  /** Push several messages at once. Returns their ids, in order. */
  addAll(messages: UiToastMessage[]): UiToastId[] {
    return messages.map((message) => this.add(message));
  }

  /**
   * Remove messages. With no argument, clears everything; with a `key`, clears
   * only the messages routed to that key.
   */
  clear(key?: string): void {
    if (key == null) {
      this._messages.set([]);
      return;
    }
    this._messages.update((list) => list.filter((m) => m.key !== key));
  }

  /** Remove a single message by id (no-op if it is already gone). */
  remove(id: UiToastId): void {
    this._messages.update((list) => list.filter((m) => m.id !== id));
  }
}
