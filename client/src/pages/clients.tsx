import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus, Search, Pencil, Trash2, Users, Phone, Mail, Building2, User,
  MapPin, Filter, MoreHorizontal, UserPlus, ArrowRight
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Client, InsertClient } from "@shared/schema";
import { formatCpfCnpj, formatPhone, formatCep, lookupCep, validateCpfCnpj, getInitials } from "@/lib/utils";

function ClientDialog({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const { toast } = useToast();
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<InsertClient>({
    defaultValues: client ? {
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      cpfCnpj: client.cpfCnpj || "",
      type: client.type,
      address: client.address || "",
      rua: (client as any).rua || "",
      numero: (client as any).numero || "",
      bairro: (client as any).bairro || "",
      cep: (client as any).cep || "",
      cidade: (client as any).cidade || "",
      estado: (client as any).estado || "",
    } : {
      name: "", email: "", phone: "", cpfCnpj: "", type: "PF", address: "",
      rua: "", numero: "", bairro: "", cep: "", cidade: "", estado: "",
    },
  });

  const clientType = watch("type");

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) { toast({ title: "CNPJ não encontrado", variant: "destructive" }); return; }
      const data = await res.json();
      if (data.razao_social) setValue("name", data.razao_social);
      if (data.logradouro) setValue("rua", data.logradouro);
      if (data.numero) setValue("numero", data.numero);
      if (data.bairro) setValue("bairro", data.bairro);
      if (data.municipio) setValue("cidade", data.municipio);
      if (data.uf) setValue("estado", data.uf);
      if (data.cep) setValue("cep", data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2"));
      if (data.ddd_telefone_1) setValue("phone", formatPhone(data.ddd_telefone_1));
      toast({ title: "CNPJ encontrado!", description: "Dados preenchidos automaticamente." });
    } catch { toast({ title: "Erro ao buscar CNPJ", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const createMut = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Cliente criado com sucesso!" });
      onClose();
      reset();
    },
    onError: () => toast({ title: "Erro ao criar cliente", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<InsertClient>) => apiRequest("PATCH", `/api/clients/${client?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Cliente atualizado!" });
      onClose();
    },
    onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
  });

  const onSubmit = (data: InsertClient) => {
    const cpfCnpjResult = data.cpfCnpj ? validateCpfCnpj(data.cpfCnpj) : true;
    if (cpfCnpjResult !== true) {
      toast({ title: cpfCnpjResult, variant: "destructive" });
      return;
    }
    if (client) updateMut.mutate(data);
    else createMut.mutate(data);
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Nome Completo / Razão Social *</Label>
              <Input id="name" {...register("name", { required: true })} placeholder="Nome do cliente" data-testid="input-client-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger data-testid="select-client-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <div className="flex gap-2">
                <Input id="cpfCnpj" {...register("cpfCnpj")} placeholder={clientType === "PJ" ? "00.000.000/0001-00" : "000.000.000-00"} data-testid="input-client-cpfcnpj"
                  onChange={e => setValue("cpfCnpj", formatCpfCnpj(e.target.value))} />
                {clientType === "PJ" && (
                  <Button type="button" size="sm" variant="outline" disabled={cnpjLoading} onClick={() => lookupCnpj(watch("cpfCnpj") || "")}>
                    {cnpjLoading ? "..." : "Buscar"}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register("email", { required: true })} placeholder="email@exemplo.com" data-testid="input-client-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" data-testid="input-client-phone"
                onChange={e => setValue("phone", formatPhone(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg bg-muted/40 border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>CEP</Label>
                <Input {...register("cep")} placeholder="00000-000" maxLength={9} data-testid="input-client-cep"
                  onChange={async e => {
                    const fmt = formatCep(e.target.value);
                    setValue("cep", fmt);
                    const data = await lookupCep(fmt);
                    if (data) {
                      if (data.logradouro) setValue("rua", data.logradouro);
                      if (data.bairro) setValue("bairro", data.bairro);
                      if (data.localidade) setValue("cidade", data.localidade);
                      if (data.uf) setValue("estado", data.uf);
                    }
                  }} />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Rua / Logradouro</Label>
                <Input {...register("rua")} placeholder="Rua das Flores" data-testid="input-client-rua" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Número</Label>
                <Input {...register("numero")} placeholder="123" data-testid="input-client-numero" />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Bairro</Label>
                <Input {...register("bairro")} placeholder="Centro" data-testid="input-client-bairro" />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register("cidade")} placeholder="São Paulo" data-testid="input-client-cidade" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>UF</Label>
                <Input {...register("estado")} placeholder="SP" maxLength={2} style={{ textTransform: "uppercase" }} data-testid="input-client-estado" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-client">
              {isPending ? "Salvando..." : client ? "Atualizar" : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | undefined>();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Cliente excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir cliente", variant: "destructive" }),
  });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpfCnpj || "").includes(search)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Clientes</h1>
          </div>
          <p className="text-muted-foreground">Gerencie o cadastro completo de seus clientes</p>
        </div>
        <Button onClick={() => { setEditClient(undefined); setDialogOpen(true); }} data-testid="button-new-client" className="hover-elevate">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                data-testid="input-search-clients"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-muted/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border-2 border-dashed border-muted text-center px-4">
          <div className="h-16 w-16 bg-muted/40 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="font-semibold text-lg">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Não encontramos nenhum cliente com os termos pesquisados. Tente outro termo ou adicione um novo cliente.</p>
          <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>Limpar Busca</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Card key={client.id} className="hover-elevate overflow-visible border-muted/40 group transition-all duration-300" data-testid={`card-client-${client.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate leading-none mb-1.5">{client.name}</p>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold h-5">
                        {client.type === "PJ" ? <Building2 className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                        {client.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => { setEditClient(client); setDialogOpen(true); }}
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Excluir cliente ${client.name}?`)) deleteMut.mutate(client.id);
                      }}
                      disabled={deleteMut.isPending}
                      data-testid={`button-delete-client-${client.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.cpfCnpj && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{client.cpfCnpj}</span>
                    </div>
                  )}
                  {(client.rua || client.cidade) && (
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{client.cidade || "—"}, {client.estado || "—"}</span>
                    </div>
                  )}
                </div>

                <Button variant="ghost" className="w-full mt-4 h-8 text-xs justify-between group-hover:bg-primary/5 group-hover:text-primary border border-transparent group-hover:border-primary/20 transition-all">
                  Ver Projetos
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog open={dialogOpen} onClose={() => setDialogOpen(false)} client={editClient} />
    </div>
  );
}
