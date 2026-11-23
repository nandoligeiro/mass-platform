import { ArrowRight, Database } from "lucide-react";
import type { Generator } from "../api";

export function GeneratorCard({
  generator,
  onClick,
}: {
  generator: Generator;
  onClick: () => void;
}) {
  return (
    <button className="generator-card" onClick={onClick}>
      <div className="card-icon"><Database size={22} /></div>
      <div className="card-top"><span className="chip">Disponível</span></div>
      <h3>{generator.name}</h3>
      <p>{generator.description}</p>
      <div className="card-bottom">Abrir gerador <ArrowRight size={16} /></div>
    </button>
  );
}
