from fastapi import APIRouter, Depends, HTTPException, Query

from mass_platform.auth import build_api_key_dependency
from mass_platform.config import Settings
from mass_platform.modules.credit_card_contracts.models import (
    CardBrand,
    CardStatus,
    CardType,
    ContractSearchQuery,
    ContractStatus,
    CustomerSegment,
    InvoiceStatus,
    ProductTier,
)
from mass_platform.modules.credit_card_contracts.schemas import (
    ContractFacetsResponse,
    ContractSearchResponse,
    CreditCardContractResponse,
)
from mass_platform.modules.credit_card_contracts.service import (
    ContractNotFoundError,
    CreditCardContractService,
)


def create_credit_card_contracts_router(
    service: CreditCardContractService, settings: Settings
) -> APIRouter:
    router = APIRouter(prefix="/v1/credit-card-contracts", tags=["credit-card-contracts"])
    require_actor = build_api_key_dependency(settings)

    @router.get("/facets", response_model=ContractFacetsResponse)
    def facets(_: str = Depends(require_actor)) -> object:
        return service.facets()

    @router.get("", response_model=ContractSearchResponse)
    def search(
        q: str | None = Query(default=None, max_length=120),
        processor_code: str | None = Query(default=None, max_length=20),
        brand: CardBrand | None = None,
        contract_status: ContractStatus | None = None,
        card_status: CardStatus | None = None,
        card_type: CardType | None = None,
        product_tier: ProductTier | None = None,
        invoice_status: InvoiceStatus | None = None,
        customer_segment: CustomerSegment | None = None,
        min_credit_limit: float | None = Query(default=None, ge=0),
        min_available_limit: float | None = Query(default=None, ge=0),
        international_enabled: bool | None = None,
        contactless_enabled: bool | None = None,
        has_virtual_card: bool | None = None,
        has_additional_card: bool | None = None,
        in_arrears: bool | None = None,
        limit: int = Query(default=25, ge=1, le=100),
        offset: int = Query(default=0, ge=0),
        _: str = Depends(require_actor),
    ) -> object:
        query = ContractSearchQuery(
            q=q,
            processor_code=processor_code,
            brand=brand,
            contract_status=contract_status,
            card_status=card_status,
            card_type=card_type,
            product_tier=product_tier,
            invoice_status=invoice_status,
            customer_segment=customer_segment,
            min_credit_limit=min_credit_limit,
            min_available_limit=min_available_limit,
            international_enabled=international_enabled,
            contactless_enabled=contactless_enabled,
            has_virtual_card=has_virtual_card,
            has_additional_card=has_additional_card,
            in_arrears=in_arrears,
            limit=limit,
            offset=offset,
        )
        return service.search(query)

    @router.get("/{contract_id}", response_model=CreditCardContractResponse)
    def get_contract(contract_id: str, _: str = Depends(require_actor)) -> object:
        try:
            return service.get(contract_id)
        except ContractNotFoundError:
            raise HTTPException(status_code=404, detail="Credit card contract not found") from None

    return router
