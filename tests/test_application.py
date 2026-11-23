from typing import Any
from uuid import UUID

import pytest

from mass_platform.modules.executions.models import Execution
from mass_platform.modules.generators.service import GenerationService, UnknownGeneratorError


class InMemoryRepository:
    def __init__(self) -> None:
        self.records: dict[UUID, Execution] = {}

    def save(self, execution: Execution) -> None:
        self.records[execution.id] = execution

    def get(self, execution_id: UUID) -> Execution | None:
        return self.records.get(execution_id)


class SampleGenerator:
    name = "sample"
    description = "Fake implementation for tests"

    def generate(self, parameters: dict[str, Any]) -> dict[str, Any]:
        return {"value": parameters["value"]}


def test_service_uses_ports_without_http_or_database() -> None:
    service = GenerationService([SampleGenerator()], InMemoryRepository())
    result = service.execute("sample", {"value": 42}, actor="test")
    assert result.result == {"value": 42}
    assert service.get(result.id) == result


def test_unknown_generator() -> None:
    service = GenerationService([], InMemoryRepository())
    with pytest.raises(UnknownGeneratorError):
        service.execute("missing", {}, actor="test")
