import { request } from "../../shared/lib/http";
import type {
  ContractFacets,
  ContractSearchFilters,
  ContractSearchResponse,
  CreditCardContract,
} from "./types";

function buildQueryString(filters: ContractSearchFilters): string {
  const params = new URLSearchParams();
  const entries: Array<[string, string | number | boolean | undefined]> = [
    ["q", filters.q?.trim() || undefined],
    ["processor_code", filters.processor_code || undefined],
    ["brand", filters.brand || undefined],
    ["contract_status", filters.contract_status || undefined],
    ["card_status", filters.card_status || undefined],
    ["card_type", filters.card_type || undefined],
    ["product_tier", filters.product_tier || undefined],
    ["invoice_status", filters.invoice_status || undefined],
    ["customer_segment", filters.customer_segment || undefined],
    [
      "min_credit_limit",
      filters.min_credit_limit?.trim() ? Number(filters.min_credit_limit) : undefined,
    ],
    [
      "min_available_limit",
      filters.min_available_limit?.trim() ? Number(filters.min_available_limit) : undefined,
    ],
    ["international_enabled", filters.international_enabled ? true : undefined],
    ["contactless_enabled", filters.contactless_enabled ? true : undefined],
    ["has_virtual_card", filters.has_virtual_card ? true : undefined],
    ["has_additional_card", filters.has_additional_card ? true : undefined],
    ["in_arrears", filters.in_arrears ? true : undefined],
    ["limit", filters.limit],
    ["offset", filters.offset],
  ];

  for (const [key, value] of entries) {
    if (value !== undefined && value !== "" && !Number.isNaN(value)) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const creditCardContractApi = {
  facets: () => request<ContractFacets>("/v1/credit-card-contracts/facets"),
  search: (filters: ContractSearchFilters) =>
    request<ContractSearchResponse>(`/v1/credit-card-contracts${buildQueryString(filters)}`),
  get: (contractId: string) =>
    request<CreditCardContract>(`/v1/credit-card-contracts/${encodeURIComponent(contractId)}`),
};
