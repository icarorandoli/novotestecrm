import { useState, useRef, useEffect, useCallback } from "react";
import { Search, FileText, Users, X, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface SearchResult {
  projects: Array<{ id: string; ticketNumber: string | null; title: string; status: string; potencia: string | null }>;
  clients: Array<{ id: string; name: string; email: string | null; cpfCnpj: string | null; company: string | null }>;
}

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pag. Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando ART",
  protocolado: "Protocolado",
  parecer_acesso: "Parecer de Acesso",
  instalacao: "Instalação",
  vistoria: "Aguardando Vistoria",
  projeto_aprovado: "Proj. Aprovado",
  homologado: "Homologado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) handleClose(); else handleOpen();
      }
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) handleClose();
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const hasResults = results && (results.projects.length > 0 || results.clients.length > 0);
  const isEmpty = results && !hasResults;

  function goToProject(id: string) {
    handleClose();
    navigate(`/projetos?open=${id}`);
  }

  function goToClient(id: string) {
    handleClose();
    navigate(`/clientes`);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 h-8 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground text-xs"
        data-testid="button-global-search"
        title="Busca global (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Buscar…</span>
        <kbd className="hidden md:inline-flex text-[9px] bg-background border border-border px-1 rounded">⌘K</kbd>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[420px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder="Buscar projetos, clientes, tickets…"
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              data-testid="input-global-search"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                Buscando…
              </div>
            )}

            {!loading && isEmpty && (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Nenhum resultado para "<strong>{query}</strong>"</p>
              </div>
            )}

            {!loading && !results && query.length === 0 && (
              <div className="py-6 px-4 text-center text-muted-foreground text-xs">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            {!loading && hasResults && (
              <div>
                {results!.projects.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Projetos
                    </div>
                    {results!.projects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => goToProject(p.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        data-testid={`search-result-project-${p.id}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {p.ticketNumber && (
                              <span className="text-[10px] font-mono text-primary font-semibold">{p.ticketNumber}</span>
                            )}
                            <span className="text-sm text-foreground truncate">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{STATUS_LABELS[p.status] ?? p.status}</span>
                            {p.potencia && <span className="text-[10px] text-muted-foreground">{p.potencia} kWp</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {results!.clients.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Users className="h-3 w-3" /> Clientes
                    </div>
                    {results!.clients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => goToClient(c.id)}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        data-testid={`search-result-client-${c.id}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.cpfCnpj && <span className="text-[10px] text-muted-foreground font-mono">{c.cpfCnpj}</span>}
                            {c.company && <span className="text-[10px] text-muted-foreground">{c.company}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span><kbd className="bg-background border border-border px-1 rounded">↵</kbd> abrir</span>
            <span><kbd className="bg-background border border-border px-1 rounded">Esc</kbd> fechar</span>
          </div>
        </div>
      )}
    </div>
  );
}
