import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from mass_platform.modules.executions.models import Execution, ExecutionStatus
from mass_platform.modules.generators.ports import ExecutionRepository, Generator

logger = logging.getLogger(__name__)


class UnknownGeneratorError(ValueError):
    pass


class GenerationService:
    def __init__(self, generators: list[Generator], repository: ExecutionRepository) -> None:
        self._generators = {generator.name: generator for generator in generators}
        if len(self._generators) != len(generators):
            raise ValueError("Duplicated generator name")
        self._repository = repository

    def catalog(self) -> list[dict[str, str]]:
        return [
            {"name": generator.name, "description": generator.description}
            for generator in self._generators.values()
        ]

    def execute(self, name: str, parameters: dict[str, Any], actor: str) -> Execution:
        generator = self._generators.get(name)
        if generator is None:
            raise UnknownGeneratorError(name)
        execution_id = uuid4()
        started = datetime.now(UTC)
        try:
            payload = generator.generate(parameters)
            status = ExecutionStatus.SUCCEEDED
            error = None
        except ValueError as exc:
            payload = None
            error = str(exc)
            status = ExecutionStatus.FAILED
        except Exception:
            logger.exception("Generator failed: generator=%s execution_id=%s", name, execution_id)
            payload = None
            error = "Generator failed; contact the platform owner"
            status = ExecutionStatus.FAILED
        execution = Execution(
            id=execution_id,
            generator=name,
            status=status,
            requested_at=started,
            requested_by=actor,
            result=payload,
            error=error,
        )
        self._repository.save(execution)
        return execution

    def get(self, execution_id: UUID) -> Execution | None:
        return self._repository.get(execution_id)
