from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from mass_platform.modules.executions.models import ExecutionStatus


class GenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    parameters: dict[str, Any] = Field(default_factory=dict)


class ExecutionResponse(BaseModel):
    id: UUID
    generator: str
    status: ExecutionStatus
    requested_at: datetime
    requested_by: str
    result: dict[str, Any] | None
    error: str | None


class GeneratorResponse(BaseModel):
    name: str
    description: str
