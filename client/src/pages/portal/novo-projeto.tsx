import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Send, Info, MapPin, Zap, Cpu, Sun,
  FileText, Upload, X, CheckCircle2, User, AlertCircle
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { formatCpfCnpj, formatPhone } from "@/lib/utils";

const CONCESSIONARIAS = [
  "ENEL SP", "ENEL CE", "ENEL GO", "ENEL RJ",
  "CEMIG", "COPEL", "CPFL", "RGE", "ELEKTRO",
  "ENERGISA", "COELBA", "CELPE", "EQUATORIAL",
  "COSERN", "CELESC", "LIGHT", "EDP", "Outra",
];

const AMPERAGENS = ["15A", "20A", "25A", "30A", "40A", "50A", "60A", "70A", "80A", "100A", "Outro"];

interface UploadedFile {
  name: string;
  objectPath: string;
  docType: string;
  docLabel: string;
}

interface FileUploadZoneProps {
  label: string;
  docType: string;
  required?: boolean;
  uploaded: UploadedFile | null;
  onUploaded: (f: UploadedFile) => void;
  onRemove: () => void;
  testId?: string;
}

function FileUploadZone({ label, docType, required, uploaded, onUploaded, onRemove, testId }: FileUploadZoneProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload({
    onSuccess: (res) => {
      onUploaded({ name: res.metadata.name, objectPath: res.objectPath, docType, docLabel: label });
      setUploading(false);
      setPendingFile(null);
      setPreviewUrl(null);
    },
    onError: () => {
      toast({ title: `Erro ao enviar ${label}`, variant: "destructive" });
      setUploading(false);
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPreviewUrl(url);
    } else {
      setUploading(true);
      uploadFile(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    await uploadFile(pendingFile);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  if (previewUrl && pendingFile) {
    return (
      <div className="rounded-lg border-2 border-primary/40 overflow-hidden">
        <div className="relative">
          <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain bg-muted/30" />
          {uploading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <p className="text-sm font-medium text-primary animate-pulse">Enviando...</p>
            </div>
          )}
        </div>
        <div className="p-2 bg-muted/30 flex items-center gap-2 justify-between">
          <p className="text-xs text-muted-foreground truncate flex-1">{pendingFile.name}</p>
          {!uploading && (
            <div className="flex gap-1.5 flex-shrink-0">
              <button type="button" onClick={cancelPreview} className="text-xs px-2 py-1 rounded border text-muted-foreground hover:text-destructive">Cancelar</button>
              <button type="button" onClick={confirmUpload} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90">Confirmar</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-700 dark:text-green-400">{label}</p>
          <p className="text-xs text-green-600 dark:text-green-500 truncate">{uploaded.name}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-green-600 hover:text-red-500 transition-colors flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label className="block cursor-pointer" data-testid={testId}>
      <div className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors
        ${uploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}>
        <Upload className={`h-4 w-4 flex-shrink-0 ${uploading ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {uploading ? "Enviando..." : "Clique para selecionar — PDF, JPG ou PNG"}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        disabled={uploading}
        onChange={handleFile}
      />
    </label>
  );
}

interface NovoProjetoForm {
  title: string;
  nomeCliente: string;
  cpfCnpjCliente: string;
  telefoneCliente: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  localizacao: string;
  concessionaria: string;
  tipoConexao: "monofasico" | "bifasico" | "trifasico";
  numeroInstalacao: string;
  amperagemDisjuntor: string;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversor: string;
  quantidadeInversor: string;
  marcaPainel: string;
  modeloPainel: string;
  potenciaPainel: string;
  quantidadePaineis: string;
  potencia: string;
  valor: string;
  description: string;
}

export default function NovoProjetoPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile | null>>({
    conta_energia: null,
    rg_cnh: null,
    procuracao: null,
    foto_local: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const [priceEstimate, setPriceEstimate] = useState<{ price: number; label: string; isPromotional?: boolean } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<NovoProjetoForm>({
    defaultValues: {
      title: "", nomeCliente: "", cpfCnpjCliente: "", telefoneCliente: "",
      rua: "", numero: "", bairro: "", cep: "", cidade: "", estado: "",
      localizacao: "", concessionaria: "",
      tipoConexao: "monofasico", numeroInstalacao: "", amperagemDisjuntor: "",
      marcaInversor: "", modeloInversor: "", potenciaInversor: "", quantidadeInversor: "1",
      marcaPainel: "", modeloPainel: "", potenciaPainel: "", quantidadePaineis: "",
      potencia: "", valor: "", description: "",
    },
  });

  const watchPotenciaUnit = watch("potenciaPainel");
  const watchQuantidade = watch("quantidadePaineis");
  const watchPotencia = watch("potencia");

  useEffect(() => {
    const unit = parseFloat(watchPotenciaUnit || "0");
    const qty = parseFloat(watchQuantidade || "0");
    if (unit > 0 && qty > 0) {
      const total = (unit * qty) / 1000;
      setValue("potencia", total.toFixed(2).replace(".", ","));
    }
  }, [watchPotenciaUnit, watchQuantidade, setValue]);

  const fetchCep = useCallback(async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setValue("rua", data.logradouro);
        if (data.bairro) setValue("bairro", data.bairro);
        if (data.localidade) setValue("cidade", data.localidade);
        if (data.uf) setValue("estado", data.uf);
      }
    } catch { /* ignore cep lookup errors */ }
  }, [setValue]);

  const fetchPrice = useCallback(async (kwpStr: string) => {
    const kwp = parseFloat(kwpStr.replace(",", "."));
    if (!kwp || kwp <= 0) { setPriceEstimate(null); return; }
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/pricing-ranges/calculate?kwp=${kwp}`);
      const data = await res.json();
      if (data?.price) {
        setPriceEstimate({ price: data.price, label: data.isPromotional ? (data.description || "Preço Especial") : (data.range?.label || ""), isPromotional: !!data.isPromotional });
        setValue("valor", String(data.price));
      } else {
        setPriceEstimate(null);
        setValue("valor", "");
      }
    } catch { setPriceEstimate(null); } finally { setPriceLoading(false); }
  }, [setValue]);

  useEffect(() => {
    const timer = setTimeout(() => { if (watchPotencia) fetchPrice(watchPotencia); }, 600);
    return () => clearTimeout(timer);
  }, [watchPotencia, fetchPrice]);

  const onSubmit = async (data: NovoProjetoForm) => {
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/projects", {
        ...data,
        status: "orcamento",
        clientId: "placeholder",
      });
      const project = await res.json();

      // Upload initial documents
      const docsToUpload = Object.values(uploadedDocs).filter(Boolean) as UploadedFile[];
      for (const doc of docsToUpload) {
        await apiRequest("POST", `/api/projects/${project.id}/documents`, {
          name: doc.docLabel,
          fileUrl: doc.objectPath,
          docType: doc.docType,
          fileType: "application/octet-stream",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Projeto solicitado com sucesso!",
        description: `${docsToUpload.length} documento(s) enviado(s). Nossa equipe entrará em contato em breve.`,
      });
      setLocation(`/portal/projetos/${project.id}`);
    } catch (err: any) {
      toast({ title: "Erro ao criar projeto", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const setDoc = (type: string) => (f: UploadedFile | null) =>
    setUploadedDocs(prev => ({ ...prev, [type]: f }));

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/portal"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Solicitar Novo Projeto</h1>
          <p className="text-sm text-muted-foreground">Preencha todos os dados do sistema fotovoltaico</p>
        </div>
      </div>

      <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Quanto mais completo o formulário, mais rápido nossa equipe consegue iniciar a homologação.
          Os campos marcados com <span className="text-destructive font-medium">*</span> são obrigatórios.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── 1. Identificação do Projeto ─────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Identificação do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome / Identificação do Projeto *</Label>
              <Input
                {...register("title", { required: "Nome obrigatório" })}
                placeholder="Ex: Sistema Solar Residencial — João Silva"
                data-testid="input-novo-title"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Dados do Cliente da Instalação ───────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Dados do Titular da Instalação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome Completo do Titular *</Label>
                <Input
                  {...register("nomeCliente", { required: "Nome do titular obrigatório" })}
                  placeholder="Nome conforme documento"
                  data-testid="input-nome-cliente"
                />
                {errors.nomeCliente && <p className="text-xs text-destructive">{errors.nomeCliente.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>CPF / CNPJ *</Label>
                <Input
                  {...register("cpfCnpjCliente", { required: "CPF/CNPJ obrigatório" })}
                  placeholder="000.000.000-00"
                  data-testid="input-cpfcnpj-cliente"
                  onChange={e => setValue("cpfCnpjCliente", formatCpfCnpj(e.target.value))}
                />
                {errors.cpfCnpjCliente && <p className="text-xs text-destructive">{errors.cpfCnpjCliente.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone do Titular</Label>
                <Input
                  {...register("telefoneCliente")}
                  placeholder="(00) 00000-0000"
                  data-testid="input-tel-cliente"
                  onChange={e => setValue("telefoneCliente", formatPhone(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Localização ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Localização da Instalação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>CEP *</Label>
                <Input
                  {...register("cep", { required: "CEP obrigatório" })}
                  placeholder="00000-000"
                  maxLength={9}
                  data-testid="input-novo-cep"
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    const formatted = val.length > 5 ? `${val.slice(0,5)}-${val.slice(5)}` : val;
                    setValue("cep", formatted);
                    fetchCep(val);
                  }}
                />
                {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <Label>Rua / Logradouro *</Label>
                <Input
                  {...register("rua", { required: "Rua obrigatória" })}
                  placeholder="Rua das Flores"
                  data-testid="input-novo-rua"
                />
                {errors.rua && <p className="text-xs text-destructive">{errors.rua.message}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Número *</Label>
                <Input
                  {...register("numero", { required: "Número obrigatório" })}
                  placeholder="123"
                  data-testid="input-novo-numero"
                />
                {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <Label>Bairro *</Label>
                <Input
                  {...register("bairro", { required: "Bairro obrigatório" })}
                  placeholder="Centro"
                  data-testid="input-novo-bairro"
                />
                {errors.bairro && <p className="text-xs text-destructive">{errors.bairro.message}</p>}
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <Label>Cidade *</Label>
                <Input
                  {...register("cidade", { required: "Cidade obrigatória" })}
                  placeholder="São Paulo"
                  data-testid="input-novo-cidade"
                />
                {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Estado (UF) *</Label>
                <Input
                  {...register("estado", { required: "Estado obrigatório" })}
                  placeholder="SP"
                  maxLength={2}
                  data-testid="input-novo-estado"
                  style={{ textTransform: "uppercase" }}
                />
                {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Link do Google Maps / Coordenadas GPS</Label>
              <Input
                {...register("localizacao")}
                placeholder="https://maps.google.com/... ou -23.550520, -46.633308"
                data-testid="input-localizacao"
              />
              <p className="text-xs text-muted-foreground">Cole o link compartilhado do Google Maps ou as coordenadas GPS</p>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Dados da Concessionária ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Dados da Concessionária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Concessionária *</Label>
                <Controller
                  name="concessionaria"
                  control={control}
                  rules={{ required: "Concessionária obrigatória" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-novo-concessionaria">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CONCESSIONARIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.concessionaria && <p className="text-xs text-destructive">{errors.concessionaria.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Conexão *</Label>
                <Controller
                  name="tipoConexao"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-novo-conexao">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monofasico">Monofásico</SelectItem>
                        <SelectItem value="bifasico">Bifásico</SelectItem>
                        <SelectItem value="trifasico">Trifásico</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amperagem do Disjuntor *</Label>
                <Controller
                  name="amperagemDisjuntor"
                  control={control}
                  rules={{ required: "Amperagem obrigatória" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-disjuntor">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AMPERAGENS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.amperagemDisjuntor && <p className="text-xs text-destructive">{errors.amperagemDisjuntor.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Número de Instalação (UC)</Label>
              <Input
                {...register("numeroInstalacao")}
                placeholder="Número conforme a conta de energia elétrica"
                data-testid="input-novo-instalacao"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Equipamentos — Inversor ──────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Inversor Solar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Marca *</Label>
                <Input
                  {...register("marcaInversor", { required: "Marca do inversor obrigatória" })}
                  placeholder="Ex: Growatt, Fronius, WEG, Solis..."
                  data-testid="input-marca-inversor"
                />
                {errors.marcaInversor && <p className="text-xs text-destructive">{errors.marcaInversor.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Modelo *</Label>
                <Input
                  {...register("modeloInversor", { required: "Modelo do inversor obrigatório" })}
                  placeholder="Ex: MIN 4200TL-XH, Primo 5.0-1"
                  data-testid="input-modelo-inversor"
                />
                {errors.modeloInversor && <p className="text-xs text-destructive">{errors.modeloInversor.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Potência (kW)</Label>
                <Input
                  {...register("potenciaInversor")}
                  placeholder="Ex: 5.0"
                  data-testid="input-potencia-inversor"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input
                  {...register("quantidadeInversor")}
                  placeholder="Ex: 1"
                  data-testid="input-qtd-inversor"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 6. Equipamentos — Painel Solar ──────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Módulos Fotovoltaicos (Painéis)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Marca *</Label>
                <Input
                  {...register("marcaPainel", { required: "Marca do painel obrigatória" })}
                  placeholder="Ex: Canadian Solar, Jinko, LONGi..."
                  data-testid="input-marca-painel"
                />
                {errors.marcaPainel && <p className="text-xs text-destructive">{errors.marcaPainel.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Modelo *</Label>
                <Input
                  {...register("modeloPainel", { required: "Modelo do painel obrigatório" })}
                  placeholder="Ex: CS6R-420MS, LR5-72HPH-540M"
                  data-testid="input-modelo-painel"
                />
                {errors.modeloPainel && <p className="text-xs text-destructive">{errors.modeloPainel.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Potência Unit. (Wp)</Label>
                <Input
                  {...register("potenciaPainel")}
                  placeholder="Ex: 420"
                  data-testid="input-potencia-painel"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade *</Label>
                <Input
                  {...register("quantidadePaineis", { required: "Quantidade obrigatória" })}
                  placeholder="Ex: 12"
                  data-testid="input-qtd-paineis"
                />
                {errors.quantidadePaineis && <p className="text-xs text-destructive">{errors.quantidadePaineis.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Potência Total (kWp)</Label>
                <Input
                  {...register("potencia")}
                  placeholder="Ex: 5.04"
                  data-testid="input-potencia-total"
                />
                {priceLoading && (
                  <p className="text-xs text-muted-foreground animate-pulse">Calculando preço...</p>
                )}
                {priceEstimate && !priceLoading && (
                  <div className={`flex items-center gap-2 mt-1 p-2 rounded-md border ${priceEstimate.isPromotional ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}>
                    <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${priceEstimate.isPromotional ? "text-amber-600" : "text-green-600"}`} />
                    <p className={`text-xs ${priceEstimate.isPromotional ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}>
                      {priceEstimate.isPromotional ? "Preço especial: " : "Valor estimado: "}
                      <strong>{Number(priceEstimate.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                      {priceEstimate.label && <span className="text-muted-foreground ml-1">({priceEstimate.label})</span>}
                    </p>
                  </div>
                )}
                <input type="hidden" {...register("valor")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 7. Documentos Iniciais ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Documentos Necessários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <FileUploadZone
                label="Conta de Energia"
                docType="conta_energia"
                required
                uploaded={uploadedDocs.conta_energia}
                onUploaded={setDoc("conta_energia")}
                onRemove={() => setDoc("conta_energia")(null)}
                testId="upload-conta-energia"
              />
              <FileUploadZone
                label="RG / CNH do Titular"
                docType="rg_cnh"
                required
                uploaded={uploadedDocs.rg_cnh}
                onUploaded={setDoc("rg_cnh")}
                onRemove={() => setDoc("rg_cnh")(null)}
                testId="upload-rg-cnh"
              />
              <FileUploadZone
                label="Procuração Assinada"
                docType="procuracao"
                uploaded={uploadedDocs.procuracao}
                onUploaded={setDoc("procuracao")}
                onRemove={() => setDoc("procuracao")(null)}
                testId="upload-procuracao"
              />
              <FileUploadZone
                label="Foto do Local"
                docType="foto_local"
                uploaded={uploadedDocs.foto_local}
                onUploaded={setDoc("foto_local")}
                onRemove={() => setDoc("foto_local")(null)}
                testId="upload-foto-local"
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              A conta de energia e o RG/CNH são obrigatórios para protocolo junto à concessionária.
            </p>
          </CardContent>
        </Card>

        {/* ── 8. Observações ─────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              <Label>Observações Adicionais</Label>
              <Textarea
                {...register("description")}
                placeholder="Tipo de telhado, estrutura de fixação, particularidades do local, acesso, medidor bidirecional existente..."
                rows={3}
                data-testid="textarea-novo-description"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-11 text-base"
          disabled={submitting}
          data-testid="button-submit-novo-projeto"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Enviando solicitação..." : "Enviar Solicitação de Projeto"}
        </Button>
      </form>
    </div>
  );
}
