from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from mass_platform.config import Settings
from mass_platform.main import create_app


@pytest.fixture
def client(tmp_path: object) -> Iterator[TestClient]:
    database = tmp_path / "test.db"
    settings = Settings(
        app_env="local",
        database_url=f"sqlite:///{database}",
        api_keys="test-secret",
    )
    with TestClient(create_app(settings)) as client:
        yield client
