# Module design checklist

## Decision record

| Question | Answer |
|---|---|
| User capability and primary actor | |
| Existing module to extend? | |
| Backend, frontend, or both? | |
| Input/output and API contract | |
| Validation and sensitive data | |
| Authorization and audit needs | |
| Failure modes / timeouts / idempotency | |
| Persistence or external integrations | |
| Observable success and acceptance tests | |
| Migration / backward-compatibility impact | |

## Minimum feature layout (choose only needed files)

```text
src/mass_platform/modules/<feature>/
  __init__.py
  router.py       # FastAPI edge
  schemas.py      # transport DTOs
  service.py      # behavior
  ports.py        # only if replaceable boundaries exist
  adapters.py     # only if concrete integrations exist

frontend/src/features/<feature>/
  api.ts
  components/
  hooks/          # optional
  types.ts        # optional
```

Do not generate empty files or directories simply to match this example.

## Acceptance gate

- Working happy path, validation failure and dependency failure.
- Permission/ownership behavior reviewed.
- Tests prove contract and domain behavior.
- No secrets, PII or generated sensitive data in logs or browser storage.
- Docs and module registration updated.
- No regressions in existing features.
- Production gaps disclosed explicitly.
