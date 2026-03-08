import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FolderOpen, Users, CheckCircle, Clock, Zap, AlertCircle,
  XCircle, FileText, ClipboardList, Wrench, Eye, ShieldCheck,
  DollarSign, TrendingUp, BadgeCheck, Hourglass, ChevronRight,
  KanbanSquare, Plus, Settings, ExternalLink,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import type { Project, Client } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado_pagamento_pendente: "Pag. Pendente",
  projeto_tecnico: "Projeto Técnico",
  aguardando_art: "Aguardando ART",
  protocolado: "Protocolado",
  parecer_acesso: "Parecer de Acesso",
  instalacao: "Instalação",
  vistoria: "Vistoria",
  projeto_aprovado: "Projeto Aprovado",
  homologado: "Homologado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  orcamento: "#94a3b8",
  aprovado_pagamento_pendente: "#eab308",
  projeto_tecnico: "#3b82f6",
  aguardando_art: "#8b5cf6",
  protocolado: "#7c3aed",
  parecer_acesso: "#f59e0b",
  instalacao: "#f97316",
  vistoria: "#06b6d4",
  projeto_aprovado: "#10b981",
  homologado: "#22c55e",
  finalizado: "#1e3a5f",
  cancelado: "#ef4444",
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
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

const STATUS_ICONS: Record<string, React.ElementType> = {
  orcamento: Clock,
  aprovado_pagamento_pendente: AlertCircle,
  projeto_tecnico: FileText,
  aguardando_art: ClipboardList,
  protocolado: ClipboardList,
  parecer_acesso: AlertCircle,
  instalacao: Wrench,
  vistoria: Eye,
  projeto_aprovado: CheckCircle,
  homologado: ShieldCheck,
  finalizado: FolderOpen,
  cancelado: XCircle,
};

const STATUS_ORDER = [
  "orcamento", "aprovado_pagamento_pendente", "projeto_tecnico", "aguardando_art",
  "protocolado", "parecer_acesso", "instalacao", "vistoria",
  "projeto_aprovado", "homologado", "finalizado", "cancelado",
];

interface Stats {
  totalProjects: number;
  totalClients: number;
  byStatus: Record<string, number>;
}

interface FinancialStats {
  todayTotal: number;
  monthTotal: number;
  paidCount: number;
  pendingTotal: number;
}

type FinancialFilter = "today" | "month" | "paid" | "pending";

const FILTER_LABELS: Record<FinancialFilter, string> = {
  today: "Receita Hoje",
  month: "Receita do Mês",
  paid: "Projetos Pagos",
  pending: "A Receber",
};

function formatBRL(val: number | string | null | undefined) {
  const n = typeof val === "string"
    ? parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0
    : Number(val ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProjectRow({ project, linkTo }: { project: Project & { client: Client | null }; linkTo?: string }) {
  const inner = (
    <div className={`flex items-start gap-3 py-3 border-b border-border/50 last:border-0 ${linkTo ? "hover-elevate rounded-md px-2 -mx-2 transition-colors cursor-pointer" : ""}`}>
      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-foreground">{project.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {project.client?.name || "—"}
          {project.concessionaria ? ` · ${project.concessionaria}` : ""}
        </p>
        {project.updatedAt && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Atualizado em {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {project.valor && (
          <span className="text-sm font-bold text-foreground">{formatBRL(project.valor)}</span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${STATUS_BADGE_STYLES[project.status]}`}>
          {STATUS_LABELS[project.status] || project.status}
        </span>
      </div>
    </div>
  );
  if (linkTo) return <Link href={linkTo}>{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FinancialFilter | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({ queryKey: ["/api/stats"] });
  const { data: projects = [], isLoading: projectsLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/projects"],
  });
  const canSeeFinancial = ["admin", "financeiro"].includes(user?.role || "");
  const { data: finStats, isLoading: finLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/stats/financial"],
    enabled: canSeeFinancial,
  });
  const { data: filterProjects = [], isLoading: filterLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", activeFilter],
    queryFn: () => fetch(`/api/stats/financial/projects?filter=${activeFilter}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!activeFilter,
  });

  const recentProjects = projects.slice(0, 5);

  const homologados = stats?.byStatus?.homologado ?? 0;
  const emAndamento = Object.entries(stats?.byStatus || {})
    .filter(([s]) => !["orcamento", "homologado", "cancelado", "finalizado"].includes(s))
    .reduce((sum, [, v]) => sum + v, 0);

  const projectsByStatus = activeStatus
    ? projects.filter(p => p.status === activeStatus)
    : [];

  const attentionProjects = projects.filter(p =>
    p.status === "aprovado_pagamento_pendente" || p.status === "cancelado"
  );

  const barData = STATUS_ORDER
    .filter(s => s !== "cancelado")
    .map(status => ({
      name: STATUS_LABELS[status],
      value: stats?.byStatus?.[status] ?? 0,
      color: STATUS_COLORS[status],
      status,
    }))
    .filter(d => d.value > 0);

  const quickActions = [
    { title: "Novo Projeto", desc: "Cadastrar projeto", href: "/projetos", icon: Plus, variant: "default" as const },
    { title: "Kanban", desc: "Ver quadro visual", href: "/kanban", icon: KanbanSquare, variant: "outline" as const },
    { title: "Clientes", desc: "Gerenciar integradores", href: "/clientes", icon: Users, variant: "outline" as const },
    ...(user?.role === "admin" || user?.role === "financeiro" ? [
      { title: "Configurações", desc: "Ajustar sistema", href: "/configuracoes", icon: Settings, variant: "ghost" as const },
    ] : []),
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground text-base mt-1">Visão geral da operação e desempenho em tempo real</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {quickActions.map(action => (
            <Link key={action.title} href={action.href}>
              <Button 
                variant={action.variant}
                className="gap-2 h-11 px-5 font-semibold shadow-sm"
                data-testid={`button-quick-${action.title.toLowerCase().replace(/\s/g, "-")}`}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Atenção Necessária */}
      {!projectsLoading && attentionProjects.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-base font-bold text-foreground">
                Atenção Necessária
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({attentionProjects.length} projeto{attentionProjects.length !== 1 ? "s" : ""} pendente{attentionProjects.length !== 1 ? "s" : ""})
                </span>
              </p>
            </div>
            <Link href="/projetos" className="text-sm font-semibold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {attentionProjects.slice(0, 3).map(p => (
              <Link key={p.id} href={`/projetos`}>
                <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border shadow-sm hover-elevate cursor-pointer transition-all" data-testid={`card-attention-${p.id}`}>
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground uppercase tracking-tight">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.client?.name || "—"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Total de Projetos", 
            value: stats?.totalProjects ?? 0, 
            sub: "Projetos no sistema", 
            icon: FolderOpen, 
            color: "text-blue-600", 
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            testId: "text-total-projects"
          },
          { 
            label: "Integradores", 
            value: stats?.totalClients ?? 0, 
            sub: "Parceiros ativos", 
            icon: Users, 
            color: "text-indigo-600", 
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
            testId: "text-total-clients"
          },
          { 
            label: "Em Andamento", 
            value: emAndamento, 
            sub: "Processo ativo", 
            icon: Zap, 
            color: "text-amber-600", 
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            testId: "text-in-progress-projects"
          },
          { 
            label: "Homologados", 
            value: homologados, 
            sub: "Conexões aprovadas", 
            icon: ShieldCheck, 
            color: "text-emerald-600", 
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            testId: "text-homologated-projects"
          }
        ].map((kpi, idx) => (
          <Card key={idx} className={`hover-elevate border-l-4 ${kpi.border} overflow-visible`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground tracking-tight uppercase mb-2">{kpi.label}</p>
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : (
                    <div className={`text-4xl font-black tracking-tighter ${kpi.color}`} data-testid={kpi.testId}>{kpi.value}</div>
                  )}
                  <p className="text-xs text-muted-foreground/80 mt-2 font-medium">{kpi.sub}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Stats */}
      {canSeeFinancial && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Fluxo Financeiro</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { key: "today" as FinancialFilter, label: "Receita Hoje", value: formatBRL(finStats?.todayTotal), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
              { key: "month" as FinancialFilter, label: "Faturamento Mês", value: formatBRL(finStats?.monthTotal), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
              { key: "paid" as FinancialFilter, label: "Projetos Pagos", value: String(finStats?.paidCount ?? 0), icon: BadgeCheck, color: "text-violet-500", bg: "bg-violet-500/5", border: "border-violet-500/20" },
              { key: "pending" as FinancialFilter, label: "A Receber", value: formatBRL(finStats?.pendingTotal), icon: Hourglass, color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20" },
            ].map(item => (
              <Card
                key={item.key}
                className={`hover-elevate cursor-pointer border ${item.border} ${item.bg} group overflow-visible`}
                onClick={() => setActiveFilter(item.key)}
                data-testid={`card-fin-${item.key}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-wider mb-2">{item.label}</p>
                      {finLoading ? <Skeleton className="h-8 w-32" /> : (
                        <div className={`text-2xl font-black tracking-tight ${item.color}`}>{item.value}</div>
                      )}
                      <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        <span className="text-xs font-bold text-foreground">Ver detalhes</span>
                        <ChevronRight className="h-3 w-3 text-foreground" />
                      </div>
                    </div>
                    <div className={`h-11 w-11 rounded-full bg-white dark:bg-card flex items-center justify-center flex-shrink-0 shadow-sm border border-border/50`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">Projetos Recentes</h2>
            </div>
            <Link href="/projetos">
              <Button variant="ghost" size="sm" className="font-bold text-primary">Ver Tudo</Button>
            </Link>
          </div>
          <Card className="overflow-visible">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 px-6">
                {projectsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="py-4 flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))
                ) : recentProjects.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Nenhum projeto encontrado</p>
                  </div>
                ) : (
                  recentProjects.map(p => (
                    <ProjectRow key={p.id} project={p} linkTo={`/projetos`} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Status da Operação</h2>
          </div>
          <Card className="overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Volume por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 10, fontWeight: 600 }} 
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-xl animate-in zoom-in-95">
                              <p className="text-xs font-bold text-popover-foreground uppercase tracking-tight mb-1">{data.name}</p>
                              <p className="text-lg font-black" style={{ color: data.color }}>{data.value} projetos</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-2">
                {barData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-semibold text-muted-foreground uppercase tracking-tighter">{d.name}</span>
                    </div>
                    <span className="font-black text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fluxo de Homologação — Stepper Visual */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Fluxo de Homologação</h2>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Etapas do Processo</p>
        </div>
        <Card className="overflow-visible border-none bg-transparent shadow-none">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-6 pt-2 scrollbar-hide no-scrollbar -mx-2 px-2">
              {STATUS_ORDER.filter(s => s !== "cancelado").map((status, i) => {
                const count = stats?.byStatus?.[status] ?? 0;
                const Icon = STATUS_ICONS[status] || Clock;
                const isClickable = count > 0;
                return (
                  <div key={status} className="flex items-center flex-shrink-0 group">
                    <button
                      onClick={() => isClickable && setActiveStatus(status)}
                      className={`relative flex flex-col items-center gap-3 px-4 py-6 rounded-2xl border transition-all duration-300 w-[120px] shadow-sm ${
                        isClickable
                          ? "bg-card border-border hover:border-primary hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                          : "bg-card/40 border-border/40 cursor-default opacity-40 grayscale"
                      }`}
                      disabled={!isClickable}
                      data-testid={`flow-step-${status}`}
                    >
                      <div className="absolute top-2 right-2 text-[10px] font-black opacity-10 select-none">0{i+1}</div>
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-inner"
                        style={{ backgroundColor: `${STATUS_COLORS[status]}15` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: STATUS_COLORS[status] }} />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter leading-tight line-clamp-2 px-1">{STATUS_LABELS[status]}</p>
                        <p className="text-2xl font-black tracking-tighter" style={{ color: count > 0 ? STATUS_COLORS[status] : undefined }}>{count}</p>
                      </div>
                    </button>
                    {i < STATUS_ORDER.filter(s => s !== "cancelado").length - 1 && (
                      <div className="w-6 h-px bg-border/50 mx-[-4px] relative z-[-1]" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheets remain same for functionality */}
      <Sheet open={!!activeFilter} onOpenChange={(o) => { if (!o) setActiveFilter(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-4 border-l-primary">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              {activeFilter ? FILTER_LABELS[activeFilter] : ""}
            </SheetTitle>
          </SheetHeader>
          {filterLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : filterProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
              <FolderOpen className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-bold text-lg uppercase tracking-tighter opacity-40">Nenhum projeto encontrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Resumo da Seleção</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-foreground">
                    {formatBRL(filterProjects.reduce((s, p) => {
                      const v = p.valor ? parseFloat(String(p.valor).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;
                      return s + v;
                    }, 0))}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">({filterProjects.length} projeto{filterProjects.length !== 1 ? "s" : ""})</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {filterProjects.map(p => <ProjectRow key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!activeStatus} onOpenChange={(o) => { if (!o) setActiveStatus(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l-4" style={{ borderLeftColor: activeStatus ? STATUS_COLORS[activeStatus] : undefined }}>
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              {activeStatus && (() => {
                const Icon = STATUS_ICONS[activeStatus] || Clock;
                return (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: `${STATUS_COLORS[activeStatus]}15` }}>
                    <Icon className="h-6 w-6" style={{ color: STATUS_COLORS[activeStatus] }} />
                  </div>
                );
              })()}
              {activeStatus ? STATUS_LABELS[activeStatus] : ""}
            </SheetTitle>
          </SheetHeader>
          {projectsByStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
              <FolderOpen className="h-16 w-16 mb-4 opacity-10" />
              <p className="font-bold text-lg uppercase tracking-tighter opacity-40">Nenhum projeto neste status</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl p-5 border" style={{ backgroundColor: activeStatus ? `${STATUS_COLORS[activeStatus]}05` : undefined, borderColor: activeStatus ? `${STATUS_COLORS[activeStatus]}15` : undefined }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: activeStatus ? STATUS_COLORS[activeStatus] : undefined }}>Status Atual</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-foreground">{projectsByStatus.length}</span>
                  <span className="text-sm font-semibold text-muted-foreground">projeto{projectsByStatus.length !== 1 ? "s" : ""} em {activeStatus ? STATUS_LABELS[activeStatus] : ""}</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {projectsByStatus.map(p => (
                  <ProjectRow key={p.id} project={p} linkTo={`/projetos`} />
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
