# Mass Platform — engineering conventions

This repository is a **modular monolith** with a Python-first backend and a
feature-based React frontend. Optimize for incremental delivery, comprehensibility,
security and the ability to integrate existing generators without a rewrite.

## Repository map

- Backend: `src/mass_platform/modules/<capability>/`
- Backend composition root: `src/mass_platform/main.py`
- Shared backend configuration: `src/mass_platform/config.py`
- Frontend features: `frontend/src/features/<capability>/`
- Frontend shared primitives: `frontend/src/shared/`
- Frontend composition: `frontend/src/App.tsx`
- Tests: `tests/`; colocate frontend tests with features when added.
- Reusable contribution workflow: `.agents/skills/add-platform-module/SKILL.md`

## Mandatory design rules

1. Organize code by **capability**, not by global technical layers. Do not
   reintroduce empty top-level `domain/`, `application/`, `api/`, or `infrastructure/`.
2. Keep HTTP transport and framework types outside business policies.
   Domain models must not import FastAPI, SQLAlchemy or React.
3. Define `typing.Protocol` ports **only for genuine replaceable boundaries**
   (generators, external systems, persistence abstractions). Avoid an interface
   for every class or a repository for trivial operations.
4. Wire concrete backend adapters at the composition root or a feature-level
   factory. Avoid circular dependencies between features.
5. Keep feature-owned frontend API functions, types and UI inside
   `frontend/src/features/<feature>/`. Put only proven reusable code in `shared/`.
   Treat `App.tsx` as a composition/navigation shell, not a place for new feature logic.
6. Preserve API contracts. Changes affecting consumers require backwards
   compatibility analysis, OpenAPI review and tests.
7. Never embed API keys, credentials or sensitive generated data in frontend
   bundles, logs, committed files or example fixtures. The Vite proxy key is
   **for local development only**; production requires identity-aware access.
8. Validate inputs at boundaries. Handle errors without leaking traces or
   secrets. Plan authorization, quotas, auditing and retention for new capabilities.
9. Long-running tasks must not block HTTP request workers indefinitely.
   Before implementing them, design queueing, retries, idempotency and timeouts.
10. Implement the smallest complete increment, with evidence. No speculative
    microservices, generic frameworks, event buses or elaborate inheritance.

## Workflow for a new module

1. Clarify the capability, actors, inputs/outputs, dependencies and acceptance criteria.
2. Check whether an existing feature should be extended instead of creating a new one.
3. Read and apply `.agents/skills/add-platform-module/SKILL.md`.
4. Implement and test backend and/or frontend, as actually needed.
5. Update contracts, README and integration wiring; avoid dead folders and files.
6. Report behavior, changes, tests, risks and production gaps.

## Required checks

```bash
uv run ruff check .
uv run pytest -q
cd frontend && npm run build
```

New code must be tested at the appropriate level; these commands are the
minimum. Do not claim integration verified unless a real end-to-end test ran.
