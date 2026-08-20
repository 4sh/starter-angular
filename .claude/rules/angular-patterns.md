---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.html'
---

# Angular patterns

> Baseline conventions live in `AGENTS.md` (signal inputs/outputs, SCSS/tokens/no-BEM,
> naming, a11y). This rule only adds the template/DI/signals/forms specifics missing
> there — if AGENTS.md later absorbs a section, remove it here.

## Control flow — built-in syntax only

Never `*ngIf` / `*ngFor` / `ngSwitch`, never `[ngClass]` / `[ngStyle]` (use `[class]` / `[style]` bindings).

```html
@if (loading()) {
<ui-spinner />
} @else {
<p>Content</p>
} @for (item of items(); track item.id) {
<ui-chip [label]="item.label()" />
} @empty {
<p>No items</p>
} @switch (state()) { @case ('error') { <ui-icon name="circle-exclamation" /> } @default {
<ui-icon name="circle-info" /> } }
```

`@for` track is mandatory. Context variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.

## Dependency injection — `inject()` only

Never constructor injection.

```typescript
private readonly themeService = inject(ThemeService);    // TS-only
protected readonly brandService = inject(BrandService);  // used in template
```

- `private` = TypeScript only; `protected` = referenced by the template; always `readonly`.
- Continuous streams: `takeUntilDestroyed()` (inject `DestroyRef` outside injection context).

## Signals beyond inputs

| Type                               | Usage                                                             |
| ---------------------------------- | ----------------------------------------------------------------- |
| `signal()`                         | Local mutable state                                               |
| `computed()`                       | Derived read-only value (CSS classes, derived state)              |
| `linkedSignal()`                   | Derived but writable, auto-reset when the source changes          |
| `toSignal(obs$, { initialValue })` | Observable → signal (`initialValue` mandatory)                    |
| `effect()`                         | Side effects ONLY (DOM sync, logging) — never data transformation |

- All signals `readonly`.
- No side effects in `computed()`; prefer `computed()` over `effect()` for transformations.

## Forms

- Typed forms always: `FormGroup<Desc>` / `FormControl<T>` — never untyped.
- Form components extend `BaseControlValueAccessor`
  (`src/app/core/controlValueAccessor/`) — CVA makes them compatible with
  `[(ngModel)]`, Reactive Forms and Signal Forms (`[formField]`) at once.
- Signal Forms interop goes through the existing CVA layer — never rewrite a
  component specifically for Signal Forms.
