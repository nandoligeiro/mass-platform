from collections.abc import Sequence
from typing import Protocol

from mass_platform.modules.credit_card_contracts.models import CreditCardContract


class CreditCardContractRepository(Protocol):
    def list_all(self) -> Sequence[CreditCardContract]: ...

    def get(self, contract_id: str) -> CreditCardContract | None: ...
