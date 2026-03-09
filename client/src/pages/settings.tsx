import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Save, Upload, Zap, Building2, ImageOff, Mail, Send, Eye, EyeOff,
  CreditCard, MonitorPlay, Image, Settings2, Globe, ShieldCheck, Palette, ArrowRight,
  CheckCircle2, XCircle, Loader2, FolderOpen, FileKey, FileBadge
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpload } from "@/hooks/use-upload";

function LogoUploadSection({
  currentLogoUrl,
  onLogoUrlChange,
}: {
  currentLogoUrl: string;
  onLogoUrlChange: (url: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      onLogoUrlChange(response.objectPath);
      setUploading(false);
      toast({ title: "Logo carregada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload da logo", variant: "destructive" });
      setUploading(false);
    },
  });

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="h-24 w-36 border border-border rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0">
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Logo da empresa"
              className="h-20 w-32 object-contain"
              data-testid="img-company-logo-preview"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageOff className="h-8 w-8 opacity-40" />
              <span className="text-xs">Sem logo</span>
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="space-y-1.5">
            <Label>URL da Logo</Label>
            <Input
              value={currentLogoUrl}
              onChange={e => onLogoUrlChange(e.target.value)}
              placeholder="https://... ou caminho do upload"
              data-testid="input-logo-url"
            />
          </div>
          <label>
            <Button type="button" variant="outline" size="sm" className="relative" disabled={uploading} data-testid="button-upload-logo">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Enviando..." : "Upload da Logo"}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG com fundo transparente, mínimo 200x80px</p>
        </div>
      </div>
    </div>
  );
}

function FaviconUploadSection({ faviconUrl, setFaviconUrl }: { faviconUrl: string; setFaviconUrl: (v: string) => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { uploadFile } = useUpload({
    onSuccess: (res) => { setFaviconUrl(res.objectPath); setUploading(false); toast({ title: "Favicon enviado com sucesso!" }); },
    onError: () => { toast({ title: "Erro ao enviar favicon", variant: "destructive" }); setUploading(false); },
  });
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true); await uploadFile(file);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 border border-border rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {faviconUrl ? <img src={faviconUrl} alt="Favicon" className="h-10 w-10 object-contain" /> : <ImageOff className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://... ou faça upload" data-testid="input-favicon-url" />
          <label>
            <Button type="button" variant="outline" size="sm" className="relative" disabled={uploading} data-testid="button-upload-favicon">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Enviando..." : "Upload do Favicon"}
              <input type="file" accept="image/png,image/x-icon,image/svg+xml,image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFile} disabled={uploading} />
            </Button>
          </label>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG com fundo transparente, mínimo 256×256px</p>
    </div>
  );
}

function LoginCustomSection({
  badgeText, setBadgeText,
  headline, setHeadline,
  highlight, setHighlight,
  headlineSize, setHeadlineSize,
  description, setDescription,
  descriptionSize, setDescriptionSize,
  feature1, setFeature1,
  feature2, setFeature2,
  feature3, setFeature3,
  bgType, setBgType,
  bgImage, setBgImage,
  uploadingBg, setUploadingBg,
}: any) {
  const { toast } = useToast();
  const { uploadFile } = useUpload({
    onSuccess: (res) => {
      setBgImage(res.objectPath);
      setUploadingBg(false);
      toast({ title: "Foto de fundo carregada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao fazer upload da foto de fundo", variant: "destructive" });
      setUploadingBg(false);
    },
  });

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    await uploadFile(file);
  };

  return (
    <Card className="border-muted/40 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MonitorPlay className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">Personalização do Portal de Login</CardTitle>
        </div>
        <CardDescription>Ajuste as mensagens e o visual da tela de login do portal do integrador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto do Badge (Topo)</Label>
              <Input value={badgeText} onChange={e => setBadgeText(e.target.value)} placeholder="Portal SaaS de Homologação" data-testid="input-login-badge" />
            </div>
            <div className="space-y-2">
              <Label>Título Principal (Headline)</Label>
              <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Gerencie projetos de energia solar..." data-testid="input-login-headline" />
            </div>
            <div className="space-y-2">
              <Label>Tamanho do Título</Label>
              <Select value={headlineSize} onValueChange={setHeadlineSize}>
                <SelectTrigger data-testid="select-headline-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande (padrão)</SelectItem>
                  <SelectItem value="xl">Muito Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destaque no Título (Highlight)</Label>
              <Input value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="energia solar" data-testid="input-login-highlight" />
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Acompanhe cada etapa..." className="h-20" data-testid="input-login-description" />
            </div>
            <div className="space-y-2">
              <Label>Tamanho da Descrição</Label>
              <Select value={descriptionSize} onValueChange={setDescriptionSize}>
                <SelectTrigger data-testid="select-description-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio (padrão)</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionalidade 1</Label>
              <Input value={feature1} onChange={e => setFeature1(e.target.value)} placeholder="Acompanhamento em tempo real..." data-testid="input-login-feature-1" />
            </div>
            <div className="space-y-2">
              <Label>Funcionalidade 2</Label>
              <Input value={feature2} onChange={e => setFeature2(e.target.value)} placeholder="Documentos e ART centralizados..." data-testid="input-login-feature-2" />
            </div>
            <div className="space-y-2">
              <Label>Funcionalidade 3</Label>
              <Input value={feature3} onChange={e => setFeature3(e.target.value)} placeholder="Status atualizado automaticamente..." data-testid="input-login-feature-3" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-muted/40 space-y-4">
          <Label>Fundo do Painel</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBgType("gradient")}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${bgType === "gradient" ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
              data-testid="button-bg-gradient"
            >
              <div className="h-10 w-full rounded bg-gradient-to-br from-[#0c2340] via-[#0e3460] to-[#0d6efd]/70" />
              <span className="text-xs font-medium">Gradiente Padrão</span>
            </button>
            <button
              type="button"
              onClick={() => setBgType("image")}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${bgType === "image" ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
              data-testid="button-bg-image"
            >
              <div className="h-10 w-full rounded bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Image className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <span className="text-xs font-medium">Foto Personalizada</span>
            </button>
          </div>

          {bgType === "image" && (
            <div className="space-y-2">
              <Input value={bgImage} onChange={e => setBgImage(e.target.value)} placeholder="https://... ou faça upload abaixo" data-testid="input-login-bg-url" />
              <div className="flex items-center gap-3">
                <label>
                  <Button type="button" variant="outline" size="sm" className="relative" disabled={uploadingBg} data-testid="button-upload-bg">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {uploadingBg ? "Enviando..." : "Upload de Foto"}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBgUpload} disabled={uploadingBg} />
                  </Button>
                </label>
                {bgImage && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBgImage("")} data-testid="button-remove-bg">
                    Remover foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Recomendado: JPG ou WebP, mínimo 1200×800px. A foto será escurecida levemente para legibilidade.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smtpHost, setSmtpHost] = useState("smtp.office365.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [portalUrl, setPortalUrl] = useState("https://projetos.randolisolar.com.br");
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");

  const [mpEnabled, setMpEnabled] = useState(true);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpWebhookSecret, setMpWebhookSecret] = useState("");
  const [showMpToken, setShowMpToken] = useState(false);

  const [interEnabled, setInterEnabled] = useState(false);
  const [interEnvironment, setInterEnvironment] = useState<"sandbox" | "production">("production");
  const [interClientId, setInterClientId] = useState("");
  const [interClientSecret, setInterClientSecret] = useState("");
  const [interCertificate, setInterCertificate] = useState("");
  const [interPrivateKey, setInterPrivateKey] = useState("");
  const [interPixKey, setInterPixKey] = useState("");
  const [interWebhookKey, setInterWebhookKey] = useState("");
  const [interWebhookCert, setInterWebhookCert] = useState("");
  const [showInterSecret, setShowInterSecret] = useState(false);
  const [showInterCert, setShowInterCert] = useState(false);
  const [showInterKey, setShowInterKey] = useState(false);
  const [showInterWebhookCert, setShowInterWebhookCert] = useState(false);
  const [certUploadLoading, setCertUploadLoading] = useState(false);
  const zipFileRef = useRef<HTMLInputElement>(null);
  const certFileRef = useRef<HTMLInputElement>(null);
  const keyFileRef = useRef<HTMLInputElement>(null);

  const [loginBadgeText, setLoginBadgeText] = useState("Portal SaaS de Homologação");
  const [loginHeadline, setLoginHeadline] = useState("Gerencie projetos de energia solar de forma simples e eficiente");
  const [loginHighlight, setLoginHighlight] = useState("energia solar");
  const [loginHeadlineSize, setLoginHeadlineSize] = useState("lg");
  const [loginDescription, setLoginDescription] = useState("Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.");
  const [loginDescriptionSize, setLoginDescriptionSize] = useState("md");
  const [loginFeature1, setLoginFeature1] = useState("Acompanhamento em tempo real de cada etapa");
  const [loginFeature2, setLoginFeature2] = useState("Documentos e ART centralizados no portal");
  const [loginFeature3, setLoginFeature3] = useState("Status atualizado automaticamente pela nossa equipe");
  const [loginBgType, setLoginBgType] = useState<"gradient" | "image">("gradient");
  const [loginBgImage, setLoginBgImage] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);

  const [supportTitle, setSupportTitle] = useState("Suporte Premium");
  const [supportDescription, setSupportDescription] = useState("Nossa equipe de engenharia está pronta para auxiliar você em qualquer etapa.");
  const [supportButtonText, setSupportButtonText] = useState("Falar com Engenheiro");
  const [supportWhatsappUrl, setSupportWhatsappUrl] = useState("https://wa.me/seunumerowhatsapp");

  const [faviconUrl, setFaviconUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setFaviconUrl(settings.favicon_url || "");
    setCompanyName(settings.company_name || "Randoli Engenharia");
    setLogoUrl(settings.logo_url || "");
    setPrimaryColor(settings.primary_color || "#0ea5e9");
    setEmailEnabled(settings.email_notifications_enabled !== "false");
    setSmtpHost(settings.email_smtp_host || "smtp.office365.com");
    setSmtpPort(settings.email_smtp_port || "587");
    setSmtpUser(settings.email_smtp_user || "");
    setSmtpPass(settings.email_smtp_pass || "");
    setSmtpFrom(settings.email_smtp_from || "");
    setPortalUrl(settings.email_portal_url || "https://projetos.randolisolar.com.br");
    setTestEmailTo(settings.email_smtp_user || "");
    setMpEnabled(settings.mp_enabled !== "false");
    setMpAccessToken(settings.mp_access_token || "");
    setMpPublicKey(settings.mp_public_key || "");
    setMpWebhookSecret(settings.mp_webhook_secret || "");
    setInterEnabled(settings.inter_enabled === "true");
    setInterEnvironment((settings.inter_environment as "sandbox" | "production") || "production");
    setInterClientId(settings.inter_client_id || "");
    setInterClientSecret(settings.inter_client_secret || "");
    setInterCertificate(settings.inter_certificate || "");
    setInterPrivateKey(settings.inter_private_key || "");
    setInterPixKey(settings.inter_pix_key || "");
    setInterWebhookKey(settings.inter_webhook_key || "");
    setInterWebhookCert(settings.inter_webhook_cert || "");
    if (settings.login_badge_text) setLoginBadgeText(settings.login_badge_text);
    if (settings.login_headline) setLoginHeadline(settings.login_headline);
    if (settings.login_headline_highlight) setLoginHighlight(settings.login_headline_highlight);
    if (settings.login_headline_size) setLoginHeadlineSize(settings.login_headline_size);
    if (settings.login_description) setLoginDescription(settings.login_description);
    if (settings.login_description_size) setLoginDescriptionSize(settings.login_description_size);
    if (settings.login_feature_1) setLoginFeature1(settings.login_feature_1);
    if (settings.login_feature_2) setLoginFeature2(settings.login_feature_2);
    if (settings.login_feature_3) setLoginFeature3(settings.login_feature_3);
    if (settings.login_bg_type) setLoginBgType(settings.login_bg_type as "gradient" | "image");
    if (settings.login_bg_image) setLoginBgImage(settings.login_bg_image);
    if (settings.support_title) setSupportTitle(settings.support_title);
    if (settings.support_description) setSupportDescription(settings.support_description);
    if (settings.support_button_text) setSupportButtonText(settings.support_button_text);
    if (settings.support_whatsapp_url) setSupportWhatsappUrl(settings.support_whatsapp_url);
    setInitialized(true);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const pairs = [
        { key: "company_name", value: companyName },
        { key: "logo_url", value: logoUrl },
        { key: "primary_color", value: primaryColor },
        { key: "email_notifications_enabled", value: emailEnabled ? "true" : "false" },
        { key: "email_smtp_host", value: smtpHost },
        { key: "email_smtp_port", value: smtpPort },
        { key: "email_smtp_user", value: smtpUser },
        { key: "email_smtp_from", value: smtpFrom },
        { key: "email_portal_url", value: portalUrl },
      ];
      if (smtpPass && smtpPass !== "••••••••") {
        pairs.push({ key: "email_smtp_pass", value: smtpPass });
      }
      pairs.push({ key: "mp_enabled", value: mpEnabled ? "true" : "false" });
      pairs.push({ key: "mp_public_key", value: mpPublicKey });
      if (mpAccessToken && mpAccessToken !== "••••••••") {
        pairs.push({ key: "mp_access_token", value: mpAccessToken });
      }
      if (mpWebhookSecret && mpWebhookSecret !== "••••••••") {
        pairs.push({ key: "mp_webhook_secret", value: mpWebhookSecret });
      }
      pairs.push({ key: "inter_enabled", value: interEnabled ? "true" : "false" });
      pairs.push({ key: "inter_environment", value: interEnvironment });
      pairs.push({ key: "inter_client_id", value: interClientId });
      pairs.push({ key: "inter_pix_key", value: interPixKey });
      if (interClientSecret && interClientSecret !== "••••••••") {
        pairs.push({ key: "inter_client_secret", value: interClientSecret });
      }
      if (interCertificate && interCertificate !== "••••••••") {
        pairs.push({ key: "inter_certificate", value: interCertificate });
      }
      if (interPrivateKey && interPrivateKey !== "••••••••") {
        pairs.push({ key: "inter_private_key", value: interPrivateKey });
      }
      if (interWebhookKey && interWebhookKey !== "••••••••") {
        pairs.push({ key: "inter_webhook_key", value: interWebhookKey });
      }
      if (interWebhookCert && interWebhookCert !== "••••••••") {
        pairs.push({ key: "inter_webhook_cert", value: interWebhookCert });
      }
      pairs.push({ key: "favicon_url", value: faviconUrl });
      pairs.push(
        { key: "login_badge_text", value: loginBadgeText },
        { key: "login_headline", value: loginHeadline },
        { key: "login_headline_highlight", value: loginHighlight },
        { key: "login_headline_size", value: loginHeadlineSize },
        { key: "login_description", value: loginDescription },
        { key: "login_description_size", value: loginDescriptionSize },
        { key: "login_feature_1", value: loginFeature1 },
        { key: "login_feature_2", value: loginFeature2 },
        { key: "login_feature_3", value: loginFeature3 },
        { key: "login_bg_type", value: loginBgType },
        { key: "login_bg_image", value: loginBgImage },
        { key: "support_title", value: supportTitle },
        { key: "support_description", value: supportDescription },
        { key: "support_button_text", value: supportButtonText },
        { key: "support_whatsapp_url", value: supportWhatsappUrl },
      );
      await Promise.all(pairs.map(p => apiRequest("POST", "/api/settings", p)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Configurações salvas com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
  });

  const testEmailMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email/test", { to: testEmailTo || undefined });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `E-mail de teste enviado para ${data.sentTo}` });
    },
    onError: async (err: any) => {
      let msg = "Erro ao enviar e-mail de teste";
      try { const body = await err.json?.(); if (body?.error) msg = body.error; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });

  const testInterMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inter/test", {
        clientId: interClientId,
        clientSecret: interClientSecret !== "••••••••" ? interClientSecret : undefined,
        certificate: interCertificate !== "••••••••" ? interCertificate : undefined,
        privateKey: interPrivateKey !== "••••••••" ? interPrivateKey : undefined,
        pixKey: interPixKey,
        environment: interEnvironment,
      });
      return res.json();
    },
    onSuccess: (data: { ok: boolean; message: string }) => {
      if (data.ok) {
        toast({ title: "Banco Inter conectado!", description: data.message });
      } else {
        toast({ title: "Falha na conexão", description: data.message, variant: "destructive" });
      }
    },
    onError: () => toast({ title: "Erro ao testar conexão Inter", variant: "destructive" }),
  });

  // Handler for ZIP / .crt / .key file upload
  const handleCertFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/inter/upload-cert", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "Erro ao processar arquivo", variant: "destructive" }); return; }
      if (data.certificate) { setInterCertificate(data.certificate); setShowInterCert(false); }
      if (data.privateKey) { setInterPrivateKey(data.privateKey); setShowInterKey(false); }
      if (data.webhookCert) { setInterWebhookCert(data.webhookCert); }
      if (data.source === "zip") {
        const parts = [];
        if (data.certificate) parts.push("certificado da empresa (.crt)");
        if (data.privateKey) parts.push("chave privada (.key)");
        if (data.webhookCert) parts.push("CA do Inter (webhook)");
        toast({ title: "ZIP extraído com sucesso!", description: `Encontrado: ${parts.join(", ")}. Clique em Salvar para confirmar.` });
      } else {
        toast({ title: "Arquivo carregado!", description: "Clique em Salvar para confirmar." });
      }
    } catch {
      toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
    } finally {
      setCertUploadLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Configurações</h1>
          </div>
          <p className="text-muted-foreground">Personalize a plataforma e ajuste integrações</p>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="hover-elevate shadow-md">
          <Save className="h-4 w-4 mr-2" />
          {saveMut.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-48 col-span-1 rounded-xl" />
          <Skeleton className="h-96 col-span-3 rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 space-y-1">
                <TabsTrigger value="general" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Globe className="h-4 w-4 mr-2" /> Geral
                </TabsTrigger>
                <TabsTrigger value="visual" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Palette className="h-4 w-4 mr-2" /> Identidade
                </TabsTrigger>
                <TabsTrigger value="notifications" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <Mail className="h-4 w-4 mr-2" /> Notificações
                </TabsTrigger>
                <TabsTrigger value="integrations" className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all border border-transparent data-[state=active]:border-primary/20">
                  <CreditCard className="h-4 w-4 mr-2" /> Pagamentos
                </TabsTrigger>
              </TabsList>
            </aside>

            <div className="md:col-span-3 space-y-6">
              <TabsContent value="general" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Informações Gerais</CardTitle>
                    </div>
                    <CardDescription>Configure os dados básicos da sua empresa na plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Randoli Engenharia" data-testid="input-company-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portal-url">URL do Portal (Integrador)</Label>
                        <Input id="portal-url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://portal.suaempresa.com" data-testid="input-portal-url" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <LoginCustomSection
                  badgeText={loginBadgeText} setBadgeText={setLoginBadgeText}
                  headline={loginHeadline} setHeadline={setLoginHeadline}
                  highlight={loginHighlight} setHighlight={setLoginHighlight}
                  headlineSize={loginHeadlineSize} setHeadlineSize={setLoginHeadlineSize}
                  description={loginDescription} setDescription={setLoginDescription}
                  descriptionSize={loginDescriptionSize} setDescriptionSize={setLoginDescriptionSize}
                  feature1={loginFeature1} setFeature1={setLoginFeature1}
                  feature2={loginFeature2} setFeature2={setLoginFeature2}
                  feature3={loginFeature3} setFeature3={setLoginFeature3}
                  bgType={loginBgType} setBgType={setLoginBgType}
                  bgImage={loginBgImage} setBgImage={setLoginBgImage}
                  uploadingBg={uploadingBg} setUploadingBg={setUploadingBg}
                />

                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Suporte Premium (Portal)</CardTitle>
                    </div>
                    <CardDescription>Configure o card de suporte exibido no portal do integrador.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título do Card</Label>
                        <Input value={supportTitle} onChange={e => setSupportTitle(e.target.value)} placeholder="Suporte Premium" data-testid="input-support-title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Texto do Botão</Label>
                        <Input value={supportButtonText} onChange={e => setSupportButtonText(e.target.value)} placeholder="Falar com Engenheiro" data-testid="input-support-button-text" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={supportDescription} onChange={e => setSupportDescription(e.target.value)} placeholder="Nossa equipe de engenharia está pronta..." className="h-20" data-testid="input-support-description" />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do WhatsApp</Label>
                      <Input value={supportWhatsappUrl} onChange={e => setSupportWhatsappUrl(e.target.value)} placeholder="https://wa.me/5511999999999" data-testid="input-support-whatsapp-url" />
                      <p className="text-xs text-muted-foreground">Formato: https://wa.me/55DDD999999999 (sem espaços ou símbolos)</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Identidade Visual</CardTitle>
                    </div>
                    <CardDescription>Personalize o visual da sua plataforma (Logo e Favicon).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LogoUploadSection currentLogoUrl={logoUrl} onLogoUrlChange={setLogoUrl} />
                    <div className="pt-4 border-t border-muted/40 space-y-4">
                      <div className="space-y-2">
                        <Label>Favicon</Label>
                        <FaviconUploadSection faviconUrl={faviconUrl} setFaviconUrl={setFaviconUrl} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor Primária</Label>
                        <div className="flex items-center gap-3">
                          <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 rounded-md" data-testid="input-primary-color" />
                          <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Configurações de E-mail (SMTP)</CardTitle>
                    </div>
                    <CardDescription>Configure como a plataforma envia e-mails automáticos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Notificações Ativas</Label>
                        <p className="text-xs text-muted-foreground">Habilitar envio automático de e-mails para clientes e equipe.</p>
                      </div>
                      <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} data-testid="switch-email-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host SMTP</Label>
                        <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.office365.com" data-testid="input-smtp-host" />
                      </div>
                      <div className="space-y-2">
                        <Label>Porta SMTP</Label>
                        <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" data-testid="input-smtp-port" />
                      </div>
                      <div className="space-y-2">
                        <Label>Usuário/E-mail</Label>
                        <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="contato@suaempresa.com" data-testid="input-smtp-user" />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={smtpPass}
                            onChange={e => setSmtpPass(e.target.value)}
                            placeholder="••••••••"
                            className="pr-10"
                            data-testid="input-smtp-pass"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail do Remetente (From)</Label>
                        <Input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="Engenharia Solar <contato@suaempresa.com>" data-testid="input-smtp-from" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-muted/40 flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>Enviar teste para:</Label>
                        <Input value={testEmailTo} onChange={e => setTestEmailTo(e.target.value)} placeholder="seuemail@exemplo.com" />
                      </div>
                      <Button variant="outline" className="mt-8" onClick={() => testEmailMut.mutate()} disabled={testEmailMut.isPending} data-testid="button-test-email">
                        {testEmailMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Testar SMTP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Mercado Pago</CardTitle>
                    </div>
                    <CardDescription>Receba pagamentos via Cartão e PIX através do Mercado Pago.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">Mercado Pago Ativo</Label>
                        <p className="text-xs text-muted-foreground">Utilizar Mercado Pago para liquidação de faturas.</p>
                      </div>
                      <Switch checked={mpEnabled} onCheckedChange={setMpEnabled} data-testid="switch-mp-enabled" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <Input value={mpPublicKey} onChange={e => setMpPublicKey(e.target.value)} placeholder="APP_USR-..." data-testid="input-mp-public-key" />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <div className="relative">
                          <Input
                            type={showMpToken ? "text" : "password"}
                            value={mpAccessToken}
                            onChange={e => setMpAccessToken(e.target.value)}
                            placeholder="APP_USR-..."
                            className="pr-10"
                            data-testid="input-mp-access-token"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowMpToken(!showMpToken)}>
                            {showMpToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Webhook Secret</Label>
                        <Input value={mpWebhookSecret} onChange={e => setMpWebhookSecret(e.target.value)} placeholder="Seu secret do webhook" data-testid="input-mp-webhook-secret" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Banco Inter (API PIX)</CardTitle>
                    </div>
                    <CardDescription>Integração direta com Banco Inter para recebimento de PIX com taxas menores.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/40 mb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold">Banco Inter Ativo</Label>
                          {interEnabled ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold h-5">CONFIGURADO</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold h-5">PENDENTE</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Utilizar Banco Inter para geração dinâmica de PIX.</p>
                      </div>
                      <Switch checked={interEnabled} onCheckedChange={setInterEnabled} data-testid="switch-inter-enabled" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ambiente</Label>
                        <Select value={interEnvironment} onValueChange={(v: any) => setInterEnvironment(v)}>
                          <SelectTrigger data-testid="select-inter-env">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                            <SelectItem value="production">Produção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input value={interPixKey} onChange={e => setInterPixKey(e.target.value)} placeholder="Chave PIX cadastrada no Inter" data-testid="input-inter-pix-key" />
                      </div>
                      <div className="space-y-2">
                        <Label>Client ID</Label>
                        <Input value={interClientId} onChange={e => setInterClientId(e.target.value)} placeholder="..." data-testid="input-inter-client-id" />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <div className="relative">
                          <Input
                            type={showInterSecret ? "text" : "password"}
                            value={interClientSecret}
                            onChange={e => setInterClientSecret(e.target.value)}
                            placeholder="••••••••"
                            className="pr-10"
                            data-testid="input-inter-client-secret"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowInterSecret(!showInterSecret)}>
                            {showInterSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── CERTIFICADO mTLS INTER ── */}
                    <div className="space-y-4 pt-4 border-t border-muted/40">
                      <Label className="flex items-center gap-2 text-sm font-bold">
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        Certificado mTLS do Banco Inter
                      </Label>

                      {/* Upload card */}
                      <div className="p-4 rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-700/40 bg-orange-50/50 dark:bg-orange-900/10 space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Baixe o arquivo <strong>ZIP</strong> no portal do Inter (<code className="bg-muted px-1 rounded text-[10px]">developers.inter.co → Minhas Integrações</code>) e clique em <strong>Selecionar arquivo</strong>. O sistema extrai o certificado e a chave automaticamente.
                        </p>

                        {/* Status badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${interCertificate ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                            <FileBadge className="h-3 w-3" />
                            Certificado (.crt): {interCertificate ? "Configurado ✓" : "Não configurado"}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${interPrivateKey ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                            <FileKey className="h-3 w-3" />
                            Chave Privada (.key): {interPrivateKey ? "Configurada ✓" : "Não configurada"}
                          </span>
                        </div>

                        {/* Hidden file inputs */}
                        <input ref={zipFileRef} type="file" accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream" className="hidden" onChange={handleCertFileUpload} data-testid="input-inter-cert-zip" />
                        <input ref={certFileRef} type="file" accept=".crt,.pem,application/x-pem-file" className="hidden" onChange={handleCertFileUpload} data-testid="input-inter-cert-file" />
                        <input ref={keyFileRef} type="file" accept=".key,.pem,application/x-pem-file" className="hidden" onChange={handleCertFileUpload} data-testid="input-inter-key-file" />

                        {/* Primary button */}
                        <Button
                          type="button"
                          variant="default"
                          disabled={certUploadLoading}
                          onClick={() => zipFileRef.current?.click()}
                          className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white h-10"
                          data-testid="button-upload-inter-zip"
                        >
                          {certUploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                          {certUploadLoading ? "Processando arquivo..." : "Selecionar arquivo (ZIP, .crt ou .key)"}
                        </Button>

                        {/* Individual file buttons */}
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={certUploadLoading} onClick={() => certFileRef.current?.click()} className="gap-1.5 flex-1 text-xs" data-testid="button-upload-inter-crt">
                            <FileBadge className="h-3.5 w-3.5 text-orange-500" /> Somente .crt
                          </Button>
                          <Button type="button" variant="outline" size="sm" disabled={certUploadLoading} onClick={() => keyFileRef.current?.click()} className="gap-1.5 flex-1 text-xs" data-testid="button-upload-inter-key">
                            <FileKey className="h-3.5 w-3.5 text-orange-500" /> Somente .key
                          </Button>
                        </div>
                      </div>

                      {/* Manual paste fallback */}
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none flex items-center gap-1">
                          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                          Colar manualmente (alternativa ao upload)
                        </summary>
                        <div className="space-y-3 mt-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Conteúdo do Certificado (.crt)</Label>
                            <div className="relative">
                              <Textarea
                                value={showInterCert ? interCertificate : (interCertificate && interCertificate !== "••••••••" ? "••••••••" : interCertificate)}
                                onChange={e => setInterCertificate(e.target.value)}
                                onFocus={() => setShowInterCert(true)}
                                placeholder="-----BEGIN CERTIFICATE----- ..."
                                className="font-mono text-[10px] min-h-[80px]"
                                data-testid="textarea-inter-cert"
                              />
                              <button type="button" className="absolute right-3 top-2 text-muted-foreground" onClick={() => setShowInterCert(!showInterCert)}>
                                {showInterCert ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Conteúdo da Chave Privada (.key)</Label>
                            <div className="relative">
                              <Textarea
                                value={showInterKey ? interPrivateKey : (interPrivateKey && interPrivateKey !== "••••••••" ? "••••••••" : interPrivateKey)}
                                onChange={e => setInterPrivateKey(e.target.value)}
                                onFocus={() => setShowInterKey(true)}
                                placeholder="-----BEGIN PRIVATE KEY----- ..."
                                className="font-mono text-[10px] min-h-[80px]"
                                data-testid="textarea-inter-key"
                              />
                              <button type="button" className="absolute right-3 top-2 text-muted-foreground" onClick={() => setShowInterKey(!showInterKey)}>
                                {showInterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-muted/40 bg-muted/20 p-3 rounded-lg">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configurações de Webhook (Opcional)</Label>
                      <div className="space-y-2">
                        <Label>Webhook Secret / Key</Label>
                        <Input value={interWebhookKey} onChange={e => setInterWebhookKey(e.target.value)} placeholder="..." data-testid="input-inter-webhook-key" />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Certificado (Inter)</Label>
                        <div className="relative">
                          <Textarea
                            value={interWebhookCert}
                            onChange={e => setInterWebhookCert(e.target.value)}
                            placeholder="-----BEGIN CERTIFICATE----- ..."
                            className="font-mono text-[10px] min-h-[80px]"
                            data-testid="textarea-inter-webhook-cert"
                          />
                          <button type="button" className="absolute right-3 top-2 text-muted-foreground" onClick={() => setShowInterWebhookCert(!showInterWebhookCert)}>
                            {showInterWebhookCert ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => testInterMut.mutate()} disabled={testInterMut.isPending} data-testid="button-test-inter">
                        {testInterMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Testar Conexão Inter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
}
