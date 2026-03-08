import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Database, Plus, Pencil, Trash2, Zap, Battery, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Panel { id: string; brand: string; model: string; powerW: number; efficiencyPct: string; voltageVoc: string | null; active: boolean; }
interface Inverter { id: string; brand: string; model: string; powerKw: string; phases: number; mpptCount: number; active: boolean; }

const panelSchema = z.object({
  brand: z.string().min(1), model: z.string().min(1),
  powerW: z.coerce.number().min(1), efficiencyPct: z.coerce.number().min(1).max(100),
  voltageVoc: z.coerce.number().optional(),
});
const inverterSchema = z.object({
  brand: z.string().min(1), model: z.string().min(1),
  powerKw: z.coerce.number().min(0.1), phases: z.coerce.number().min(1).max(3),
  mpptCount: z.coerce.number().min(1),
  minMpptVoltage: z.coerce.number().optional(), maxMpptVoltage: z.coerce.number().optional(),
});

function PanelForm({ initial, onSave, onCancel }: { initial?: Partial<Panel>; onSave: (d: any) => void; onCancel: () => void }) {
  const form = useForm({ resolver: zodResolver(panelSchema), defaultValues: { brand: initial?.brand ?? "", model: initial?.model ?? "", powerW: initial?.powerW ?? 540, efficiencyPct: initial?.efficiencyPct ? parseFloat(initial.efficiencyPct) : 20.5, voltageVoc: initial?.voltageVoc ? parseFloat(initial.voltageVoc) : undefined } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="powerW" render={({ field }) => (<FormItem><FormLabel>Potência (Wp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="efficiencyPct" render={({ field }) => (<FormItem><FormLabel>Eficiência (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="voltageVoc" render={({ field }) => (<FormItem><FormLabel>Voc (V)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function InverterForm({ initial, onSave, onCancel }: { initial?: Partial<Inverter>; onSave: (d: any) => void; onCancel: () => void }) {
  const form = useForm({ resolver: zodResolver(inverterSchema), defaultValues: { brand: initial?.brand ?? "", model: initial?.model ?? "", powerKw: initial?.powerKw ? parseFloat(initial.powerKw) : 5, phases: initial?.phases ?? 1, mpptCount: initial?.mpptCount ?? 2 } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="powerKw" render={({ field }) => (<FormItem><FormLabel>Potência (kW)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phases" render={({ field }) => (
            <FormItem><FormLabel>Fases</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="1">Monofásico</SelectItem>
                  <SelectItem value="2">Bifásico</SelectItem>
                  <SelectItem value="3">Trifásico</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="mpptCount" render={({ field }) => (<FormItem><FormLabel>Qtd MPPT</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function EquipmentDb() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [panelDialog, setPanelDialog] = useState<{ open: boolean; item?: Panel }>({ open: false });
  const [inverterDialog, setInverterDialog] = useState<{ open: boolean; item?: Inverter }>({ open: false });

  const { data, isLoading } = useQuery<{ panels: Panel[]; inverters: Inverter[] }>({ queryKey: ["/api/ai/equipment"] });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/ai/equipment"] });

  const savePanel = useMutation({ mutationFn: (d: any) => panelDialog.item ? apiRequest("PATCH", `/api/ai/panels/${panelDialog.item!.id}`, d) : apiRequest("POST", "/api/ai/panels", d), onSuccess: () => { invalidate(); setPanelDialog({ open: false }); toast({ title: "Painel salvo" }); } });
  const delPanel = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ai/panels/${id}`), onSuccess: () => { invalidate(); toast({ title: "Painel removido" }); } });
  const saveInv = useMutation({ mutationFn: (d: any) => inverterDialog.item ? apiRequest("PATCH", `/api/ai/inverters/${inverterDialog.item!.id}`, d) : apiRequest("POST", "/api/ai/inverters", d), onSuccess: () => { invalidate(); setInverterDialog({ open: false }); toast({ title: "Inversor salvo" }); } });
  const delInv = useMutation({ mutationFn: (id: string) => apiRequest("DELETE", `/api/ai/inverters/${id}`), onSuccess: () => { invalidate(); toast({ title: "Inversor removido" }); } });

  const panels = (data?.panels ?? []).filter(p => !search || `${p.brand} ${p.model}`.toLowerCase().includes(search.toLowerCase()));
  const inverters = (data?.inverters ?? []).filter(i => !search || `${i.brand} ${i.model}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Banco de Equipamentos</h1>
            <p className="text-muted-foreground">Módulos fotovoltaicos e inversores homologados</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar equipamento..." 
              className="pl-9 h-10 shadow-sm transition-all focus:ring-primary/20" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              data-testid="input-equipment-search" 
            />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => setPanelDialog({ open: true })} className="shadow-sm hover-elevate" data-testid="button-add-panel">
                <Plus className="w-4 h-4 mr-2" /> Módulo
              </Button>
              <Button variant="outline" onClick={() => setInverterDialog({ open: true })} className="shadow-sm hover-elevate" data-testid="button-add-inverter">
                <Plus className="w-4 h-4 mr-2" /> Inversor
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="panels" className="w-full">
        <div className="border-b mb-6">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger 
              value="panels" 
              data-testid="tab-panels"
              className="px-1 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none transition-all hover:text-primary"
            >
              <Zap className="w-4 h-4 mr-2" />
              Módulos
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 font-mono text-[10px]">{panels.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="inverters" 
              data-testid="tab-inverters"
              className="px-1 py-3 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none transition-all hover:text-primary"
            >
              <Battery className="w-4 h-4 mr-2" />
              Inversores
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 font-mono text-[10px]">{inverters.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="panels" className="mt-0 outline-none">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse border border-border/50" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {panels.map(p => (
                <Card key={p.id} data-testid={`card-panel-${p.id}`} className="group hover:shadow-lg transition-all border-border/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-70" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-foreground truncate">{p.brand}</div>
                        <div className="text-sm text-muted-foreground truncate">{p.model}</div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-2 py-0.5 font-bold">
                        {p.powerW}Wp
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Eficiência</div>
                        <div className="text-sm font-semibold">{p.efficiencyPct}%</div>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Voc (V)</div>
                        <div className="text-sm font-semibold">{p.voltageVoc ?? "-"} V</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Ativo
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover-elevate" onClick={() => setPanelDialog({ open: true, item: p })}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover-elevate" onClick={() => delPanel.mutate(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {panels.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhum módulo encontrado</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inverters" className="mt-0 outline-none">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse border border-border/50" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inverters.map(i => (
                <Card key={i.id} data-testid={`card-inverter-${i.id}`} className="group hover:shadow-lg transition-all border-border/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-70" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-foreground truncate">{i.brand}</div>
                        <div className="text-sm text-muted-foreground truncate">{i.model}</div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-2 py-0.5 font-bold">
                        {i.powerKw}kW
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Fases</div>
                        <div className="text-sm font-semibold">{i.phases === 1 ? "Monofásico" : i.phases === 2 ? "Bifásico" : "Trifásico"}</div>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Qtd MPPT</div>
                        <div className="text-sm font-semibold">{i.mpptCount}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Ativo
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover-elevate" onClick={() => setInverterDialog({ open: true, item: i })}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover-elevate" onClick={() => delInv.mutate(i.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {inverters.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhum inversor encontrado</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={panelDialog.open} onOpenChange={(o) => setPanelDialog({ open: o })}>
        <DialogContent><DialogHeader><DialogTitle>{panelDialog.item ? "Editar" : "Novo"} Módulo</DialogTitle></DialogHeader>
          <PanelForm initial={panelDialog.item} onSave={(d) => savePanel.mutate(d)} onCancel={() => setPanelDialog({ open: false })} />
        </DialogContent>
      </Dialog>

      <Dialog open={inverterDialog.open} onOpenChange={(o) => setInverterDialog({ open: o })}>
        <DialogContent><DialogHeader><DialogTitle>{inverterDialog.item ? "Editar" : "Novo"} Inversor</DialogTitle></DialogHeader>
          <InverterForm initial={inverterDialog.item} onSave={(d) => saveInv.mutate(d)} onCancel={() => setInverterDialog({ open: false })} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
