import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, TrendingUp, FolderOpen, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity, PieChart 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, AreaChart, Area 
} from "recharts";
import type { StatusConfig } from "@shared/schema";
import { getBadgeClass } from "@/lib/status-colors";

interface AnalyticsData {
  months: Array<{ month: string; count: number; revenue: number }>;
  byStatus: Record<string, number>;
  totalProjects: number;
}

const CHART_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f97316"];

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({ queryKey: ["/api/analytics"] });
  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));

  const totalRevenue = data?.months.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalCreated = data?.months.reduce((s, m) => s + m.count, 0) ?? 0;

  const statusEntries = data ? Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Analytics & BI</h1>
          </div>
          <p className="text-muted-foreground">Visão estratégica e métricas de desempenho operacional</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border w-fit">
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium bg-background shadow-sm">6 Meses</Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">12 Meses</Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">Todo Período</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-all border-muted/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projetos Ativos</p>
                {isLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (
                  <p className="text-3xl font-bold text-foreground tracking-tight" data-testid="text-kpi-projects">{totalCreated}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> 12%
                  </span>
                  <span className="text-[10px] text-muted-foreground">vs. mês ant.</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                <FolderOpen className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-muted/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Faturamento Est.</p>
                {isLoading ? <Skeleton className="h-9 w-28 mt-1" /> : (
                  <p className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-kpi-revenue">{formatCurrency(totalRevenue)}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> 8.4%
                  </span>
                  <span className="text-[10px] text-muted-foreground">vs. mês ant.</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-sm">
                <DollarSign className="h-6 w-6 text-emerald-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-muted/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projetos Totais</p>
                {isLoading ? <Skeleton className="h-9 w-16 mt-1" /> : (
                  <p className="text-3xl font-bold text-foreground tracking-tight" data-testid="text-kpi-total">{data?.totalProjects ?? 0}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Estável
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors shadow-sm">
                <Activity className="h-6 w-6 text-violet-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-muted/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
                {isLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-kpi-ticket">
                    {totalCreated > 0 ? formatCurrency(totalRevenue / totalCreated) : "—"}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="flex items-center text-xs font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" /> 2.1%
                  </span>
                  <span className="text-[10px] text-muted-foreground">vs. mês ant.</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-sm">
                <TrendingUp className="h-6 w-6 text-amber-600 group-hover:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-muted/40 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Volume de Projetos e Receita
              </CardTitle>
              <CardDescription>Evolução mensal comparativa</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Projetos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Receita</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.months ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: "12px"
                    }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted/40 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" /> Distribuição de Status
            </CardTitle>
            <CardDescription>Composição da carteira atual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : statusEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <PieChart className="h-6 w-6 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {statusEntries.slice(0, 6).map(([key, cnt], i) => {
                  const cfg = configMap[key];
                  const percentage = ((cnt / (data?.totalProjects || 1)) * 100);
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getBadgeClass(cfg?.color ?? "slate").split(" ")[0]}`} />
                          {cfg?.label ?? key}
                        </span>
                        <span className="text-muted-foreground">{cnt} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 bg-primary`} 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: cfg?.color === 'blue' ? '#0ea5e9' : 
                                             cfg?.color === 'green' ? '#10b981' :
                                             cfg?.color === 'amber' ? '#f59e0b' :
                                             cfg?.color === 'red' ? '#ef4444' :
                                             cfg?.color === 'violet' ? '#8b5cf6' : '#94a3b8'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid of status boxes */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          Detalhamento por Etapa <div className="h-px flex-1 bg-muted/60" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : statusEntries.map(([key, cnt], i) => {
            const cfg = configMap[key];
            return (
              <div
                key={key}
                className="flex flex-col p-4 rounded-xl border border-muted/40 bg-card hover:bg-muted/10 transition-colors shadow-sm group"
                data-testid={`analytics-status-${key}`}
              >
                <div className={`h-1.5 w-8 rounded-full mb-3 ${getBadgeClass(cfg?.color ?? "slate").split(" ")[0]}`} 
                  style={{ 
                    backgroundColor: cfg?.color === 'blue' ? '#0ea5e9' : 
                                     cfg?.color === 'green' ? '#10b981' :
                                     cfg?.color === 'amber' ? '#f59e0b' :
                                     cfg?.color === 'red' ? '#ef4444' :
                                     cfg?.color === 'violet' ? '#8b5cf6' : '#94a3b8'
                  }} 
                />
                <span className="text-2xl font-bold tracking-tight mb-0.5 group-hover:text-primary transition-colors">{cnt}</span>
                <span className="text-[11px] font-semibold text-muted-foreground line-clamp-1 uppercase tracking-tight">
                  {cfg?.label ?? key}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 font-medium bg-muted/50 w-fit px-1.5 py-0.5 rounded">
                  {((cnt / (data?.totalProjects || 1)) * 100).toFixed(0)}% do total
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
