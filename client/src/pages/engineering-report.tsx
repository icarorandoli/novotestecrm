import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Share2, Loader2, Download, Cpu, Zap, Sun, Battery } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Project { id: string; ticketNumber: string | null; title: string; status: string; }
interface MemorialResult { text: string; html: string; title: string; }
interface UnifilarResult { svg: string; description: string; }
interface SmartResult {
  dimensioning: {
    kwp: number; panelsNeeded: number; monthlyGenerationKwh: number;
    annualGenerationKwh: number; irradiationUsed: number; phase: string; coveragePercent: number;
    suggestedPanel: { brand: string; model: string; powerW: number } | null;
    suggestedInverter: { brand: string; model: string; powerKw: string } | null;
  };
  memorial: MemorialResult;
  unifilar: UnifilarResult;
}

export default function EngineeringReport() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [report, setReport] = useState<SmartResult | null>(null);

  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const generate = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/smart-create", { projectId: selectedProject }).then(r => r.json()),
    onSuccess: (d) => { setReport(d); toast({ title: "Relatório gerado com sucesso!" }); },
    onError: () => toast({ title: "Erro ao gerar relatório", variant: "destructive" }),
  });

  const downloadMemorial = () => {
    if (!report) return;
    const blob = new Blob([report.memorial.text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `memorial-${selectedProject}.txt`;
    a.click();
  };

  const downloadUnifilar = () => {
    if (!report) return;
    const blob = new Blob([report.unifilar.svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unifilar-${selectedProject}.svg`;
    a.click();
  };

  const activeProjects = projects?.filter(p => !["arquivado", "cancelado"].includes(p.status)) ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatório de Engenharia</h1>
            <p className="text-muted-foreground">Documentação técnica, memorial descritivo e diagrama unifilar</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 bg-muted/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Gerar Documentação
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={setSelectedProject} value={selectedProject}>
            <SelectTrigger className="flex-1 h-11 bg-background shadow-sm transition-all focus:ring-primary/20" data-testid="select-project">
              <SelectValue placeholder={loadingProjects ? "Carregando projetos..." : "Selecione um projeto para processar..."} />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-sm">
                  {p.ticketNumber ? <Badge variant="outline" className="mr-2 font-mono text-[10px] h-4 px-1">{p.ticketNumber}</Badge> : null}
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => generate.mutate()} 
            disabled={!selectedProject || generate.isPending} 
            className="h-11 px-8 text-base font-semibold shadow-sm hover-elevate active-elevate-2 transition-all shrink-0" 
            data-testid="button-generate-report"
          >
            {generate.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando IA...</>
            ) : (
              <><Cpu className="w-4 h-4 mr-2" />Gerar Relatório</>
            )}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Tabs defaultValue="summary" className="w-full">
          <div className="border-b mb-6">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger 
                value="summary"
                className="px-1 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none transition-all hover:text-primary"
              >
                Resumo Técnico
              </TabsTrigger>
              <TabsTrigger 
                value="memorial" 
                data-testid="tab-memorial"
                className="px-1 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none transition-all hover:text-primary"
              >
                Memorial Descritivo
              </TabsTrigger>
              <TabsTrigger 
                value="unifilar" 
                data-testid="tab-unifilar"
                className="px-1 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none transition-all hover:text-primary"
              >
                Diagrama Unifilar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="summary" className="mt-0 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Potência Nominal</div>
                  <div className="text-3xl font-bold text-orange-600 tracking-tight" data-testid="report-kwp">
                    {report.dimensioning.kwp} <span className="text-sm font-medium text-muted-foreground">kWp</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total de Módulos</div>
                  <div className="text-3xl font-bold text-blue-600 tracking-tight">
                    {report.dimensioning.panelsNeeded} <span className="text-sm font-medium text-muted-foreground">unid.</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Geração Mensal</div>
                  <div className="text-3xl font-bold text-green-600 tracking-tight">
                    {report.dimensioning.monthlyGenerationKwh.toLocaleString("pt-BR")} <span className="text-sm font-medium text-muted-foreground">kWh</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm hover-elevate transition-all overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Taxa de Cobertura</div>
                  <div className="text-3xl font-bold text-purple-600 tracking-tight">
                    {report.dimensioning.coveragePercent}<span className="text-sm font-medium text-muted-foreground">%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {(report.dimensioning.suggestedPanel || report.dimensioning.suggestedInverter) && (
              <Card className="border-border/50 shadow-md bg-gradient-to-br from-card to-background overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Configuração de Equipamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    {report.dimensioning.suggestedPanel && (
                      <div className="p-6 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                          <Sun className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Módulo Fotovoltaico</div>
                          <div className="text-lg font-bold text-foreground truncate">{report.dimensioning.suggestedPanel.brand}</div>
                          <div className="text-sm text-muted-foreground truncate">{report.dimensioning.suggestedPanel.model} — {report.dimensioning.suggestedPanel.powerW}Wp</div>
                        </div>
                      </div>
                    )}
                    {report.dimensioning.suggestedInverter && (
                      <div className="p-6 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Battery className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Inversor de Frequência</div>
                          <div className="text-lg font-bold text-foreground truncate">{report.dimensioning.suggestedInverter.brand}</div>
                          <div className="text-sm text-muted-foreground truncate">{report.dimensioning.suggestedInverter.model} — {report.dimensioning.suggestedInverter.powerKw}kW</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/30 px-6 py-4 border-t flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Padrão de Entrada:</span>
                      <Badge variant="outline" className="font-mono font-bold bg-background px-2">{report.dimensioning.phase}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Irradiação:</span>
                      <span className="font-bold text-foreground font-mono">{report.dimensioning.irradiationUsed} <span className="text-[10px] uppercase font-normal text-muted-foreground">kWh/m²/dia</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="memorial" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Memorial Descritivo
                </CardTitle>
                <Button size="sm" variant="outline" onClick={downloadMemorial} className="h-8 shadow-sm hover-elevate transition-all">
                  <Download className="w-3.5 h-3.5 mr-2" />Baixar TXT
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-background dark:bg-zinc-950 p-8">
                  <pre className="whitespace-pre-wrap text-xs font-mono text-foreground leading-relaxed overflow-auto max-h-[600px] custom-scrollbar selection:bg-primary/20" data-testid="memorial-text">
                    {report.memorial.text}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unifilar" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Diagrama Unifilar
                </CardTitle>
                <Button size="sm" variant="outline" onClick={downloadUnifilar} className="h-8 shadow-sm hover-elevate transition-all">
                  <Download className="w-3.5 h-3.5 mr-2" />Baixar SVG
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-muted/30 border rounded-xl p-4 text-xs leading-relaxed text-muted-foreground italic">
                  {report.unifilar.description}
                </div>
                <div
                  data-testid="unifilar-diagram"
                  className="border rounded-xl p-8 bg-white shadow-inner overflow-x-auto flex justify-center items-center min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: report.unifilar.svg }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!report && !generate.isPending && (
        <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/5">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
            <Cpu className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Engenharia Digital Automática</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Selecione um projeto acima para processar os dados e gerar toda a documentação técnica automaticamente via IA.
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-primary" /> Memorial
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Share2 className="w-3.5 h-3.5 text-primary" /> Unifilar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
