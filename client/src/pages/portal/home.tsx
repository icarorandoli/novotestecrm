import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, ShieldCheck, Clock, Zap, ChevronRight, FileText, Building } from "lucide-react";
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

export default function PortalHomePage() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });

  const active = projects.filter(p => p.status !== "cancelado" && p.status !== "homologado").length;
  const homologados = projects.filter(p => p.status === "homologado").length;

  return (
    <div className="px-4 py-8 md:p-10 space-y-10 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12 text-primary-foreground shadow-2xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-3 py-1">
              Portal do Integrador
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight" data-testid="text-portal-welcome">
              Bem-vindo, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-sky-100/80 text-lg font-medium max-w-md">
              Acompanhe o status de suas homologações e gerencie seus projetos com facilidade.
            </p>
          </div>
          
          <Button asChild size="lg" className="bg-white text-primary hover:bg-sky-50 shadow-xl active:scale-[0.98] transition-all font-bold px-8 h-14" data-testid="button-new-project-portal">
            <Link href="/portal/novo-projeto">
              <Plus className="h-5 w-5 mr-2" /> Solicitar Novo Projeto
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total de Projetos", value: projects.length, icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", testId: "text-portal-total" },
          { label: "Em Andamento", value: active, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", testId: "text-portal-active" },
          { label: "Homologados", value: homologados, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", testId: "text-portal-homologados" }
        ].map((stat, i) => (
          <Card key={i} className="border-border/40 hover-elevate group overflow-hidden shadow-sm">
            <CardContent className="p-8 relative">
              <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:rotate-12`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-5xl font-black tracking-tight" data-testid={stat.testId}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects list */}
        <Card className="lg:col-span-2 border-border/40 shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 bg-muted/30 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Projetos Recentes</CardTitle>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Últimas atualizações do seu portal</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild data-testid="link-all-projects" className="font-bold text-primary hover:text-primary hover:bg-primary/5">
              <Link href="/portal/projetos">Ver todos <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <FolderOpen className="h-10 w-10 opacity-20" />
                </div>
                <p className="font-bold text-lg">Nenhum projeto encontrado</p>
                <p className="text-sm mt-1 mb-8">Comece solicitando seu primeiro projeto.</p>
                <Button asChild size="sm" className="font-bold">
                  <Link href="/portal/novo-projeto">
                    <Plus className="h-4 w-4 mr-2" /> Criar Projeto
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {projects.slice(0, 5).map(project => (
                  <Link key={project.id} href={`/portal/projetos/${project.id}`}>
                    <div className="group flex items-center gap-6 p-6 hover:bg-muted/50 cursor-pointer transition-all" data-testid={`card-portal-project-${project.id}`}>
                      <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                          <Zap className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-background" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {(project as any).ticketNumber && (
                            <Badge variant="secondary" className="font-mono text-[10px] py-0 h-5 px-1.5 border-primary/20 bg-primary/5 text-primary">
                              {(project as any).ticketNumber}
                            </Badge>
                          )}
                          <p className="font-bold truncate text-foreground group-hover:text-primary transition-colors">{project.title}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                          {project.potencia && (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" /> {project.potencia} kWp
                            </span>
                          )}
                          {project.concessionaria && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" /> {project.concessionaria}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`hidden sm:flex px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider ${STATUS_BADGE_STYLES[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Column */}
        <div className="space-y-8">
          {/* Quick Help */}
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-lg font-bold">Suporte Premium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Nossa equipe de engenharia está pronta para auxiliar você em qualquer etapa.
              </p>
              <Button className="w-full font-bold shadow-lg shadow-primary/20" asChild>
                <a href="https://wa.me/seunumerowhatsapp" target="_blank" rel="noopener noreferrer">
                  Falar com Engenheiro
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="border-border/40 shadow-xl shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Fluxo de Trabalho</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {[
                  { num: "01", title: "Documentação", desc: "Envio inicial de dados e docs", icon: FileText, color: "text-sky-500" },
                  { num: "02", title: "Projeto Técnico", desc: "Elaboração pela nossa engenharia", icon: Zap, color: "text-amber-500" },
                  { num: "03", title: "Protocolo", desc: "Submissão à concessionária", icon: FolderOpen, color: "text-purple-500" },
                  { num: "04", title: "Conclusão", desc: "Homologação final concluída", icon: ShieldCheck, color: "text-emerald-500" },
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-5 hover:bg-muted/30 transition-colors border-b last:border-0 border-border/40">
                    <div className="h-10 w-10 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {step.num}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{step.title}</p>
                      <p className="text-xs text-muted-foreground font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
