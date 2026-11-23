export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard";
export type ProductTier = "standard" | "gold" | "platinum" | "black" | "infinite";
export type ContractStatus =
  | "ativo"
  | "bloqueado_temporario"
  | "bloqueado_fraude"
  | "em_atraso"
  | "cancelado"
  | "em_analise";
export type CardStatus =
  | "ativo"
  | "bloqueado_usuario"
  | "bloqueado_perda_roubo"
  | "aguardando_desbloqueio"
  | "cancelado"
  | "expirado";
export type CardType = "fisico" | "virtual" | "virtual_temporario";
export type CardOwnership = "titular" | "adicional";
export type InvoiceStatus = "aberta" | "fechada" | "paga" | "em_atraso" | "parcelada";
export type CustomerSegment = "varejo" | "alta_renda" | "private" | "pj_mei";

export interface CreditCard {
  card_id: string;
  masked_pan: string;
  bin: string;
  last4: string;
  brand: CardBrand;
  card_type: CardType;
  ownership: CardOwnership;
  status: CardStatus;
  expiry: string;
  contactless_enabled: boolean;
  international_enabled: boolean;
  digital_wallet_tokens: string[];
}

export interface CreditCardContract {
  contract_id: string;
  customer_id: string;
  customer_label: string;
  customer_segment: CustomerSegment;
  processor_code: string;
  processor_name: string;
  product_name: string;
  product_tier: ProductTier;
  status: ContractStatus;
  credit_limit: number;
  available_limit: number;
  used_limit: number;
  due_day: number;
  closing_day: number;
  invoice_status: InvoiceStatus;
  days_overdue: number;
  annual_fee_waived: boolean;
  opened_at: string;
  synthetic: boolean;
  cards: CreditCard[];
}

export interface ContractSearchResponse {
  items: CreditCardContract[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProcessorFacet {
  code: string;
  name: string;
}

export interface ContractFacets {
  total_contracts: number;
  total_cards: number;
  processors: ProcessorFacet[];
  brands: CardBrand[];
  contract_statuses: ContractStatus[];
  card_statuses: CardStatus[];
  card_types: CardType[];
  product_tiers: ProductTier[];
  invoice_statuses: InvoiceStatus[];
  customer_segments: CustomerSegment[];
}

export interface ContractSearchFilters {
  q?: string;
  processor_code?: string;
  brand?: CardBrand | "";
  contract_status?: ContractStatus | "";
  card_status?: CardStatus | "";
  card_type?: CardType | "";
  product_tier?: ProductTier | "";
  invoice_status?: InvoiceStatus | "";
  customer_segment?: CustomerSegment | "";
  min_credit_limit?: string;
  min_available_limit?: string;
  international_enabled?: boolean;
  contactless_enabled?: boolean;
  has_virtual_card?: boolean;
  has_additional_card?: boolean;
  in_arrears?: boolean;
  limit?: number;
  offset?: number;
}

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
};

export const TIER_LABELS: Record<ProductTier, string> = {
  standard: "Standard",
  gold: "Gold",
  platinum: "Platinum",
  black: "Black",
  infinite: "Infinite",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ativo: "Ativo",
  bloqueado_temporario: "Bloqueado temporário",
  bloqueado_fraude: "Bloqueado fraude",
  em_atraso: "Em atraso",
  cancelado: "Cancelado",
  em_analise: "Em análise",
};

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  ativo: "Ativo",
  bloqueado_usuario: "Bloqueado usuário",
  bloqueado_perda_roubo: "Perda / Roubo",
  aguardando_desbloqueio: "Aguardando desbloqueio",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  fisico: "Físico",
  virtual: "Virtual",
  virtual_temporario: "Virtual temporário",
};

export const OWNERSHIP_LABELS: Record<CardOwnership, string> = {
  titular: "Titular",
  adicional: "Adicional",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  aberta: "Aberta",
  fechada: "Fechada",
  paga: "Paga",
  em_atraso: "Em atraso",
  parcelada: "Parcelada",
};

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  varejo: "Varejo",
  alta_renda: "Alta Renda",
  private: "Private",
  pj_mei: "PJ / MEI",
};

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

export function contractStatusTone(status: ContractStatus): BadgeTone {
  switch (status) {
    case "ativo":
      return "success";
    case "bloqueado_temporario":
    case "em_analise":
      return "warning";
    case "bloqueado_fraude":
    case "em_atraso":
      return "danger";
    case "cancelado":
      return "neutral";
  }
}

export function cardStatusTone(status: CardStatus): BadgeTone {
  switch (status) {
    case "ativo":
      return "success";
    case "aguardando_desbloqueio":
    case "bloqueado_usuario":
      return "warning";
    case "bloqueado_perda_roubo":
      return "danger";
    case "cancelado":
    case "expirado":
      return "neutral";
  }
}

export function invoiceStatusTone(status: InvoiceStatus): BadgeTone {
  switch (status) {
    case "paga":
      return "success";
    case "aberta":
    case "fechada":
      return "info";
    case "parcelada":
      return "warning";
    case "em_atraso":
      return "danger";
  }
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
