---
name: add-platform-module
description: Design, implement or extend a modular feature in the Mass Platform Python/FastAPI backend and/or React/TypeScript frontend. Use when adding a generator, integration, API capability, execution flow, page or feature module, or reviewing module boundaries and implementation conventions.
---

# Add a platform module

Follow the repository's `AGENTS.md` and use `references/module-checklist.md`
when designing new capabilities. Preserve a feature-first structure on both
sides without forcing frontend and backend modules to mirror one another.

## Scope and decisions

1. Identify the actor, capability, entry points, acceptance criteria, data
   classification, external dependencies and expected operational volume.
2. Decide whether to extend an existing module, create a backend-only feature,
   create a frontend-only feature, or create coordinated modules.
3. Define contracts before implementation. Include errors, permissions,
   validation, idempotency and migration behavior when relevant.
4. Identify quality attributes and operational limits. Do not invent
   production capabilities not present in the repository.

## Backend implementation

1. Create or extend `src/mass_platform/modules/<feature>/`.
2. Keep router, schema, service and adapters **only as needed**.
3. Use Pydantic at HTTP boundaries. Keep policies and entities free from
   FastAPI and SQLAlchemy imports.
4. Introduce a `Protocol` when there are competing implementations,
   external dependencies, or a testing seam with meaningful value.
5. Wire the feature in `main.py` or the local factory; keep imports acyclic.
6. Add unit tests for policies and HTTP/integration tests for contracts,
   invalid input, forbidden access and failures.

## Frontend implementation

1. Create or extend `frontend/src/features/<feature>/`.
2. Put feature-specific API functions and TypeScript types near their UI.
3. Keep components small; extract hooks only for reusable stateful behavior.
4. Call backend via the shared HTTP client; do not embed secrets or reproduce
   protected business rules in the browser.
5. Add user-facing loading, empty, error and success states; meet keyboard
   and accessibility basics.
6. Integrate with navigation/composition. Reuse `shared/` only when two or
   more features demonstrably need the same primitive.

## Verification and handoff

- Run Ruff, pytest and frontend build; add feature-specific tests.
- Check API compatibility, new imports, security boundaries and docs.
- Delete obsolete placeholders, unused directories and accidental artifacts.
- Report: capability delivered, changed modules, contract impact, executed
  tests, remaining risks and recommended next increment.

## Anti-patterns to reject

- A new module that is only a technical layer without a user capability.
- Java-style interface/class proliferation in Python.
- React feature business logic accumulated in the root `App.tsx`.
- Direct database access from route handlers or React components.
- Client-side API keys in `VITE_*` variables.
- Cross-feature imports into another feature's internal components.
- Claiming production readiness from a successful local build.
