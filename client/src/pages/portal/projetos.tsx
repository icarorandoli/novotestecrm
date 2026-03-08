import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Search, ChevronRight, Zap, Building, FileText, Loader2 } from "lucide-react";
import type { Project, Client } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pag. Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando ART",
  protocolado: "Protocolado",
  parecer_acesso: "Parecer de Acesso",
  instalacao: "Em Instalação",
  vistoria: "Aguardando Vistoria",
  projeto_aprovado: "Projeto Aprovado",
  homologado: "Homologado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  orcamento: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  aprovado_pagamento_pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  projeto_tecnico: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  aguardando_art: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  protocolado: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  parecer_acesso: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  instalacao: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  vistoria: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  projeto_aprovado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  homologado: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  finalizado: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  orcamento: "#94a3b8", aprovado_pagamento_pendente: "#eab308",
  projeto_tecnico: "#3b82f6", aguardando_art: "#8b5cf6",
  protocolado: "#7c3aed", parecer_acesso: "#f59e0b",
  instalacao: "#f97316", vistoria: "#06b6d4",
  projeto_aprovado: "#10b981", homologado: "#22c55e",
  finalizado: "#1e3a5f", cancelado: "#ef4444",
};

type ProjectWithClient = Project & { client: Client | null };

export default function PortalProjetosPage() {
  const [search, setSearch] = useState("");
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects"],
  });

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p as any).ticketNumber?.toLowerCase().includes(q) ||
      p.concessionaria?.toLowerCase().includes(q) ||
      p.numeroProtocolo?.toLowerCase().includes(q) ||
      STATUS_LABELS[p.status]?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 py-8 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground" data-testid="text-portal-projetos-title">
            Meus Projetos
          </h1>
          <p className="text-muted-foreground font-medium">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Carregando base de dados...
              </span>
            ) : (
              `Gerenciando ${projects.length} projeto${projects.length !== 1 ? "s" : ""} no portal`
            )}
          </p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar por nome, protocolo, concessionária..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 h-12 bg-muted/30 border-border/40 focus:bg-background transition-all shadow-sm rounded-xl"
            data-testid="input-search-portal-projects"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 opacity-20" />
            </div>
            <p className="font-bold text-lg text-foreground">
              {search ? "Nenhum resultado encontrado" : "Nenhum projeto ativo"}
            </p>
            <p className="text-sm mt-1 max-w-xs text-center">
              {search 
                ? "Não encontramos projetos com os termos pesquisados. Tente ajustar sua busca." 
                : "Você ainda não possui projetos de homologação em sua conta."}
            </p>
            {search && (
              <Button variant="ghost" onClick={() => setSearch("")} className="mt-4 font-bold">
                Limpar busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(project => (
            <Link key={project.id} href={`/portal/projetos/${project.id}`}>
              <Card 
                className="group border-border/40 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden rounded-2xl"
                data-testid={`card-portal-proj-${project.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-stretch min-h-[100px]">
                    {/* Status Indicator Bar */}
                    <div 
                      className="w-1.5 shrink-0 transition-all group-hover:w-2" 
                      style={{ backgroundColor: STATUS_COLORS[project.status] }} 
                    />
                    
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6 p-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {(project as any).ticketNumber && (
                            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 bg-primary/5 text-primary border-primary/20 font-bold">
                              {(project as any).ticketNumber}
                            </Badge>
                          )}
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                            {project.title}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                          {project.potencia && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              {project.potencia} kWp
                            </div>
                          )}
                          {project.concessionaria && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <Building className="h-3.5 w-3.5 text-sky-500" />
                              {project.concessionaria}
                            </div>
                          )}
                          {project.numeroProtocolo && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <FileText className="h-3.5 w-3.5 text-purple-500" />
                              Prot. {project.numeroProtocolo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-0 border-border/40">
                        <div className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm ${STATUS_BADGE_STYLES[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
