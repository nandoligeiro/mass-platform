from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from mass_platform.auth import build_api_key_dependency
from mass_platform.config import Settings
from mass_platform.modules.generators.schemas import (
    ExecutionResponse,
    GenerationRequest,
    GeneratorResponse,
)
from mass_platform.modules.generators.service import GenerationService, UnknownGeneratorError


def create_router(service: GenerationService, settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/v1", tags=["generators"])
    require_actor = build_api_key_dependency(settings)

    @router.get("/generators", response_model=list[GeneratorResponse])
    def catalog(_: str = Depends(require_actor)) -> list[dict[str, str]]:
        return service.catalog()

    @router.post("/generators/{name}/executions", response_model=ExecutionResponse)
    def execute(
        name: str, request: GenerationRequest, actor: str = Depends(require_actor)
    ) -> object:
        try:
            return service.execute(name, request.parameters, actor)
        except UnknownGeneratorError:
            raise HTTPException(status_code=404, detail="Generator not found") from None

    @router.get("/executions/{execution_id}", response_model=ExecutionResponse)
    def get_execution(execution_id: UUID, _: str = Depends(require_actor)) -> object:
        execution = service.get(execution_id)
        if execution is None:
            raise HTTPException(status_code=404, detail="Execution not found")
        return execution

    return router
