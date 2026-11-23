from mass_platform.modules.credit_card_contracts.models import (
    CardBrand,
    CardOwnership,
    CardStatus,
    CardType,
    ContractFacets,
    ContractSearchQuery,
    ContractSearchResult,
    ContractStatus,
    CreditCard,
    CreditCardContract,
    CustomerSegment,
    InvoiceStatus,
    ProcessorFacet,
    ProductTier,
)
from mass_platform.modules.credit_card_contracts.ports import CreditCardContractRepository


class ContractNotFoundError(ValueError):
    pass


class CreditCardContractService:
    def __init__(self, repository: CreditCardContractRepository) -> None:
        self._repository = repository

    def search(self, query: ContractSearchQuery) -> ContractSearchResult:
        if query.limit < 1 or query.limit > 100:
            raise ValueError("limit must be between 1 and 100")
        if query.offset < 0:
            raise ValueError("offset must be zero or positive")
        if query.min_credit_limit is not None and query.min_credit_limit < 0:
            raise ValueError("min_credit_limit must be zero or positive")
        if query.min_available_limit is not None and query.min_available_limit < 0:
            raise ValueError("min_available_limit must be zero or positive")

        matched = [
            contract for contract in self._repository.list_all() if self._matches(contract, query)
        ]
        total = len(matched)
        sliced = tuple(matched[query.offset : query.offset + query.limit])
        return ContractSearchResult(
            items=sliced,
            total=total,
            limit=query.limit,
            offset=query.offset,
        )

    def get(self, contract_id: str) -> CreditCardContract:
        contract = self._repository.get(contract_id)
        if contract is None:
            raise ContractNotFoundError(contract_id)
        return contract

    def facets(self) -> ContractFacets:
        contracts = self._repository.list_all()
        processors_map: dict[str, str] = {}
        total_cards = 0
        for contract in contracts:
            processors_map[contract.processor_code] = contract.processor_name
            total_cards += len(contract.cards)
        processors = tuple(
            ProcessorFacet(code=code, name=name)
            for code, name in sorted(processors_map.items(), key=lambda pair: pair[0])
        )
        return ContractFacets(
            total_contracts=len(contracts),
            total_cards=total_cards,
            processors=processors,
            brands=tuple(CardBrand),
            contract_statuses=tuple(ContractStatus),
            card_statuses=tuple(CardStatus),
            card_types=tuple(CardType),
            product_tiers=tuple(ProductTier),
            invoice_statuses=tuple(InvoiceStatus),
            customer_segments=tuple(CustomerSegment),
        )

    def _matches(self, contract: CreditCardContract, query: ContractSearchQuery) -> bool:
        if query.processor_code and contract.processor_code != query.processor_code.strip():
            return False
        if query.contract_status and contract.status != query.contract_status:
            return False
        if query.product_tier and contract.product_tier != query.product_tier:
            return False
        if query.invoice_status and contract.invoice_status != query.invoice_status:
            return False
        if query.customer_segment and contract.customer_segment != query.customer_segment:
            return False
        if (
            query.min_credit_limit is not None
            and contract.credit_limit < query.min_credit_limit
        ):
            return False
        if (
            query.min_available_limit is not None
            and contract.available_limit < query.min_available_limit
        ):
            return False
        if query.in_arrears is not None:
            is_in_arrears = contract.days_overdue > 0 or contract.status == ContractStatus.OVERDUE
            if is_in_arrears != query.in_arrears:
                return False
        if query.has_virtual_card is not None:
            has_virtual = any(
                card.card_type in (CardType.VIRTUAL, CardType.TEMPORARY_VIRTUAL)
                for card in contract.cards
            )
            if has_virtual != query.has_virtual_card:
                return False
        if query.has_additional_card is not None:
            has_additional = any(
                card.ownership == CardOwnership.ADDITIONAL for card in contract.cards
            )
            if has_additional != query.has_additional_card:
                return False

        # Card-level criteria: when multiple card filters are combined, require at least one card
        # in the contract that satisfies all specified card-level criteria together.
        if any(
            value is not None
            for value in (
                query.brand,
                query.card_status,
                query.card_type,
                query.international_enabled,
                query.contactless_enabled,
            )
        ):
            if not any(self._card_matches(card, query) for card in contract.cards):
                return False

        if query.q and query.q.strip():
            needle = query.q.strip().lower()
            haystack = " ".join(
                [
                    contract.contract_id,
                    contract.customer_id,
                    contract.customer_label,
                    contract.processor_code,
                    contract.processor_name,
                    contract.product_name,
                    contract.product_tier.value,
                    contract.status.value,
                    *[
                        f"{c.card_id} {c.bin} {c.last4} {c.brand.value} {c.status.value}"
                        for c in contract.cards
                    ],
                ]
            ).lower()
            if needle not in haystack:
                return False

        return True

    @staticmethod
    def _card_matches(card: CreditCard, query: ContractSearchQuery) -> bool:
        if query.brand and card.brand != query.brand:
            return False
        if query.card_status and card.status != query.card_status:
            return False
        if query.card_type and card.card_type != query.card_type:
            return False
        if (
            query.international_enabled is not None
            and card.international_enabled != query.international_enabled
        ):
            return False
        if (
            query.contactless_enabled is not None
            and card.contactless_enabled != query.contactless_enabled
        ):
            return False
        return True
