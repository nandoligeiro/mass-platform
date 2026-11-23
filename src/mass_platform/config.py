from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    database_url: str = "sqlite:///./mass-platform.db"
    api_keys: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def validate_security(self) -> None:
        if self.app_env != "local" and not self.api_keys.strip():
            raise RuntimeError("API_KEYS must be configured outside local development")


@lru_cache
def get_settings() -> Settings:
    return Settings()
