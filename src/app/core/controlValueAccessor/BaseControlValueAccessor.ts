import { afterNextRender, computed, DestroyRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    ControlValueAccessor,
    NgControl,
    PristineChangeEvent,
    StatusChangeEvent,
    TouchedChangeEvent,
    ValidationErrors,
} from '@angular/forms';

/**
 * Base class for form components (`ui-checkbox`, `ui-radio`, `ui-input`…).
 *
 * Implements `ControlValueAccessor` and mirrors the attached `NgControl` state
 * into signals, so templates/styles can react to it declaratively:
 *
 * - `touched` / `dirty` / `pristine` / `untouched` — interaction state
 * - `controlInvalid` / `controlErrors`             — validation state
 * - `controlDisabled`                              — driven by `control.disable()`
 * - `showError`                                    — invalid AND (touched or dirty),
 *                                                    the usual "when to paint red" rule
 *
 * The subscription is wired automatically after first render and cleaned up on
 * destroy. Subclasses only have to:
 * 1. implement `writeValue()` (form → view),
 * 2. call `emitChange(value)` on user interaction (view → form),
 * 3. call `emitTouch()` on blur,
 * 4. declare the DI provider:
 *    `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyComponent), multi: true }`.
 *
 * Works with reactive forms, template-driven forms, or standalone (no form at
 * all — the signals simply keep their defaults).
 */
export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
    private readonly injector = inject(Injector);
    private readonly destroyRef = inject(DestroyRef);

    readonly dirty = signal(false);
    readonly pristine = signal(true);
    readonly touched = signal(false);
    readonly untouched = signal(true);
    /** Validation state of the attached control (false when no control). */
    readonly controlInvalid = signal(false);
    /** Validation errors of the attached control (null when valid / no control). */
    readonly controlErrors = signal<ValidationErrors | null>(null);
    /** Disabled state driven by the forms API (`control.disable()`), not by the `disabled` input. */
    readonly controlDisabled = signal(false);
    /** True when the error state should be surfaced to the user. */
    readonly showError = computed(() => this.controlInvalid() && (this.touched() || this.dirty()));

    protected onChange: (value: T) => void = () => {
        /* noop until registered */
    };
    protected onTouched: () => void = () => {
        /* noop until registered */
    };

    constructor() {
        // NgControl injects lazily (after the directive tree is built) to avoid
        // the classic NgControl ↔ value-accessor circular dependency.
        afterNextRender(() => this.watchNgControlEvents());
    }

    /** Write the form value into the component state (form → view). */
    abstract writeValue(value: T): void;

    registerOnChange(fn: (value: T) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.controlDisabled.set(isDisabled);
    }

    /** Propagate a user-driven value change to the form (view → form). */
    protected emitChange(value: T): void {
        this.onChange(value);
    }

    /** Mark the control as touched (call on blur). */
    protected emitTouch(): void {
        this.onTouched();
        this.touched.set(true);
        this.untouched.set(false);
    }

    /** Mirror the NgControl state into the signals. Wired automatically; safe to call once manually if needed. */
    protected watchNgControlEvents(): void {
        const control = this.injector.get(NgControl, null, { optional: true, self: true })?.control;
        if (!control) return;

        // Seed with the current state (events only fire on transitions).
        this.pristine.set(control.pristine);
        this.dirty.set(control.dirty);
        this.touched.set(control.touched);
        this.untouched.set(control.untouched);
        this.controlInvalid.set(control.invalid);
        this.controlErrors.set(control.errors);

        control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
            if (event instanceof PristineChangeEvent) {
                this.pristine.set(event.pristine);
                this.dirty.set(!event.pristine);
            } else if (event instanceof TouchedChangeEvent) {
                this.touched.set(event.touched);
                this.untouched.set(!event.touched);
            } else if (event instanceof StatusChangeEvent) {
                this.controlInvalid.set(event.status === 'INVALID');
                this.controlErrors.set(control.errors);
            }
        });
    }
}
