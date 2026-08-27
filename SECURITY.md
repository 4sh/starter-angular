# Security Policy

> Development rules (banned APIs, register of authorised exceptions,
> dependency-chain hardening): [`docs/SECURITY-PRACTICES.md`](docs/SECURITY-PRACTICES.md).
> This file only covers **reporting** a vulnerability.

## Supported versions

Only the latest published `0.x` release of
[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit) receives security
fixes. As long as the major version stays `0`, the API is considered unstable
(see [`docs/VERSIONING.md`](docs/VERSIONING.md)) and older `0.x` releases are
not patched retroactively — upgrade to the latest release to get a fix.

## Reporting a vulnerability

**Please do not open a public GitHub issue for a security vulnerability.**

Report it privately by email to **npm@4sh.fr**, including:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it — a minimal repro is ideal.
- The affected version(s) of `@4sh/ui-kit`.

We aim to acknowledge reports within 5 business days, and to provide a
remediation plan or a fix within 30 days for confirmed issues. You will be
credited in the fix's release notes, unless you'd rather stay anonymous.
