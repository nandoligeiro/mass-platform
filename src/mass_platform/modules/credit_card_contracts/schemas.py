from datetime import date

from pydantic import BaseModel, ConfigDict

from mass_platform.modules.credit_card_contracts.models import (
    CardBrand,
    CardOwnership,
    CardStatus,
    CardType,
    ContractStatus,
    CustomerSegment,
    InvoiceStatus,
    ProductTier,
)


class CreditCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    card_id: str
    masked_pan: str
    bin: str
    last4: str
    brand: CardBrand
    card_type: CardType
    ownership: CardOwnership
    status: CardStatus
    expiry: str
    contactless_enabled: bool
    international_enabled: bool
    digital_wallet_tokens: list[str]


class CreditCardContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    contract_id: str
    customer_id: str
    customer_label: str
    customer_segment: CustomerSegment
    processor_code: str
    processor_name: str
    product_name: str
    product_tier: ProductTier
    status: ContractStatus
    credit_limit: float
    available_limit: float
    used_limit: float
    due_day: int
    closing_day: int
    invoice_status: InvoiceStatus
    days_overdue: int
    annual_fee_waived: bool
    opened_at: date
    synthetic: bool
    cards: list[CreditCardResponse]


class ContractSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[CreditCardContractResponse]
    total: int
    limit: int
    offset: int


class ProcessorFacetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str


class ContractFacetsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_contracts: int
    total_cards: int
    processors: list[ProcessorFacetResponse]
    brands: list[CardBrand]
    contract_statuses: list[ContractStatus]
    card_statuses: list[CardStatus]
    card_types: list[CardType]
    product_tiers: list[ProductTier]
    invoice_statuses: list[InvoiceStatus]
    customer_segments: list[CustomerSegment]
