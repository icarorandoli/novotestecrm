import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign, TrendingUp, BadgeCheck, Hourglass, FileDown,
  CalendarDays, CheckCircle2, ArrowUpRight, Filter, Download,
  LayoutDashboard, PieChart as PieChartIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Project, Client } from "@shared/schema";
import { STATUS_LABELS, STATUS_BADGE_STYLES } from "./dashboard";

interface FinancialStats {
  todayTotal: number;
  monthTotal: number;
  paidCount: number;
  pendingTotal: number;
}

function formatBRL(val: number | string | null | undefined) {
  const n = typeof val === "string"
    ? parseFloat(String(val).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0
    : Number(val ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseValor(v: string | null | undefined): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function RelatoriosPage() {
  const { data: finStats, isLoading: finLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/stats/financial"],
  });

  const { data: paidProjects = [], isLoading: paidLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "paid"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=paid", { credentials: "include" }).then(r => r.json()),
  });

  const { data: pendingProjects = [], isLoading: pendingLoading } = useQuery<(Project & { client: Client | null })[]>({
    queryKey: ["/api/stats/financial/projects", "pending"],
    queryFn: () => fetch("/api/stats/financial/projects?filter=pending", { credentials: "include" }).then(r => r.json()),
  });

  // Build monthly chart data from paid projects
  const monthlyMap: Record<string, number> = {};
  for (const p of paidProjects) {
    if (p.updatedAt && p.valor) {
      const key = getMonthKey(new Date(p.updatedAt));
      monthlyMap[key] = (monthlyMap[key] || 0) + parseValor(p.valor);
    }
  }
  const sortedMonths = Object.keys(monthlyMap).sort();
  const chartData = sortedMonths.map(k => ({
    mes: getMonthLabel(k),
    receita: monthlyMap[k],
  }));

  // Monthly breakdown table
  const monthlyCount: Record<string, number> = {};
  for (const p of paidProjects) {
    if (p.updatedAt) {
      const key = getMonthKey(new Date(p.updatedAt));
      monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Relatórios Financeiros</h1>
          </div>
          <p className="text-muted-foreground">Monitoramento de fluxo de caixa e projetos liquidados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hover-elevate">
            <Filter className="h-4 w-4 mr-2" /> Filtrar
          </Button>
          <Button variant="outline" size="sm" className="hover-elevate">
            <Download className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-all border-emerald-500/20 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Receita Hoje</p>
                {finLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight" data-testid="text-today-revenue">
                    {formatBRL(finStats?.todayTotal)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> 100%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <TrendingUp className="h-6 w-6 text-emerald-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-blue-500/20 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Faturamento Mês</p>
                {finLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight" data-testid="text-month-revenue">
                    {formatBRL(finStats?.monthTotal)}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">Período: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <DollarSign className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-violet-500/20 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Liquidado</p>
                {paidLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 tracking-tight" data-testid="text-paid-revenue">
                    {formatBRL(paidProjects.reduce((s, p) => s + parseValor(p.valor), 0))}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{paidProjects.length} projetos concluídos</p>
              </div>
              <div className="h-12 w-12 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                <BadgeCheck className="h-6 w-6 text-violet-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-orange-500/20 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pendente/Aguardando</p>
                {finLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 tracking-tight" data-testid="text-pending-revenue">
                    {formatBRL(finStats?.pendingTotal)}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{pendingProjects.length} faturas em aberto</p>
              </div>
              <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Hourglass className="h-6 w-6 text-orange-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart and Table row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-muted/40 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Histórico de Recebimentos
                </CardTitle>
                <CardDescription>Visualização mensal de faturamento liquidado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: "12px"
                    }}
                    formatter={(v: number) => [formatBRL(v), "Receita"]} 
                  />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border-2 border-dashed border-muted">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Nenhum dado financeiro para exibir o gráfico</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/40 shadow-md flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Resumo Mensal
            </CardTitle>
            <CardDescription>Tabela comparativa de faturamento</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {sortedMonths.length > 0 ? (
              <div className="space-y-0 divide-y divide-border">
                {[...sortedMonths].reverse().map(key => (
                  <div key={key} className="flex items-center justify-between py-3 hover:bg-muted/30 transition-colors px-2 rounded-lg -mx-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold capitalize">
                        {new Date(key + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{monthlyCount[key] || 0} faturas quitadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(monthlyMap[key])}</p>
                      <div className="flex items-center justify-end text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded mt-1">
                        Pago
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <p className="text-sm text-muted-foreground font-medium">Sem faturas liquidadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos Pagos */}
        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" /> Recebimentos Recentes
                </CardTitle>
                <CardDescription>Últimos projetos com pagamento confirmado</CardDescription>
              </div>
              {!paidLoading && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                  {paidProjects.length} total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {paidLoading ? (
              <div className="p-6 space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : paidProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {paidProjects.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group" data-testid={`row-paid-${p.id}`}>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate font-medium">{p.client?.name || "—"}</p>
                        <span className="text-[10px] text-muted-foreground/40">•</span>
                        {p.updatedAt && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {p.valor && <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatBRL(p.valor)}</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_BADGE_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Hourglass className="h-5 w-5" /> Cobranças Pendentes
                </CardTitle>
                <CardDescription>Aguardando confirmação ou em processamento</CardDescription>
              </div>
              {!pendingLoading && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold">
                  {pendingProjects.length} total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {pendingLoading ? (
              <div className="p-6 space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : pendingProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Hourglass className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum pagamento pendente</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingProjects.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors group" data-testid={`row-pending-${p.id}`}>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
                      <Hourglass className="h-5 w-5 text-orange-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">{p.client?.name || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {p.valor && <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-tight">{formatBRL(p.valor)}</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_BADGE_STYLES[p.status]}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
