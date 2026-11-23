import pytest
from fastapi.testclient import TestClient

from mass_platform.modules.credit_card_contracts.adapters import SyntheticCreditCardContractCatalog
from mass_platform.modules.credit_card_contracts.models import (
    CardBrand,
    CardOwnership,
    CardStatus,
    CardType,
    ContractSearchQuery,
    ContractStatus,
    CustomerSegment,
    InvoiceStatus,
    ProductTier,
)
from mass_platform.modules.credit_card_contracts.service import (
    ContractNotFoundError,
    CreditCardContractService,
)


def test_service_filters_by_banking_and_card_attributes() -> None:
    service = CreditCardContractService(SyntheticCreditCardContractCatalog())

    visa_active = service.search(
        ContractSearchQuery(
            brand=CardBrand.VISA,
            contract_status=ContractStatus.ACTIVE,
            card_status=CardStatus.ACTIVE,
            min_available_limit=50000,
        )
    )
    assert visa_active.total >= 2
    for contract in visa_active.items:
        assert contract.status == ContractStatus.ACTIVE
        assert contract.available_limit >= 50000
        assert any(
            card.brand == CardBrand.VISA and card.status == CardStatus.ACTIVE
            for card in contract.cards
        )

    overdue = service.search(ContractSearchQuery(in_arrears=True))
    assert overdue.total >= 3
    assert all(
        contract.days_overdue > 0 or contract.status == ContractStatus.OVERDUE
        for contract in overdue.items
    )

    virtual_and_additional = service.search(
        ContractSearchQuery(has_virtual_card=True, has_additional_card=True)
    )
    assert virtual_and_additional.total >= 2
    for contract in virtual_and_additional.items:
        assert any(
            card.card_type in (CardType.VIRTUAL, CardType.TEMPORARY_VIRTUAL)
            for card in contract.cards
        )
        assert any(card.ownership == CardOwnership.ADDITIONAL for card in contract.cards)


def test_service_text_search_matches_bin_last4_and_contract() -> None:
    service = CreditCardContractService(SyntheticCreditCardContractCatalog())

    by_last4 = service.search(ContractSearchQuery(q="1048"))
    assert by_last4.total == 1
    assert by_last4.items[0].contract_id == "CTR-VP-000101"

    by_processor = service.search(ContractSearchQuery(processor_code="PROC-PISMO"))
    assert by_processor.total >= 4
    assert all(item.processor_code == "PROC-PISMO" for item in by_processor.items)

    by_bin = service.search(ContractSearchQuery(q="606001"))
    assert by_bin.total >= 3
    assert all(
        any(card.brand == CardBrand.HIPERCARD for card in item.cards) for item in by_bin.items
    )


def test_service_pagination_validation_and_not_found() -> None:
    service = CreditCardContractService(SyntheticCreditCardContractCatalog())

    page1 = service.search(ContractSearchQuery(limit=5, offset=0))
    page2 = service.search(ContractSearchQuery(limit=5, offset=5))
    assert len(page1.items) == 5
    assert len(page2.items) == 5
    assert page1.items[0].contract_id != page2.items[0].contract_id
    assert page1.total == page2.total

    with pytest.raises(ValueError, match="limit"):
        service.search(ContractSearchQuery(limit=0))
    with pytest.raises(ValueError, match="offset"):
        service.search(ContractSearchQuery(offset=-1))
    with pytest.raises(ValueError, match="min_credit_limit"):
        service.search(ContractSearchQuery(min_credit_limit=-10))
    with pytest.raises(ContractNotFoundError):
        service.get("CTR-999-MISSING")


def test_credit_card_contracts_endpoints_require_auth(client: TestClient) -> None:
    assert client.get("/v1/credit-card-contracts").status_code == 401
    assert client.get("/v1/credit-card-contracts/facets").status_code == 401
    assert client.get("/v1/credit-card-contracts/CTR-VP-000101").status_code == 401


def test_credit_card_contracts_facets_and_search_api(client: TestClient) -> None:
    auth = {"X-API-Key": "test-secret"}

    facets_resp = client.get("/v1/credit-card-contracts/facets", headers=auth)
    assert facets_resp.status_code == 200
    facets = facets_resp.json()
    assert facets["total_contracts"] == 24
    assert facets["total_cards"] > 24
    assert len(facets["processors"]) == 5
    assert any(proc["code"] == "PROC-VPLUS" for proc in facets["processors"])
    assert "visa" in facets["brands"]
    assert "elo" in facets["brands"]

    search_resp = client.get(
        "/v1/credit-card-contracts",
        params={
            "processor_code": "PROC-PISMO",
            "brand": CardBrand.ELO.value,
            "customer_segment": CustomerSegment.SME.value,
            "invoice_status": InvoiceStatus.OPEN.value,
            "product_tier": ProductTier.PLATINUM.value,
        },
        headers=auth,
    )
    assert search_resp.status_code == 200
    payload = search_resp.json()
    assert payload["total"] == 1
    contract = payload["items"][0]
    assert contract["contract_id"] == "CTR-PM-000108"
    assert contract["processor_code"] == "PROC-PISMO"
    assert contract["synthetic"] is True
    assert contract["used_limit"] == round(
        contract["credit_limit"] - contract["available_limit"], 2
    )
    assert all("••" in card["masked_pan"] for card in contract["cards"])


def test_credit_card_contracts_detail_and_validation_errors(client: TestClient) -> None:
    auth = {"X-API-Key": "test-secret"}

    found = client.get("/v1/credit-card-contracts/CTR-DK-000102", headers=auth)
    assert found.status_code == 200
    assert found.json()["processor_code"] == "PROC-DOCK"
    assert len(found.json()["cards"]) == 2

    missing = client.get("/v1/credit-card-contracts/CTR-DOES-NOT-EXIST", headers=auth)
    assert missing.status_code == 404

    invalid_brand = client.get(
        "/v1/credit-card-contracts", params={"brand": "invalida"}, headers=auth
    )
    assert invalid_brand.status_code == 422

    invalid_limit = client.get(
        "/v1/credit-card-contracts", params={"min_available_limit": -5}, headers=auth
    )
    assert invalid_limit.status_code == 422
