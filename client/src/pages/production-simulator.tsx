import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Leaf, Sun, Loader2, BarChart2, Zap, TrendingUp } from "lucide-react";

interface MonthlyProd { month: string; productionKwh: number; irradiation: number; }
interface SimResult {
  monthlyProduction: MonthlyProd[];
  totalAnnualKwh: number;
  averageMonthlyKwh: number;
  peakMonthKwh: number;
  lowestMonthKwh: number;
  co2SavedKg: number;
  treesEquivalent: number;
}

const IRRADIATION_PRESETS: Record<string, string> = {
  "Fortaleza (CE)": "5.8", "Natal (RN)": "5.9", "Brasília (DF)": "5.5", "Salvador (BA)": "5.5",
  "Goiânia (GO)": "5.4", "Recife (PE)": "5.6", "Cuiabá (MT)": "5.2",
  "São Paulo (SP)": "4.5", "Rio de Janeiro (RJ)": "4.8", "Belo Horizonte (MG)": "5.0",
  "Curitiba (PR)": "4.2", "Porto Alegre (RS)": "4.0",
};

export default function ProductionSimulator() {
  const [params, setParams] = useState({ kwp: "5", irr: "4.5", eff: "78" });
  const [queryParams, setQueryParams] = useState<typeof params | null>(null);

  const { data, isFetching } = useQuery<SimResult>({
    queryKey: ["/api/ai/simulate-production", queryParams?.kwp, queryParams?.irr, queryParams?.eff],
    queryFn: async () => {
      const p = queryParams!;
      const r = await fetch(`/api/ai/simulate-production?kwp=${p.kwp}&irradiation=${p.irr}&efficiency=${parseFloat(p.eff) / 100}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!queryParams,
  });

  const run = () => setQueryParams({ ...params });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <BarChart2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Simulador de Produção</h1>
            <p className="text-muted-foreground">Estimativa técnica de geração mensal e anual do sistema</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 bg-muted/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            Parâmetros do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Potência (kWp)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.5" 
                  value={params.kwp} 
                  onChange={e => setParams(p => ({ ...p, kwp: e.target.value }))} 
                  data-testid="input-kwp"
                  className="h-11 pl-9 font-mono"
                />
                <Zap className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Irradiação (kWh/m²/dia)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.1" 
                  value={params.irr} 
                  onChange={e => setParams(p => ({ ...p, irr: e.target.value }))} 
                  data-testid="input-irradiation"
                  className="h-11 pl-9 font-mono"
                />
                <Sun className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Localização rápida</Label>
              <Select onValueChange={v => setParams(p => ({ ...p, irr: v }))}>
                <SelectTrigger className="h-11 bg-background shadow-sm transition-all focus:ring-primary/20">
                  <SelectValue placeholder="Selecionar capital..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IRRADIATION_PRESETS).map(([k, v]) => (
                    <SelectItem key={k} value={v} className="text-sm">{k} — {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={run} 
                className="w-full h-11 text-base font-semibold shadow-sm hover-elevate active-elevate-2 transition-all" 
                disabled={isFetching} 
                data-testid="button-simulate"
              >
                {isFetching ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Simulando...</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" />Simular Geração</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="stat-annual" className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sun className="w-12 h-12 text-green-500" />
              </div>
              <CardContent className="p-6">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Anual</div>
                <div className="text-3xl font-bold text-green-600 tracking-tight">{data.totalAnnualKwh.toLocaleString("pt-BR")} <span className="text-sm font-medium text-muted-foreground">kWh</span></div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Zap className="w-12 h-12 text-blue-500" />
              </div>
              <CardContent className="p-6">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Média Mensal</div>
                <div className="text-3xl font-bold text-blue-600 tracking-tight">{data.averageMonthlyKwh.toLocaleString("pt-BR")} <span className="text-sm font-medium text-muted-foreground">kWh</span></div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Leaf className="w-12 h-12 text-emerald-500" />
              </div>
              <CardContent className="p-6">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CO₂ Evitado</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-emerald-600 tracking-tight">{data.co2SavedKg.toLocaleString("pt-BR")}</div>
                  <span className="text-sm font-medium text-muted-foreground font-mono">kg/ano</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <div className="text-2xl font-bold text-green-600">🌳</div>
              </div>
              <CardContent className="p-6">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sustentabilidade</div>
                <div className="text-3xl font-bold text-emerald-600 tracking-tight">{data.treesEquivalent} <span className="text-sm font-medium text-muted-foreground uppercase">Árvores</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-card to-background">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Performance Mensal Estimada
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyProduction} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 11, fontWeight: 600 }} 
                        tickFormatter={v => v.slice(0, 3).toUpperCase()}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fontWeight: 600 }} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}`}
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: 'hsl(var(--card))',
                          fontSize: '12px'
                        }}
                        formatter={(v: number) => [`${v.toLocaleString("pt-BR")} kWh`, "Geração"]} 
                      />
                      <Bar 
                        dataKey="productionKwh" 
                        fill="hsl(var(--primary))" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-muted/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Detalhamento Técnico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {data.monthlyProduction.map((m, idx) => (
                    <div 
                      key={m.month} 
                      className={`flex items-center justify-between p-3 rounded-lg border border-border/30 transition-all hover:bg-background ${idx % 2 === 0 ? 'bg-background/40' : 'bg-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                          {m.month.slice(0, 3)}
                        </div>
                        <div className="text-sm font-semibold">{m.productionKwh.toLocaleString("pt-BR")} <span className="text-[10px] font-normal text-muted-foreground uppercase">kWh</span></div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/5 border border-orange-500/10">
                        <Sun className="w-3 h-3 text-orange-500" />
                        <span className="text-[11px] font-mono font-bold text-orange-600">{m.irradiation}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!data && !isFetching && (
        <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/5">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
            <BarChart2 className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Pronto para simular?</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Insira a potência do sistema e a irradiação local para obter uma estimativa detalhada da geração de energia.
          </p>
          <Button onClick={run} variant="outline" className="px-8 hover-elevate active-elevate-2">
            Iniciar Simulação Técnica
          </Button>
        </div>
      )}
    </div>
  );
}
