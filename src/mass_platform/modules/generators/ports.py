from typing import Any, Protocol
from uuid import UUID

from mass_platform.modules.executions.models import Execution


class Generator(Protocol):
    name: str
    description: str

    def generate(self, parameters: dict[str, Any]) -> dict[str, Any]: ...


class ExecutionRepository(Protocol):
    def save(self, execution: Execution) -> None: ...

    def get(self, execution_id: UUID) -> Execution | None: ...
