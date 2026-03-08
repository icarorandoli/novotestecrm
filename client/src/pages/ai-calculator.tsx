import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Zap, Sun, Battery, TrendingUp, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  monthlyConsumptionKwh: z.coerce.number().min(1, "Obrigatório").max(100000),
  city: z.string().min(2, "Obrigatório"),
  state: z.string().min(2, "Obrigatório"),
});
type FormData = z.infer<typeof schema>;

interface SizingResult {
  kwp: number;
  panelsNeeded: number;
  monthlyGenerationKwh: number;
  annualGenerationKwh: number;
  irradiationUsed: number;
  phase: string;
  coveragePercent: number;
  suggestedPanel: { brand: string; model: string; powerW: number } | null;
  suggestedInverter: { brand: string; model: string; powerKw: string } | null;
}

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function AiCalculator() {
  const [result, setResult] = useState<SizingResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { monthlyConsumptionKwh: 400, city: "", state: "SP" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/ai/size-system", data).then(r => r.json()),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Calculadora Solar</h1>
            <p className="text-muted-foreground">Dimensione o sistema fotovoltaico ideal pelo consumo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Dados de Consumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
                <FormField control={form.control} name="monthlyConsumptionKwh" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Consumo Médio Mensal (kWh)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" placeholder="400" {...field} data-testid="input-consumption" className="pl-9 h-11" />
                        <Sun className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} data-testid="input-city" className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state" className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover-elevate active-elevate-2" disabled={mutation.isPending} data-testid="button-calculate">
                  {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculando...</> : <><Calculator className="w-4 h-4 mr-2" />Calcular Sistema</>}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-md overflow-visible relative">
              <div className="absolute -top-3 -right-3">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold shadow-lg">RECOMENDADO</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Dimensionamento Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover-elevate transition-all" data-testid="result-kwp">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Potência Total</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {result.kwp}<span className="text-sm font-medium ml-1 text-muted-foreground">kWp</span>
                    </div>
                  </div>
                  <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover-elevate transition-all" data-testid="result-panels">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulos</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {result.panelsNeeded}<span className="text-sm font-medium ml-1 text-muted-foreground">unid.</span>
                    </div>
                  </div>
                  <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover-elevate transition-all" data-testid="result-monthly-gen">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Geração Mensal</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {result.monthlyGenerationKwh.toLocaleString("pt-BR")}<span className="text-sm font-medium ml-1 text-muted-foreground">kWh</span>
                    </div>
                  </div>
                  <div className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm hover-elevate transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Economia</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground tracking-tight">
                      {result.coveragePercent}<span className="text-sm font-medium ml-1 text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Especificações do Local</h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Irradiação</span>
                        <span className="font-semibold text-foreground">{result.irradiationUsed} <span className="text-[10px] text-muted-foreground">kWh/m²/dia</span></span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Padrão</span>
                        <Badge variant="secondary" className="text-[10px] h-5 uppercase font-bold">{result.phase}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Geração Anual</span>
                        <span className="font-semibold text-foreground">{result.annualGenerationKwh.toLocaleString("pt-BR")} <span className="text-[10px] text-muted-foreground">kWh</span></span>
                      </div>
                    </div>
                  </div>

                  {(result.suggestedPanel || result.suggestedInverter) && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Equipamentos Sugeridos</h4>
                      <div className="space-y-2">
                        {result.suggestedPanel && (
                          <div className="flex items-center gap-3 bg-background/40 p-2.5 rounded-lg border border-border/30" data-testid="result-panel">
                            <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
                              <Sun className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">{result.suggestedPanel.brand}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{result.suggestedPanel.model} • {result.suggestedPanel.powerW}Wp</div>
                            </div>
                          </div>
                        )}
                        {result.suggestedInverter && (
                          <div className="flex items-center gap-3 bg-background/40 p-2.5 rounded-lg border border-border/30" data-testid="result-inverter">
                            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Battery className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">{result.suggestedInverter.brand}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{result.suggestedInverter.model} • {result.suggestedInverter.powerKw}kW</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted rounded-2xl bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Sun className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Aguardando Dimensionamento</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">Preencha os dados de consumo ao lado para gerar a configuração técnica do sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
