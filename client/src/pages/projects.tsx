import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Pencil, Trash2, FolderOpen, Zap, Eye,
  MapPin, Cpu, Sun, User, FileText, Activity, Building,
  ExternalLink, Upload, Hash, CheckCircle2, Archive, RotateCcw, CreditCard, RefreshCw,
  LayoutGrid, List
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { Project, Client, Document, Timeline, StatusConfig } from "@shared/schema";
import ChatPanel from "@/components/chat-panel";
import { useProjectWebSocket } from "@/hooks/use-websocket";
import { useUpload } from "@/hooks/use-upload";
import { getBadgeClass } from "@/lib/status-colors";

const DOC_TYPE_LABELS: Record<string, string> = {
  rg_cnh: "RG / CNH", cpf_cnpj_doc: "CPF / CNPJ", conta_energia: "Conta de Energia",
  procuracao: "Procuração", foto_local: "Foto do Local",
  diagrama_unifilar: "Diagrama Unifilar", memorial_descritivo: "Memorial Descritivo",
  art: "ART", contrato: "Contrato", projeto_aprovado: "Projeto Elétrico",
  parecer_concessionaria: "Parecer da Concessionária", comprovante_pagamento: "Comprovante de Pagamento", outro: "Outro",
};

type ProjectWithClient = Project & {
  client: Client | null;
  integrador?: { name: string; email: string | null; cpfCnpj: string | null } | null;
};

function InfoRow({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-sm">
      <span className="text-xs font-semibold text-muted-foreground min-w-[140px] flex-shrink-0 uppercase tracking-wider">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline decoration-primary/30 underline-offset-2">
          Abrir mapa <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-xs font-medium flex-1 text-foreground/90">{value}</span>
      )}
    </div>
  );
}

function ProjectDetailSheet({
  project,
  open,
  onClose,
}: {
  project: ProjectWithClient | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const canDeleteDocs = ["admin", "engenharia"].includes(user?.role || "");
  const canEditValor = ["admin", "financeiro"].includes(user?.role || "");
  const [timelineNote, setTimelineNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newProtocolo, setNewProtocolo] = useState("");
  const [newValor, setNewValor] = useState("");
  const [assignEngineerId, setAssignEngineerId] = useState<string>("");
  const [assignInstallerId, setAssignInstallerId] = useState<string>("");
  const [assignManagerId, setAssignManagerId] = useState<string>("");

  useProjectWebSocket(user?.id ?? null, user?.role ?? null, project?.id ?? "");

  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const { data: internalUsers = [] } = useQuery<{ id: string; name: string; role: string }[]>({
    queryKey: ["/api/users"],
    select: (users: any[]) => users.filter((u: any) => ["admin", "engenharia", "financeiro", "tecnico"].includes(u.role)),
  });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));
  const getStatusLabel = (key: string) => configMap[key]?.label ?? key;
  const getStatusBadge = (key: string) => getBadgeClass(configMap[key]?.color ?? "slate");

  const { data: docs = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ["/api/projects", project?.id, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project?.id}/documents`, { credentials: "include" });
      return res.json();
    },
    enabled: !!project?.id,
  });

  const { data: timeline = [], isLoading: tlLoading } = useQuery<Timeline[]>({
    queryKey: ["/api/projects", project?.id, "timeline"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project?.id}/timeline`, { credentials: "include" });
      return res.json();
    },
    enabled: !!project?.id,
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/projects/${project?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projeto atualizado!" });
      setNewStatus("");
      setNewValor("");
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const generatePaymentMut = useMutation({
    mutationFn: (projectId: string) => apiRequest("POST", `/api/projects/${projectId}/generate-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      toast({ title: "Link de pagamento gerado!" });
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao gerar pagamento", variant: "destructive" }),
  });

  const verifyPaymentMut = useMutation({
    mutationFn: (projectId: string) => apiRequest("POST", `/api/projects/${projectId}/verify-payment`),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", "archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      const payments = data.payments || [];
      const approved = payments.find((p: any) => p.status === "approved");
      if (approved) {
        toast({ title: `Pagamento aprovado! R$ ${approved.amount?.toFixed(2).replace(".", ",")} via ${approved.method}` });
      } else if (payments.length > 0) {
        const statuses = payments.map((p: any) => `#${p.id}: ${p.status}`).join(", ");
        toast({ title: `Pagamentos encontrados: ${statuses}`, description: "Nenhum aprovado ainda." });
      } else {
        toast({ title: "Nenhum pagamento encontrado no Mercado Pago", variant: "destructive" });
      }
    },
    onError: (err: any) => toast({ title: err?.message || "Erro ao verificar pagamento", variant: "destructive" }),
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => apiRequest("DELETE", `/api/projects/${project?.id}/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "documents"] });
      toast({ title: "Documento removido!" });
    },
    onError: () => toast({ title: "Erro ao remover documento", variant: "destructive" }),
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const uploadingDocRef = useRef<string | null>(null);

  const addDocMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${project?.id}/documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "documents"] });
      toast({ title: "Documento enviado com sucesso!" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
    onError: () => {
      toast({ title: "Erro ao salvar documento", variant: "destructive" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
  });

  const { uploadFile } = useUpload({
    onSuccess: (res) => {
      addDocMut.mutate({
        name: res.metadata.name,
        fileUrl: res.objectPath,
        docType: uploadingDocRef.current,
        fileType: res.metadata.contentType,
      });
    },
    onError: () => {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
      uploadingDocRef.current = null;
      setUploadingDoc(null);
    },
  });

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadingDocRef.current = docType;
    setUploadingDoc(docType);
    await uploadFile(file);
    if (e.target) e.target.value = "";
  };

  const addTimelineMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/projects/${project?.id}/timeline`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "timeline"] });
      toast({ title: "Nota adicionada!" });
      setTimelineNote("");
    },
    onError: () => toast({ title: "Erro ao adicionar nota", variant: "destructive" }),
  });

  if (!project) return null;

  const handleUpdateStatus = () => {
    const payload: Record<string, any> = {};
    if (newStatus) payload.status = newStatus;
    if (newProtocolo) payload.numeroProtocolo = newProtocolo;
    if (newValor) payload.valor = newValor;
    if (assignEngineerId) payload.assignedEngineerId = assignEngineerId === "__none__" ? null : assignEngineerId;
    if (assignInstallerId) payload.assignedInstallerId = assignInstallerId === "__none__" ? null : assignInstallerId;
    if (assignManagerId) payload.assignedManagerId = assignManagerId === "__none__" ? null : assignManagerId;
    if (Object.keys(payload).length === 0) return;
    updateMut.mutate(payload);
  };

  const handleAddNote = () => {
    if (!timelineNote.trim()) return;
    addTimelineMut.mutate({ event: "Nota da Randoli", details: timelineNote });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 border-l border-border/50 shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              {project.ticketNumber && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  <Hash className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-tighter">
                    {project.ticketNumber}
                  </span>
                </div>
              )}
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{project.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{(project as any).integrador?.name || project.client?.name || "—"}</span>
                </div>
                {project.nomeCliente && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{project.nomeCliente}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <Badge className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border-0 ${getStatusBadge(project.status)}`}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-8 pb-12">
          {/* Admin Controls */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Gestão do Projeto</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm overflow-visible">
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Atual</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger data-testid="select-admin-status" className="bg-background/50 border-border/40 hover:bg-background transition-colors h-10">
                        <SelectValue placeholder={getStatusLabel(project.status)} />
                      </SelectTrigger>
                      <SelectContent>
                        {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                          <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Protocolo Concessionária</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        value={newProtocolo}
                        onChange={e => setNewProtocolo(e.target.value)}
                        placeholder={project.numeroProtocolo || "Informe o protocolo"}
                        data-testid="input-admin-protocolo"
                        className="bg-background/50 border-border/40 hover:bg-background transition-colors pl-9 h-10"
                      />
                    </div>
                  </div>
                </div>

                {canEditValor && (
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valor do Projeto</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/50">R$</span>
                          <Input
                            value={newValor}
                            onChange={e => setNewValor(e.target.value)}
                            placeholder={project.valor || "0,00"}
                            data-testid="input-admin-valor"
                            className="bg-background/50 border-border/40 hover:bg-background transition-colors pl-9 font-mono h-10"
                          />
                        </div>
                        {project.valor && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 ml-1">
                            <CreditCard className="h-3 w-3" /> Valor atual: <span className="font-bold text-foreground">R$ {project.valor}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {project.paymentStatus && (
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-0 shadow-sm ${
                              project.paymentStatus === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                              project.paymentStatus === "pending" ? "bg-amber-500/10 text-amber-600" :
                              "bg-rose-500/10 text-rose-600"
                            }`}>
                              {project.paymentStatus === "approved" ? "✓ Pago" :
                               project.paymentStatus === "pending" ? "⏳ Pendente" :
                               project.paymentStatus}
                            </Badge>
                            {project.paymentLink && (
                              <a href={project.paymentLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10" data-testid="link-admin-payment">
                                <ExternalLink className="h-3 w-3" /> MP
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {project.status === "aprovado_pagamento_pendente" && !project.paymentId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] font-bold uppercase tracking-wider h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 no-default-hover-elevate"
                              disabled={generatePaymentMut.isPending}
                              onClick={() => generatePaymentMut.mutate(project.id)}
                              data-testid="button-generate-payment"
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-2" />
                              {generatePaymentMut.isPending ? "Gerando..." : "Gerar Pagamento"}
                            </Button>
                          )}
                          {project.paymentId && project.paymentStatus !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] font-bold uppercase tracking-wider h-10 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 no-default-hover-elevate"
                              disabled={verifyPaymentMut.isPending}
                              onClick={() => verifyPaymentMut.mutate(project.id)}
                              data-testid="button-verify-payment"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${verifyPaymentMut.isPending ? "animate-spin" : ""}`} />
                              {verifyPaymentMut.isPending ? "Sincronizando..." : "Verificar MP"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assignment */}
                {internalUsers.length > 0 && (
                  <div className="pt-4 border-t border-border/40">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">Atribuição de Responsáveis</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Engenharia</Label>
                        <Select value={assignEngineerId} onValueChange={setAssignEngineerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-engineer">
                            <SelectValue placeholder={(project as any).assignedEngineerId ? internalUsers.find(u => u.id === (project as any).assignedEngineerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Instalação</Label>
                        <Select value={assignInstallerId} onValueChange={setAssignInstallerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-installer">
                            <SelectValue placeholder={(project as any).assignedInstallerId ? internalUsers.find(u => u.id === (project as any).assignedInstallerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground font-medium">Gestão</Label>
                        <Select value={assignManagerId} onValueChange={setAssignManagerId}>
                          <SelectTrigger className="h-9 text-xs bg-background/50 border-border/40" data-testid="select-assign-manager">
                            <SelectValue placeholder={(project as any).assignedManagerId ? internalUsers.find(u => u.id === (project as any).assignedManagerId)?.name ?? "Atribuído" : "Nenhum"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                            {internalUsers.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button
                    size="default"
                    className="w-full sm:w-auto px-8 font-bold uppercase tracking-wider text-xs shadow-md"
                    disabled={updateMut.isPending}
                    onClick={handleUpdateStatus}
                    data-testid="button-admin-update-project"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Admin — Notes */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notas Internas</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <Textarea
                  value={timelineNote}
                  onChange={e => setTimelineNote(e.target.value)}
                  placeholder="Descreva uma atualização importante ou observação técnica..."
                  className="bg-background/50 border-border/40 hover:bg-background transition-colors min-h-[100px] text-sm resize-none"
                  data-testid="textarea-admin-note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-bold uppercase tracking-wider text-[10px] h-9 px-4 border-border/60"
                    onClick={handleAddNote}
                    disabled={addTimelineMut.isPending || !timelineNote.trim()}
                    data-testid="button-admin-add-note"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {addTimelineMut.isPending ? "Adicionando..." : "Adicionar Nota"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Admin — Enviar Documentos (Projeto + ART) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Documentação Técnica</h3>
            </div>
            <Card className="border-border/50 bg-muted/30 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Projeto Técnico */}
                  <label className="cursor-pointer group" data-testid="upload-admin-projeto">
                    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      uploadingDoc === "projeto_aprovado"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 group-hover:border-primary/40 group-hover:bg-background group-hover:shadow-sm"
                    }`}>
                      <div className={`p-2 rounded-lg ${uploadingDoc === "projeto_aprovado" ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10 transition-colors"}`}>
                        <FileText className={`h-5 w-5 ${uploadingDoc === "projeto_aprovado" ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">Projeto Elétrico</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {uploadingDoc === "projeto_aprovado" ? "Enviando arquivo..." : "Clique para selecionar"}
                        </p>
                      </div>
                      {uploadingDoc === "projeto_aprovado" && <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      disabled={!!uploadingDoc}
                      onChange={e => handleAdminUpload(e, "projeto_aprovado")}
                    />
                  </label>

                  {/* ART */}
                  <label className="cursor-pointer group" data-testid="upload-admin-art">
                    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
                      uploadingDoc === "art"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 group-hover:border-primary/40 group-hover:bg-background group-hover:shadow-sm"
                    }`}>
                      <div className={`p-2 rounded-lg ${uploadingDoc === "art" ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10 transition-colors"}`}>
                        <FileText className={`h-5 w-5 ${uploadingDoc === "art" ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">ART</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                          {uploadingDoc === "art" ? "Enviando arquivo..." : "Clique para selecionar"}
                        </p>
                      </div>
                      {uploadingDoc === "art" && <RefreshCw className="h-4 w-4 text-primary animate-spin flex-shrink-0" />}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      disabled={!!uploadingDoc}
                      onChange={e => handleAdminUpload(e, "art")}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          </section>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-11 bg-muted/50 p-1 border border-border/40 rounded-xl mb-6">
              <TabsTrigger value="detalhes" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Detalhes</TabsTrigger>
              <TabsTrigger value="equipamento" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Equipamentos</TabsTrigger>
              <TabsTrigger value="documentos" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Arquivos</TabsTrigger>
              <TabsTrigger value="timeline" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-8 mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instalação</h3>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-1">
                    <InfoRow label="Concessionária" value={project.concessionaria} />
                    <InfoRow label="Nº Instalação" value={project.numeroInstalacao} />
                    <InfoRow label="Tipo Conexão" value={project.tipoConexao ? project.tipoConexao.charAt(0).toUpperCase() + project.tipoConexao.slice(1) : null} />
                    <InfoRow label="Disjuntor" value={project.amperagemDisjuntor} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Localização</h3>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-1">
                    <InfoRow label="Endereço" value={`${project.rua || ""}, ${project.numero || ""} - ${project.bairro || ""}`} />
                    <InfoRow label="Cidade/UF" value={`${project.cidade || ""} / ${project.estado || ""}`} />
                    <InfoRow label="CEP" value={project.cep} />
                    <InfoRow label="Mapa" value={project.localizacao} link />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Beneficiário</h3>
                </div>
                <div className="bg-muted/20 rounded-xl p-4 border border-border/30 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <InfoRow label="Nome Completo" value={project.nomeCliente} />
                  <InfoRow label="CPF/CNPJ" value={project.cpfCnpjCliente} />
                  <InfoRow label="Telefone" value={project.telefoneCliente} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipamento" className="mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/40 shadow-sm bg-muted/10">
                  <CardHeader className="pb-3 border-b border-border/30 bg-muted/20 rounded-t-xl">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-primary" /> Sistema de Inversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1">
                    <InfoRow label="Marca" value={project.marcaInversor} />
                    <InfoRow label="Modelo" value={project.modeloInversor} />
                    <InfoRow label="Potência" value={project.potenciaInversor} />
                    <InfoRow label="Quantidade" value={project.quantidadeInversor} />
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-sm bg-muted/10">
                  <CardHeader className="pb-3 border-b border-border/30 bg-muted/20 rounded-t-xl">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-primary" /> Módulos Fotovoltaicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1">
                    <InfoRow label="Marca" value={project.marcaPainel} />
                    <InfoRow label="Modelo" value={project.modeloPainel} />
                    <InfoRow label="Potência Unit." value={project.potenciaPainel} />
                    <InfoRow label="Qtd. Painéis" value={project.quantidadePaineis} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="mt-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl bg-muted" />
                  ))
                ) : docs.length > 0 ? (
                  docs.map(doc => (
                    <div key={doc.id} className="group relative flex items-center gap-3 p-3 bg-muted/30 border border-border/40 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/30 group-hover:border-primary/30 transition-colors shadow-sm">
                        <FileText className="h-5 w-5 text-primary/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate uppercase tracking-tight">{DOC_TYPE_LABELS[doc.docType] || "Documento"}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        {canDeleteDocs && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteDocMut.mutate(doc.id)}
                            disabled={deleteDocMut.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/60">
                    <FolderOpen className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-widest">Nenhum documento arquivado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 focus-visible:ring-0">
              <div className="space-y-6 pl-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                {tlLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted ml-6" />
                  ))
                ) : timeline.length > 0 ? (
                  timeline.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).map((item, i) => (
                    <div key={item.id} className="relative pl-8">
                      <div className={`absolute left-[-13px] top-1.5 h-6 w-6 rounded-full border-4 border-background shadow-sm flex items-center justify-center ${
                        item.createdByRole === "integrador" ? "bg-primary" : "bg-emerald-500"
                      }`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                      <div className="bg-muted/30 border border-border/30 rounded-xl p-4 hover:bg-muted/50 transition-colors shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                            {item.event}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(item.createdAt!).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/90 leading-relaxed italic">{item.details}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0 border-0 bg-background/60 shadow-none">
                            {item.createdByRole}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/60 ml-6">
                    <Activity className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-widest">Início da jornada do projeto</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Chat Panel */}
          <section className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Comunicação Direta</h3>
            </div>
            <div className="rounded-2xl border border-border/40 shadow-xl overflow-hidden bg-background">
              <ChatPanel projectId={project.id} currentUserId={user?.id || ""} currentUserRole={user?.role || "integrador"} />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tab, setTab] = useState("ativos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({ queryKey: ["/api/projects"] });
  const { data: archived = [], isLoading: archivedLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects", "archived"],
    queryFn: async () => {
      const res = await fetch("/api/projects?archived=true", { credentials: "include" });
      return res.json();
    },
  });
  const { data: statusConfigs = [] } = useQuery<StatusConfig[]>({ queryKey: ["/api/status-configs"] });
  const configMap = Object.fromEntries(statusConfigs.map(c => [c.key, c]));

  const getStatusLabel = (key: string) => configMap[key]?.label ?? key;
  const getStatusBadge = (key: string) => getBadgeClass(configMap[key]?.color ?? "slate");

  const [, navigate] = useLocation();

  const allProjects = [...projects, ...archived];
  const detailProject = detailProjectId ? allProjects.find(p => p.id === detailProjectId) || null : null;

  // Auto-open project from ?open= query param (e.g. clicked from a notification)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (openId && allProjects.length > 0) {
      setDetailProjectId(openId);
      navigate("/projetos", { replace: true });
    }
  }, [allProjects.length]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Projeto excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir projeto", variant: "destructive" }),
  });

  const unarchiveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/projects/${id}`, { archived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Projeto restaurado!" });
    },
    onError: () => toast({ title: "Erro ao restaurar projeto", variant: "destructive" }),
  });

  const currentList = tab === "arquivados" ? archived : projects;
  const loading = tab === "arquivados" ? archivedLoading : isLoading;

  const filtered = currentList.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.nomeCliente?.toLowerCase().includes(search.toLowerCase()) ||
      p.concessionaria?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Gestão de Operações</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground" data-testid="text-page-title">Projetos</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""} em andamento
            {archived.length > 0 && (
              <>
                <span className="mx-2 text-border">|</span>
                <span className="text-muted-foreground/60">{archived.length} arquivado{archived.length !== 1 ? "s" : ""}</span>
              </>
            )}
          </p>
        </div>
        
        <Tabs value={tab} onValueChange={v => { setTab(v); setStatusFilter("todos"); setSearch(""); }} className="bg-muted/30 p-1 rounded-xl border border-border/40 w-full md:w-auto">
          <TabsList className="bg-transparent h-10 gap-1">
            <TabsTrigger value="ativos" data-testid="tab-ativos" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FolderOpen className="h-3.5 w-3.5 mr-2" /> Ativos
            </TabsTrigger>
            <TabsTrigger value="arquivados" data-testid="tab-arquivados" className="rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Archive className="h-3.5 w-3.5 mr-2" /> Arquivados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="border-border/40 shadow-sm bg-muted/10 overflow-visible">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Pesquisar por cliente, integrador, ticket..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/40 focus:border-primary/50 transition-all rounded-xl shadow-inner text-sm"
              data-testid="input-search-projects"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl px-4 text-xs font-semibold" data-testid="select-filter-status">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todos" className="text-xs font-medium">Todos os Status</SelectItem>
                  {statusConfigs.sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                    <SelectItem key={c.key} value={c.key} className="text-xs font-medium">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex bg-background border border-border/40 rounded-xl p-1 gap-1 h-11">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                data-testid="button-view-grid"
                title="Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                data-testid="button-view-list"
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-border/40 overflow-hidden">
              <div className="h-2 bg-muted animate-pulse" />
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <div className="pt-4 flex justify-between">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/40">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {tab === "arquivados" ? "Nenhum projeto arquivado" : "O horizonte está limpo"}
          </h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            {tab === "arquivados" ? "Projetos concluídos ou cancelados serão listados aqui." : "Não encontramos nenhum projeto com os critérios atuais. Tente redefinir seus filtros."}
          </p>
          {search && (
            <Button variant="ghost" onClick={() => setSearch("")} className="mt-4 text-primary font-bold uppercase tracking-widest text-[10px]">
              Limpar Pesquisa
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projeto / ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Integrador</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Potência</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Concessionária</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(project => (
                  <tr
                    key={project.id}
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                    onClick={() => tab !== "arquivados" && setDetailProjectId(project.id)}
                    data-testid={`row-project-${project.id}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 min-w-0">
                        {project.ticketNumber && (
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] font-mono font-bold text-primary/70 tracking-tighter uppercase">{project.ticketNumber}</span>
                          </div>
                        )}
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[250px]">{project.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {((project as any).integrador?.name || project.client?.name || "U")[0]}
                        </div>
                        <span className="text-xs font-medium text-foreground/80">{(project as any).integrador?.name || project.client?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      {project.potencia ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground/70">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <span>{project.potencia} <span className="text-[10px] text-muted-foreground">kWp</span></span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className="text-xs font-medium text-foreground/70">{project.concessionaria || "—"}</span>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-0 shadow-sm ${getStatusBadge(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {tab === "arquivados" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                            onClick={(e) => { e.stopPropagation(); unarchiveMut.mutate(project.id); }}
                            disabled={unarchiveMut.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <Card
              key={project.id}
              className="group relative border-border/40 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden bg-background rounded-2xl"
              onClick={() => tab !== "arquivados" && setDetailProjectId(project.id)}
              data-testid={`card-project-${project.id}`}
            >
              <div className={`h-1.5 w-full ${getStatusBadge(project.status).split(" ")[1]}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    {project.ticketNumber && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/5 border border-primary/10 w-fit">
                        <Hash className="h-2.5 w-2.5 text-primary/60" />
                        <span className="text-[9px] font-mono font-bold text-primary/70 tracking-tighter uppercase">{project.ticketNumber}</span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0 shadow-sm ${getStatusBadge(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-semibold uppercase tracking-tight">Integrador</span>
                    <span className="font-bold text-foreground/80 truncate max-w-[140px]">{(project as any).integrador?.name || project.client?.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-semibold uppercase tracking-tight">Potência</span>
                    <div className="flex items-center gap-1.5 font-bold text-foreground/80">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>{project.potencia || "0"} kWp</span>
                    </div>
                  </div>
                  {project.valor && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-semibold uppercase tracking-tight">Investimento</span>
                      <span className="font-black text-primary/80">R$ {project.valor}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <div className="flex gap-2">
                    {tab === "arquivados" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={(e) => { e.stopPropagation(); unarchiveMut.mutate(project.id); }}
                        disabled={unarchiveMut.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-4 h-8 rounded-lg border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectDetailSheet
        project={detailProject}
        open={!!detailProjectId}
        onClose={() => setDetailProjectId(null)}
      />
    </div>
  );
}
