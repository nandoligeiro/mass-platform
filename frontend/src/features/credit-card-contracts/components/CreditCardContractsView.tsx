import {
  ArrowDownToLine,
  Check,
  Code2,
  Copy,
  CreditCard as CreditCardIcon,
  Filter,
  LoaderCircle,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { creditCardContractApi } from "../api";
import {
  BRAND_LABELS,
  CARD_STATUS_LABELS,
  CARD_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  SEGMENT_LABELS,
  TIER_LABELS,
  cardStatusTone,
  contractStatusTone,
  formatCurrencyBRL,
  formatIsoDate,
  invoiceStatusTone,
  type CardBrand,
  type CardStatus,
  type CardType,
  type ContractFacets,
  type ContractSearchFilters,
  type ContractStatus,
  type CreditCardContract,
  type CustomerSegment,
  type InvoiceStatus,
  type ProductTier,
} from "../types";
import { CreditCardBadge } from "./CreditCardBadge";

const INITIAL_FILTERS: ContractSearchFilters = {
  q: "",
  processor_code: "",
  brand: "",
  contract_status: "",
  card_status: "",
  card_type: "",
  product_tier: "",
  invoice_status: "",
  customer_segment: "",
  min_available_limit: "",
  international_enabled: false,
  contactless_enabled: false,
  has_virtual_card: false,
  has_additional_card: false,
  in_arrears: false,
  limit: 50,
  offset: 0,
};

interface ScenarioPreset {
  id: string;
  label: string;
  filters: Partial<ContractSearchFilters>;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: "all", label: "Todos os contratos", filters: {} },
  {
    id: "active-high-limit",
    label: "Ativos · limite ≥ R$ 10k",
    filters: { contract_status: "ativo", card_status: "ativo", min_available_limit: "10000" },
  },
  { id: "overdue", label: "Em atraso", filters: { in_arrears: true } },
  {
    id: "fraud",
    label: "Bloqueio por fraude",
    filters: { contract_status: "bloqueado_fraude" },
  },
  { id: "virtual", label: "Com cartão virtual", filters: { has_virtual_card: true } },
  {
    id: "pending-unlock",
    label: "Aguardando desbloqueio",
    filters: { card_status: "aguardando_desbloqueio" },
  },
  {
    id: "private",
    label: "Private / Infinite",
    filters: { customer_segment: "private" },
  },
];

function countActiveFilters(filters: ContractSearchFilters): number {
  let count = 0;
  if (filters.q?.trim()) count += 1;
  if (filters.processor_code) count += 1;
  if (filters.brand) count += 1;
  if (filters.contract_status) count += 1;
  if (filters.card_status) count += 1;
  if (filters.card_type) count += 1;
  if (filters.product_tier) count += 1;
  if (filters.invoice_status) count += 1;
  if (filters.customer_segment) count += 1;
  if (filters.min_available_limit?.trim()) count += 1;
  if (filters.international_enabled) count += 1;
  if (filters.contactless_enabled) count += 1;
  if (filters.has_virtual_card) count += 1;
  if (filters.has_additional_card) count += 1;
  if (filters.in_arrears) count += 1;
  return count;
}

export function CreditCardContractsView({
  onTotalLoaded,
}: {
  onTotalLoaded?: (total: number) => void;
}) {
  const [facets, setFacets] = useState<ContractFacets | null>(null);
  const [filters, setFilters] = useState<ContractSearchFilters>(INITIAL_FILTERS);
  const [activePreset, setActivePreset] = useState("all");
  const [contracts, setContracts] = useState<CreditCardContract[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showJson, setShowJson] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    creditCardContractApi
      .facets()
      .then((data) => {
        if (!cancelled) {
          setFacets(data);
          onTotalLoaded?.(data.total_contracts);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [onTotalLoaded]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      creditCardContractApi
        .search(filters)
        .then((result) => {
          if (cancelled) return;
          setContracts(result.items);
          setTotal(result.total);
          setSelectedId((current) => {
            if (result.items.some((item) => item.contract_id === current)) {
              return current;
            }
            return result.items[0]?.contract_id ?? "";
          });
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters]);

  const selectedContract = useMemo(
    () => contracts.find((item) => item.contract_id === selectedId) ?? null,
    [contracts, selectedId],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  function updateFilter<K extends keyof ContractSearchFilters>(
    key: K,
    value: ContractSearchFilters[K],
  ) {
    setActivePreset("");
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  }

  function applyPreset(preset: ScenarioPreset) {
    setActivePreset(preset.id);
    setFilters({ ...INITIAL_FILTERS, ...preset.filters });
  }

  function resetFilters() {
    setActivePreset("all");
    setFilters(INITIAL_FILTERS);
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch {
      setCopiedKey("");
    }
  }

  function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="contracts-workspace">
      {error && (
        <div className="alert" role="alert">
          <XCircle size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Fechar
          </button>
        </div>
      )}

      <section className="panel filter-panel">
        <div className="filter-top-row">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              aria-label="Buscar contrato, cliente, processadora, produto, BIN ou final do cartão"
              placeholder="Buscar por contrato, cliente, processadora, produto, BIN ou últimos 4 dígitos..."
              value={filters.q ?? ""}
              onChange={(event) => updateFilter("q", event.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="outline-button compact"
              onClick={() => setShowFilters((open) => !open)}
            >
              <SlidersHorizontal size={15} />
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <button
              type="button"
              className="outline-button compact"
              disabled={activeFilterCount === 0}
              onClick={resetFilters}
            >
              <RotateCcw size={15} /> Limpar
            </button>
            <button
              type="button"
              className="outline-button compact"
              disabled={contracts.length === 0}
              onClick={() => downloadJson("massa-contratos-cartao.json", contracts)}
            >
              <ArrowDownToLine size={15} /> Exportar JSON ({contracts.length})
            </button>
          </div>
        </div>

        <div className="preset-strip" role="group" aria-label="Cenários rápidos de teste">
          <span className="preset-label">
            <Filter size={13} /> Cenários rápidos:
          </span>
          {SCENARIO_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={activePreset === preset.id ? "preset-pill active" : "preset-pill"}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {showFilters && (
          <>
            <div className="filter-grid">
              <label className="filter-field">
                <span>Processadora</span>
                <select
                  value={filters.processor_code ?? ""}
                  onChange={(event) => updateFilter("processor_code", event.target.value)}
                >
                  <option value="">Todas as processadoras</option>
                  {facets?.processors.map((processor) => (
                    <option key={processor.code} value={processor.code}>
                      {processor.name} ({processor.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Bandeira</span>
                <select
                  value={filters.brand ?? ""}
                  onChange={(event) => updateFilter("brand", event.target.value as CardBrand | "")}
                >
                  <option value="">Todas as bandeiras</option>
                  {(facets?.brands ?? []).map((brand) => (
                    <option key={brand} value={brand}>
                      {BRAND_LABELS[brand]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Status do contrato</span>
                <select
                  value={filters.contract_status ?? ""}
                  onChange={(event) =>
                    updateFilter("contract_status", event.target.value as ContractStatus | "")
                  }
                >
                  <option value="">Todos os status</option>
                  {(facets?.contract_statuses ?? []).map((st) => (
                    <option key={st} value={st}>
                      {CONTRACT_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Status do cartão</span>
                <select
                  value={filters.card_status ?? ""}
                  onChange={(event) =>
                    updateFilter("card_status", event.target.value as CardStatus | "")
                  }
                >
                  <option value="">Todos os status</option>
                  {(facets?.card_statuses ?? []).map((st) => (
                    <option key={st} value={st}>
                      {CARD_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Tipo de cartão</span>
                <select
                  value={filters.card_type ?? ""}
                  onChange={(event) =>
                    updateFilter("card_type", event.target.value as CardType | "")
                  }
                >
                  <option value="">Todos os tipos</option>
                  {(facets?.card_types ?? []).map((type) => (
                    <option key={type} value={type}>
                      {CARD_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Categoria / Tier</span>
                <select
                  value={filters.product_tier ?? ""}
                  onChange={(event) =>
                    updateFilter("product_tier", event.target.value as ProductTier | "")
                  }
                >
                  <option value="">Todas as categorias</option>
                  {(facets?.product_tiers ?? []).map((tier) => (
                    <option key={tier} value={tier}>
                      {TIER_LABELS[tier]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Status da fatura</span>
                <select
                  value={filters.invoice_status ?? ""}
                  onChange={(event) =>
                    updateFilter("invoice_status", event.target.value as InvoiceStatus | "")
                  }
                >
                  <option value="">Todas as faturas</option>
                  {(facets?.invoice_statuses ?? []).map((st) => (
                    <option key={st} value={st}>
                      {INVOICE_STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Segmento</span>
                <select
                  value={filters.customer_segment ?? ""}
                  onChange={(event) =>
                    updateFilter("customer_segment", event.target.value as CustomerSegment | "")
                  }
                >
                  <option value="">Todos os segmentos</option>
                  {(facets?.customer_segments ?? []).map((seg) => (
                    <option key={seg} value={seg}>
                      {SEGMENT_LABELS[seg]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-field">
                <span>Limite disponível mín. (R$)</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  placeholder="Ex: 5000"
                  value={filters.min_available_limit ?? ""}
                  onChange={(event) => updateFilter("min_available_limit", event.target.value)}
                />
              </label>
            </div>

            <div className="toggle-row" role="group" aria-label="Características adicionais">
              <button
                type="button"
                className={filters.international_enabled ? "toggle-pill active" : "toggle-pill"}
                onClick={() =>
                  updateFilter("international_enabled", !filters.international_enabled)
                }
              >
                Internacional
              </button>
              <button
                type="button"
                className={filters.contactless_enabled ? "toggle-pill active" : "toggle-pill"}
                onClick={() => updateFilter("contactless_enabled", !filters.contactless_enabled)}
              >
                Aproximação (NFC)
              </button>
              <button
                type="button"
                className={filters.has_virtual_card ? "toggle-pill active" : "toggle-pill"}
                onClick={() => updateFilter("has_virtual_card", !filters.has_virtual_card)}
              >
                Possui cartão virtual
              </button>
              <button
                type="button"
                className={filters.has_additional_card ? "toggle-pill active" : "toggle-pill"}
                onClick={() => updateFilter("has_additional_card", !filters.has_additional_card)}
              >
                Possui adicional
              </button>
              <button
                type="button"
                className={filters.in_arrears ? "toggle-pill active danger" : "toggle-pill"}
                onClick={() => updateFilter("in_arrears", !filters.in_arrears)}
              >
                Em atraso
              </button>
            </div>
          </>
        )}
      </section>

      <div className="contracts-split">
        <section className="panel contracts-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Contratos encontrados</h2>
              <p>
                {loading
                  ? "Consultando catálogo de massa sintética..."
                  : `${total} de ${facets?.total_contracts ?? total} contratos · ${facets?.total_cards ?? 0} cartões no catálogo`}
              </p>
            </div>
            <span className="count-pill">{total}</span>
          </div>

          {loading ? (
            <div className="empty">
              <LoaderCircle size={20} className="spin" />
              <p>Buscando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="empty">
              <p>Nenhum contrato sintético corresponde aos filtros informados.</p>
              <button type="button" className="outline-button compact" onClick={resetFilters}>
                <RotateCcw size={14} /> Redefinir filtros
              </button>
            </div>
          ) : (
            <div className="contract-list">
              {contracts.map((contract) => {
                const usagePct =
                  contract.credit_limit > 0
                    ? Math.min(100, Math.round((contract.used_limit / contract.credit_limit) * 100))
                    : 0;
                const isSelected = contract.contract_id === selectedId;
                return (
                  <button
                    type="button"
                    key={contract.contract_id}
                    className={isSelected ? "contract-item selected" : "contract-item"}
                    onClick={() => setSelectedId(contract.contract_id)}
                  >
                    <div className="contract-item-head">
                      <div>
                        <span className="bank-line">
                          <Server size={13} /> {contract.processor_name}
                        </span>
                        <strong>{contract.product_name}</strong>
                      </div>
                      <span className={`status-badge tone-${contractStatusTone(contract.status)}`}>
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </div>

                    <div className="contract-item-ids">
                      <code>{contract.contract_id}</code>
                      <span>·</span>
                      <span>{contract.customer_id}</span>
                      <span>·</span>
                      <span>{SEGMENT_LABELS[contract.customer_segment]}</span>
                    </div>

                    <div className="limit-mini">
                      <div className="limit-mini-labels">
                        <span>Disp.: {formatCurrencyBRL(contract.available_limit)}</span>
                        <span>Limite: {formatCurrencyBRL(contract.credit_limit)}</span>
                      </div>
                      <div className="limit-bar">
                        <div className="limit-bar-fill" style={{ width: `${usagePct}%` }} />
                      </div>
                    </div>

                    <div className="contract-item-foot">
                      <div className="card-pills">
                        {contract.cards.map((card) => (
                          <span key={card.card_id} className="mini-card-pill">
                            <span className={`dot tone-${cardStatusTone(card.status)}`} />
                            {BRAND_LABELS[card.brand]} ••{card.last4}
                          </span>
                        ))}
                      </div>
                      <span
                        className={`invoice-mini tone-${invoiceStatusTone(contract.invoice_status)}`}
                      >
                        {contract.days_overdue > 0
                          ? `${contract.days_overdue}d atraso`
                          : `Fatura ${INVOICE_STATUS_LABELS[contract.invoice_status].toLowerCase()}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel contract-detail-panel">
          {!selectedContract ? (
            <div className="empty detail-empty">
              Selecione um contrato à esquerda para inspecionar cartões, limites e status.
            </div>
          ) : (
            <>
              <div className="detail-header">
                <div>
                  <div className="detail-eyebrow-row">
                    <span className="synthetic-pill">
                      <ShieldAlert size={12} /> Massa sintética · PAN mascarado
                    </span>
                    <span className="tier-pill">{TIER_LABELS[selectedContract.product_tier]}</span>
                  </div>
                  <h2>{selectedContract.product_name}</h2>
                  <p>
                    {selectedContract.processor_name} ({selectedContract.processor_code}) ·{" "}
                    {selectedContract.customer_label}
                  </p>
                </div>
                <span
                  className={`status-badge tone-${contractStatusTone(selectedContract.status)}`}
                >
                  {CONTRACT_STATUS_LABELS[selectedContract.status]}
                </span>
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  className="outline-button compact"
                  onClick={() => copyText("contract_id", selectedContract.contract_id)}
                >
                  {copiedKey === "contract_id" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === "contract_id" ? "ID copiado" : selectedContract.contract_id}
                </button>
                <button
                  type="button"
                  className="outline-button compact"
                  onClick={() =>
                    copyText("json", JSON.stringify(selectedContract, null, 2))
                  }
                >
                  {copiedKey === "json" ? <Check size={14} /> : <Code2 size={14} />}
                  {copiedKey === "json" ? "JSON copiado" : "Copiar JSON"}
                </button>
                <button
                  type="button"
                  className="outline-button compact"
                  onClick={() =>
                    downloadJson(`${selectedContract.contract_id}.json`, selectedContract)
                  }
                >
                  <ArrowDownToLine size={14} /> Baixar JSON
                </button>
              </div>

              <div className="limit-summary-grid">
                <div className="limit-box">
                  <span>Limite total</span>
                  <strong>{formatCurrencyBRL(selectedContract.credit_limit)}</strong>
                </div>
                <div className="limit-box">
                  <span>Utilizado</span>
                  <strong>{formatCurrencyBRL(selectedContract.used_limit)}</strong>
                </div>
                <div className="limit-box highlight">
                  <span>Disponível</span>
                  <strong>{formatCurrencyBRL(selectedContract.available_limit)}</strong>
                </div>
              </div>

              <div className="detail-meta-grid">
                <div>
                  <span>ID do cliente</span>
                  <code>{selectedContract.customer_id}</code>
                </div>
                <div>
                  <span>Segmento</span>
                  <strong>{SEGMENT_LABELS[selectedContract.customer_segment]}</strong>
                </div>
                <div>
                  <span>Fatura</span>
                  <span
                    className={`status-badge tone-${invoiceStatusTone(selectedContract.invoice_status)}`}
                  >
                    {INVOICE_STATUS_LABELS[selectedContract.invoice_status]}
                    {selectedContract.days_overdue > 0
                      ? ` (${selectedContract.days_overdue} dias)`
                      : ""}
                  </span>
                </div>
                <div>
                  <span>Fechamento / Vencimento</span>
                  <strong>
                    Dia {selectedContract.closing_day} / Dia {selectedContract.due_day}
                  </strong>
                </div>
                <div>
                  <span>Anuidade</span>
                  <strong>{selectedContract.annual_fee_waived ? "Isenta" : "Cobrada"}</strong>
                </div>
                <div>
                  <span>Abertura do contrato</span>
                  <strong>{formatIsoDate(selectedContract.opened_at)}</strong>
                </div>
              </div>

              <div className="detail-cards-section">
                <div className="detail-section-head">
                  <h3>
                    <CreditCardIcon size={16} /> Cartões vinculados ({selectedContract.cards.length}
                    )
                  </h3>
                </div>
                <div className="cc-list">
                  {selectedContract.cards.map((card) => (
                    <CreditCardBadge key={card.card_id} card={card} />
                  ))}
                </div>
              </div>

              <div className="json-toggle-wrap">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowJson((open) => !open)}
                >
                  <Code2 size={15} /> {showJson ? "Ocultar payload JSON" : "Ver payload JSON"}
                </button>
                {showJson && (
                  <pre className="result-code">{JSON.stringify(selectedContract, null, 2)}</pre>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
