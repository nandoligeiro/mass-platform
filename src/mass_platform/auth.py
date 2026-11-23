import secrets
from collections.abc import Callable

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from mass_platform.config import Settings

_api_key = APIKeyHeader(name="X-API-Key", auto_error=False)


def build_api_key_dependency(settings: Settings) -> Callable[..., str]:
    def require_actor(key: str | None = Security(_api_key)) -> str:
        allowed = [token.strip() for token in settings.api_keys.split(",") if token.strip()]
        if not key or not any(secrets.compare_digest(key, token) for token in allowed):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
        return "api-client"  # Development only: replace with OIDC identity.

    return require_actor
