import { Check, Copy, Globe, Smartphone, Wifi } from "lucide-react";
import { useState } from "react";
import {
  BRAND_LABELS,
  CARD_STATUS_LABELS,
  CARD_TYPE_LABELS,
  OWNERSHIP_LABELS,
  cardStatusTone,
  type CreditCard,
} from "../types";

export function CreditCardBadge({ card }: { card: CreditCard }) {
  const [copied, setCopied] = useState(false);

  async function copyCardId() {
    try {
      await navigator.clipboard.writeText(card.card_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`cc-card brand-${card.brand}`}>
      <div className="cc-card-top">
        <div className="cc-brand-group">
          <span className={`brand-pill brand-${card.brand}`}>{BRAND_LABELS[card.brand]}</span>
          <span className="cc-tag">{CARD_TYPE_LABELS[card.card_type]}</span>
          <span className="cc-tag">{OWNERSHIP_LABELS[card.ownership]}</span>
        </div>
        <span className={`status-badge tone-${cardStatusTone(card.status)}`}>
          {CARD_STATUS_LABELS[card.status]}
        </span>
      </div>

      <div className="cc-pan-row">
        <code className="cc-pan">{card.masked_pan}</code>
        <button
          type="button"
          className="icon-copy-btn"
          onClick={copyCardId}
          title={`Copiar ID do cartão (${card.card_id})`}
          aria-label={`Copiar ID do cartão ${card.card_id}`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copiado" : card.card_id}</span>
        </button>
      </div>

      <div className="cc-meta-row">
        <span>
          BIN <strong>{card.bin}</strong>
        </span>
        <span>
          Final <strong>{card.last4}</strong>
        </span>
        <span>
          Validade <strong>{card.expiry}</strong>
        </span>
      </div>

      <div className="cc-capabilities">
        <span className={card.contactless_enabled ? "cap-pill on" : "cap-pill off"}>
          <Wifi size={12} /> {card.contactless_enabled ? "NFC ativo" : "Sem NFC"}
        </span>
        <span className={card.international_enabled ? "cap-pill on" : "cap-pill off"}>
          <Globe size={12} /> {card.international_enabled ? "Internacional" : "Nacional"}
        </span>
        {card.digital_wallet_tokens.map((wallet) => (
          <span key={wallet} className="cap-pill wallet">
            <Smartphone size={12} /> {wallet}
          </span>
        ))}
      </div>
    </div>
  );
}
