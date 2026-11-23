from dataclasses import dataclass
from datetime import date
from enum import StrEnum


class CardBrand(StrEnum):
    VISA = "visa"
    MASTERCARD = "mastercard"
    ELO = "elo"
    AMEX = "amex"
    HIPERCARD = "hipercard"


class ProductTier(StrEnum):
    STANDARD = "standard"
    GOLD = "gold"
    PLATINUM = "platinum"
    BLACK = "black"
    INFINITE = "infinite"


class ContractStatus(StrEnum):
    ACTIVE = "ativo"
    TEMP_BLOCKED = "bloqueado_temporario"
    FRAUD_BLOCKED = "bloqueado_fraude"
    OVERDUE = "em_atraso"
    CANCELLED = "cancelado"
    UNDER_REVIEW = "em_analise"


class CardStatus(StrEnum):
    ACTIVE = "ativo"
    USER_BLOCKED = "bloqueado_usuario"
    LOST_OR_STOLEN = "bloqueado_perda_roubo"
    PENDING_ACTIVATION = "aguardando_desbloqueio"
    CANCELLED = "cancelado"
    EXPIRED = "expirado"


class CardType(StrEnum):
    PHYSICAL = "fisico"
    VIRTUAL = "virtual"
    TEMPORARY_VIRTUAL = "virtual_temporario"


class CardOwnership(StrEnum):
    PRIMARY = "titular"
    ADDITIONAL = "adicional"


class InvoiceStatus(StrEnum):
    OPEN = "aberta"
    CLOSED = "fechada"
    PAID = "paga"
    OVERDUE = "em_atraso"
    INSTALLMENTS = "parcelada"


class CustomerSegment(StrEnum):
    RETAIL = "varejo"
    AFFLUENT = "alta_renda"
    PRIVATE = "private"
    SME = "pj_mei"


@dataclass(frozen=True)
class CreditCard:
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
    digital_wallet_tokens: tuple[str, ...] = ()


@dataclass(frozen=True)
class CreditCardContract:
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
    due_day: int
    closing_day: int
    invoice_status: InvoiceStatus
    days_overdue: int
    annual_fee_waived: bool
    opened_at: date
    cards: tuple[CreditCard, ...]
    synthetic: bool = True

    @property
    def used_limit(self) -> float:
        return round(max(0.0, self.credit_limit - self.available_limit), 2)


@dataclass(frozen=True)
class ContractSearchQuery:
    q: str | None = None
    processor_code: str | None = None
    brand: CardBrand | None = None
    contract_status: ContractStatus | None = None
    card_status: CardStatus | None = None
    card_type: CardType | None = None
    product_tier: ProductTier | None = None
    invoice_status: InvoiceStatus | None = None
    customer_segment: CustomerSegment | None = None
    min_credit_limit: float | None = None
    min_available_limit: float | None = None
    international_enabled: bool | None = None
    contactless_enabled: bool | None = None
    has_virtual_card: bool | None = None
    has_additional_card: bool | None = None
    in_arrears: bool | None = None
    limit: int = 25
    offset: int = 0


@dataclass(frozen=True)
class ContractSearchResult:
    items: tuple[CreditCardContract, ...]
    total: int
    limit: int
    offset: int


@dataclass(frozen=True)
class ProcessorFacet:
    code: str
    name: str


@dataclass(frozen=True)
class ContractFacets:
    total_contracts: int
    total_cards: int
    processors: tuple[ProcessorFacet, ...]
    brands: tuple[CardBrand, ...]
    contract_statuses: tuple[ContractStatus, ...]
    card_statuses: tuple[CardStatus, ...]
    card_types: tuple[CardType, ...]
    product_tiers: tuple[ProductTier, ...]
    invoice_statuses: tuple[InvoiceStatus, ...]
    customer_segments: tuple[CustomerSegment, ...]
