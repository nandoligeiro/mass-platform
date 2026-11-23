from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from mass_platform.config import Settings, get_settings
from mass_platform.modules.credit_card_contracts.adapters import SyntheticCreditCardContractCatalog
from mass_platform.modules.credit_card_contracts.router import create_credit_card_contracts_router
from mass_platform.modules.credit_card_contracts.service import CreditCardContractService
from mass_platform.modules.executions.repository import (
    Base,
    SqlExecutionRepository,
    create_database,
)
from mass_platform.modules.generators.adapters import SyntheticCustomerGenerator
from mass_platform.modules.generators.router import create_router
from mass_platform.modules.generators.service import GenerationService


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    settings.validate_security()
    session_factory, engine = create_database(settings.database_url)
    service = GenerationService(
        [SyntheticCustomerGenerator()], SqlExecutionRepository(session_factory)
    )
    contract_service = CreditCardContractService(SyntheticCreditCardContractCatalog())

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        if settings.app_env == "local":
            Base.metadata.create_all(bind=engine)
        yield
        engine.dispose()

    app = FastAPI(title="Mass Platform API", version="0.2.0", lifespan=lifespan)

    @app.get("/health/live")
    def liveness() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(create_router(service, settings))
    app.include_router(create_credit_card_contracts_router(contract_service, settings))
    return app


app = create_app()
