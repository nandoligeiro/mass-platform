from typing import Any
from uuid import uuid4


class SyntheticCustomerGenerator:
    name = "synthetic-customer"
    description = "Generate a synthetic customer identifier (no real personal information)"

    def generate(self, parameters: dict[str, Any]) -> dict[str, Any]:
        if parameters:
            raise ValueError("This generator accepts no parameters")
        return {"customer_id": str(uuid4()), "synthetic": True}
