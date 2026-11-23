from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID


class ExecutionStatus(StrEnum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass(frozen=True)
class Execution:
    id: UUID
    generator: str
    status: ExecutionStatus
    requested_at: datetime
    requested_by: str
    result: dict[str, Any] | None
    error: str | None
