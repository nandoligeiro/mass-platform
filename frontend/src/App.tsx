import { useEffect, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, Blocks, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, Code2, CreditCard, Database, Layers3, LoaderCircle, Menu, Plus,
  Search, ShieldCheck, Sparkles, Terminal, XCircle,
} from "lucide-react";
import { creditCardContractApi } from "./features/credit-card-contracts/api";
import { CreditCardContractsView } from "./features/credit-card-contracts/components/CreditCardContractsView";
import { generatorApi, type Generator } from "./features/generators/api";
import { GeneratorCard } from "./features/generators/components/GeneratorCard";
import { executionApi, type Execution } from "./features/executions/api";

type View = "overview" | "credit-cards" | "generators" | "executions";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function App() {
  const [view, setView] = useState<View>("overview");
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [contractsTotal, setContractsTotal] = useState<number | null>(null);
  const [selected, setSelected] = useState("");
  const [parameters, setParameters] = useState("{}");
  const [execution, setExecution] = useState<Execution | null>(null);
  const [history, setHistory] = useState<Execution[]>([]);
  const [lookupId, setLookupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      generatorApi.list().then((items) => {
        setGenerators(items);
        setSelected(items[0]?.name ?? "");
      }),
      creditCardContractApi.facets().then((facets) => {
        setContractsTotal(facets.total_contracts);
      }),
    ])
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setError("");
    let payload: unknown;
    try {
      payload = JSON.parse(parameters);
      if (payload === null || Array.isArray(payload) || typeof payload !== "object") {
        throw new Error("Parâmetros devem ser um objeto JSON.");
      }
    } catch {
      setError("Informe um objeto JSON válido para os parâmetros.");
      return;
    }
    setBusy(true);
    try {
      const created = await generatorApi.execute(selected, payload as Record<string, unknown>);
      setExecution(created);
      setHistory((old) => [created, ...old.filter((item) => item.id !== created.id)]);
      setView("executions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada.");
    } finally {
      setBusy(false);
    }
  }

  async function searchExecution() {
    if (!lookupId.trim()) return;
    setError("");
    setBusy(true);
    try {
      const found = await executionApi.get(lookupId.trim());
      setExecution(found);
      setHistory((old) => [found, ...old.filter((item) => item.id !== found.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execução não encontrada.");
    } finally {
      setBusy(false);
    }
  }

  function downloadResult() {
    if (!execution?.result) return;
    const blob = new Blob([JSON.stringify(execution.result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `execution-${execution.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const pageMeta: Record<View, { breadcrumb: string; title: string; subtitle: string }> = {
    overview: {
      breadcrumb: "Visão geral",
      title: "Seu workspace de dados de teste",
      subtitle: "Consulte contratos de cartão de crédito, gere e reutilize massas sintéticas em um só lugar.",
    },
    "credit-cards": {
      breadcrumb: "Massa de Cartões",
      title: "Busca de massa — Contratos de Cartão de Crédito",
      subtitle: "Filtre contratos sintéticos do emissor por processadora, bandeira, status, fatura, limite e características dos cartões.",
    },
    generators: {
      breadcrumb: "Geradores",
      title: "Catálogo de geradores",
      subtitle: "Explore capacidades disponíveis e execute seus geradores.",
    },
    executions: {
      breadcrumb: "Execuções",
      title: "Execuções",
      subtitle: "Consulte resultados recentes ou busque por identificador.",
    },
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><Layers3 size={22} /></div><div><strong>mass<span>platform</span></strong><small>Developer workspace</small></div></div>
        <div className="side-section">WORKSPACE</div>
        <nav aria-label="Navegação principal">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><Blocks size={18} /> Visão geral</button>
          <button className={view === "credit-cards" ? "active" : ""} onClick={() => setView("credit-cards")}><CreditCard size={18} /> Massa de Cartões {contractsTotal !== null && <span className="nav-count">{contractsTotal}</span>}</button>
          <button className={view === "generators" ? "active" : ""} onClick={() => setView("generators")}><Database size={18} /> Geradores <span className="nav-count">{generators.length}</span></button>
          <button className={view === "executions" ? "active" : ""} onClick={() => setView("executions")}><Clock3 size={18} /> Execuções</button>
        </nav>
        <div className="side-section second">PLATAFORMA</div>
        <div className="nav-static"><ShieldCheck size={18} /> Segurança <span>Em evolução</span></div>
        <div className="nav-static"><Activity size={18} /> Observabilidade <span>Planejada</span></div>
        <div className="sidebar-bottom"><span className="online-dot" /> Ambiente local <span className="version">v0.2.0</span></div>
      </aside>

      <div className="content-shell">
        <header className="topbar"><div className="breadcrumb"><Menu size={17} /><span>Workspace</span><span>/</span><strong>{pageMeta[view].breadcrumb}</strong></div><div className="top-actions"><span className="environment">● Local</span><span className="avatar">MP</span></div></header>
        <main>
          <div className="heading">
            <div>
              <span className="eyebrow">PLATAFORMA DE MASSAS</span>
              <h1>{pageMeta[view].title}</h1>
              <p>{pageMeta[view].subtitle}</p>
            </div>
            <div className="heading-actions">
              {view !== "credit-cards" && (
                <button className="outline-button" onClick={() => setView("credit-cards")}><CreditCard size={16} /> Buscar cartões</button>
              )}
              <button className="outline-button" onClick={() => setView("generators")}><Plus size={16} /> Nova geração</button>
            </div>
          </div>

          {error && <div className="alert" role="alert"><XCircle size={17} /><span>{error}</span><button onClick={() => setError("")}>Fechar</button></div>}

          {view === "overview" && (
            <>
              <section className="stats">
                <div className="stat-card"><div className="stat-header">Contratos de cartão <CreditCard size={19} /></div><strong>{contractsTotal === null ? "—" : contractsTotal.toString().padStart(2, "0")}</strong><small>Massa bancária sintética filtrável</small></div>
                <div className="stat-card"><div className="stat-header">Geradores disponíveis <Database size={19} /></div><strong>{loading ? "—" : generators.length.toString().padStart(2, "0")}</strong><small>Capacidades registradas</small></div>
                <div className="stat-card"><div className="stat-header">Execuções nesta sessão <Activity size={19} /></div><strong>{history.length.toString().padStart(2, "0")}</strong><small>{execution ? `Última em ${formatDate(execution.requested_at)}` : "Desde que abriu a interface"}</small></div>
              </section>
              <section className="hero">
                <div className="hero-text">
                  <span className="hero-tag"><Sparkles size={14} /> MASSA DE TESTES DE CARTÕES</span>
                  <h2>Encontre contratos de cartão em segundos.</h2>
                  <p>Filtre massa sintética do emissor por processadora, bandeira, status do contrato, cartões físicos/virtuais, faturas e limites para acelerar seus testes.</p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => setView("credit-cards")}>Buscar massa de cartões <ArrowRight size={17} /></button>
                    <button className="hero-ghost-button" onClick={() => setView("generators")}>Ver geradores</button>
                  </div>
                </div>
                <div className="hero-graphic"><div className="graphic-card"><div className="code-dots"><i /><i /><i /></div><code><span>GET</span> /v1/credit-card-contracts</code><div className="code-line code-line1" /><div className="code-line code-line2" /><div className="code-line code-line3" /><div className="graphic-success"><CheckCircle2 size={15} /> {contractsTotal ?? 24} contratos</div></div></div>
              </section>
              <section className="section-head"><div><h2>Capacidades em destaque</h2><p>Busca de massa e geradores disponíveis na plataforma</p></div><button className="text-button" onClick={() => setView("credit-cards")}>Abrir busca de cartões <ArrowRight size={16} /></button></section>
              <div className="generator-grid">
                <button className="generator-card" onClick={() => setView("credit-cards")}>
                  <div className="card-icon"><CreditCard size={22} /></div>
                  <div className="card-top"><span className="chip">Busca de massa</span></div>
                  <h3>Contratos de Cartão de Crédito</h3>
                  <p>Pesquise contratos sintéticos por processadora, bandeira (Visa, Mastercard, Elo, Amex, Hipercard), limites, faturas e status.</p>
                  <div className="card-bottom">Abrir busca <ArrowRight size={16} /></div>
                </button>
                {generators.map((g) => <GeneratorCard key={g.name} generator={g} onClick={() => { setSelected(g.name); setView("generators"); }} />)}
              </div>
            </>
          )}

          {view === "credit-cards" && (
            <CreditCardContractsView onTotalLoaded={setContractsTotal} />
          )}

          {view === "generators" && (
            <div className="two-column">
              <section className="panel"><div className="panel-heading"><div><h2>Geradores disponíveis</h2><p>Selecione uma capacidade para executar.</p></div><span className="count-pill">{generators.length}</span></div>{loading && <div className="empty">Carregando catálogo...</div>}{!loading && generators.length === 0 && <div className="empty">Nenhum gerador disponível.</div>}{generators.map((g) => <button key={g.name} onClick={() => setSelected(g.name)} className={selected === g.name ? "generator-row selected" : "generator-row"}><span className="generator-icon"><Database size={19} /></span><span><strong>{g.name}</strong><small>{g.description}</small></span><ChevronDown size={16} /></button>)}</section>
              <section className="panel"><div className="panel-heading"><div><h2>Nova execução</h2><p>Informe os parâmetros do gerador selecionado.</p></div><Terminal size={19} /></div><label className="field-label" htmlFor="generator">Gerador</label><div className="read-only-select" id="generator">{selected || "Selecione um gerador"}<ChevronDown size={16} /></div><label className="field-label" htmlFor="parameters">Parâmetros (JSON)</label><textarea id="parameters" spellCheck={false} value={parameters} onChange={(event) => setParameters(event.target.value)} rows={9} /><p className="field-hint"><CircleHelp size={14} /> O gerador sintético inicial aceita um objeto vazio.</p><button className="primary-button full" disabled={!selected || busy} onClick={generate}>{busy ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />} Executar gerador</button></section>
            </div>
          )}

          {view === "executions" && (
            <div className="two-column execution-columns">
              <section className="panel"><div className="panel-heading"><div><h2>Encontrar execução</h2><p>Consulte uma execução persistida pelo ID.</p></div><Search size={19} /></div><div className="search-row"><input aria-label="ID da execução" placeholder="UUID da execução" value={lookupId} onChange={(event) => setLookupId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchExecution(); }} /><button className="primary-button" disabled={busy || !lookupId.trim()} onClick={searchExecution}>Buscar</button></div><div className="panel-heading recent"><div><h2>Recentes nesta sessão</h2><p>Execuções realizadas ou consultadas aqui.</p></div></div>{history.length === 0 ? <div className="empty">Nenhuma execução nesta sessão. Gere uma massa para começar.</div> : history.map((item) => <button className="history-row" key={item.id} onClick={() => setExecution(item)}><span className={item.status === "succeeded" ? "result-icon good" : "result-icon bad"}>{item.status === "succeeded" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span><span><strong>{item.generator}</strong><small>{formatDate(item.requested_at)} · {item.id.slice(0, 8)}...</small></span><ArrowRight size={16} /></button>)}</section>
              <section className="panel result-panel"><div className="panel-heading"><div><h2>Detalhes da execução</h2><p>Resultado e metadados da solicitação.</p></div><Code2 size={19} /></div>{execution ? <><div className="result-meta"><span>ID da execução</span><code>{execution.id}</code><span>Gerador</span><strong>{execution.generator}</strong><span>Status</span><span className={execution.status === "succeeded" ? "chip success" : "chip failed"}>{execution.status === "succeeded" ? "Concluída" : "Falhou"}</span><span>Iniciada em</span><strong>{formatDate(execution.requested_at)}</strong></div><div className="result-heading"><h3>{execution.result ? "Resultado JSON" : "Erro da execução"}</h3>{execution.result && <button className="text-button" onClick={downloadResult}><ArrowDownToLine size={15} /> Baixar JSON</button>}</div><pre className="result-code">{execution.result ? JSON.stringify(execution.result, null, 2) : execution.error}</pre></> : <div className="empty detail-empty">Selecione uma execução ou busque pelo ID.</div>}</section>
            </div>
          )}
          <footer>Mass Platform <span>·</span> Ambiente de desenvolvimento <span>·</span> API v1</footer>
        </main>
      </div>
    </div>
  );
}

export default App;
