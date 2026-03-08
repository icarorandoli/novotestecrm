import { useState } from "react";
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
import {
  Save, Upload, Zap, Building2, ImageOff, Mail, Send, Eye, EyeOff,
  CreditCard, MonitorPlay, Image, Settings2, Globe, ShieldCheck, Palette, ArrowRight,
  CheckCircle2, XCircle, Loader2
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

function LoginCustomSection({
  badgeText, setBadgeText,
  headline, setHeadline,
  highlight, setHighlight,
  description, setDescription,
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
              <Label>Destaque no Título (Highlight)</Label>
              <Input value={highlight} onChange={e => setHighlight(e.target.value)} placeholder="energia solar" data-testid="input-login-highlight" />
            </div>
            <div className="space-y-2">
              <Label>Descrição Curta</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Acompanhe cada etapa..." className="h-20" data-testid="input-login-description" />
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
  const [showInterSecret, setShowInterSecret] = useState(false);
  const [showInterCert, setShowInterCert] = useState(false);
  const [showInterKey, setShowInterKey] = useState(false);

  const [loginBadgeText, setLoginBadgeText] = useState("Portal SaaS de Homologação");
  const [loginHeadline, setLoginHeadline] = useState("Gerencie projetos de energia solar de forma simples e eficiente");
  const [loginHighlight, setLoginHighlight] = useState("energia solar");
  const [loginDescription, setLoginDescription] = useState("Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.");
  const [loginFeature1, setLoginFeature1] = useState("Acompanhamento em tempo real de cada etapa");
  const [loginFeature2, setLoginFeature2] = useState("Documentos e ART centralizados no portal");
  const [loginFeature3, setLoginFeature3] = useState("Status atualizado automaticamente pela nossa equipe");
  const [loginBgType, setLoginBgType] = useState<"gradient" | "image">("gradient");
  const [loginBgImage, setLoginBgImage] = useState("");
  const [uploadingBg, setUploadingBg] = useState(false);

  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
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
    if (settings.login_badge_text) setLoginBadgeText(settings.login_badge_text);
    if (settings.login_headline) setLoginHeadline(settings.login_headline);
    if (settings.login_headline_highlight) setLoginHighlight(settings.login_headline_highlight);
    if (settings.login_description) setLoginDescription(settings.login_description);
    if (settings.login_feature_1) setLoginFeature1(settings.login_feature_1);
    if (settings.login_feature_2) setLoginFeature2(settings.login_feature_2);
    if (settings.login_feature_3) setLoginFeature3(settings.login_feature_3);
    if (settings.login_bg_type) setLoginBgType(settings.login_bg_type as "gradient" | "image");
    if (settings.login_bg_image) setLoginBgImage(settings.login_bg_image);
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
      pairs.push(
        { key: "login_badge_text", value: loginBadgeText },
        { key: "login_headline", value: loginHeadline },
        { key: "login_headline_highlight", value: loginHighlight },
        { key: "login_description", value: loginDescription },
        { key: "login_feature_1", value: loginFeature1 },
        { key: "login_feature_2", value: loginFeature2 },
        { key: "login_feature_3", value: loginFeature3 },
        { key: "login_bg_type", value: loginBgType },
        { key: "login_bg_image", value: loginBgImage },
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
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                    <CardDescription>Configure os dados básicos da sua empresa na plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Randoli Engenharia" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-url">URL do Portal (Integrador)</Label>
                      <Input id="portal-url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://portal.suaempresa.com" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" /> Carrossel de Parceiros
                    </CardTitle>
                    <CardDescription>Gerencie as logos que aparecem no site principal.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">Gerenciar no Módulo de Parceiros</p>
                        <p className="text-sm text-muted-foreground mt-1">A configuração detalhada do carrossel, incluindo logos, nomes e links, deve ser feita diretamente na página de parceiros.</p>
                        <Button variant="ghost" className="p-0 h-auto mt-2 text-primary" onClick={() => window.location.href = "/partners"}>Ir para Parceiros</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Logomarca</CardTitle>
                    <CardDescription>Faça o upload da sua logo principal.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LogoUploadSection currentLogoUrl={logoUrl} onLogoUrlChange={setLogoUrl} />
                  </CardContent>
                </Card>

                <LoginCustomSection
                  badgeText={loginBadgeText} setBadgeText={setLoginBadgeText}
                  headline={loginHeadline} setHeadline={setLoginHeadline}
                  highlight={loginHighlight} setHighlight={setLoginHighlight}
                  description={loginDescription} setDescription={setLoginDescription}
                  feature1={loginFeature1} setFeature1={setLoginFeature1}
                  feature2={loginFeature2} setFeature2={setLoginFeature2}
                  feature3={loginFeature3} setFeature3={setLoginFeature3}
                  bgType={loginBgType} setBgType={setLoginBgType}
                  bgImage={loginBgImage} setBgImage={setLoginBgImage}
                  uploadingBg={uploadingBg} setUploadingBg={setUploadingBg}
                />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Configuração SMTP</CardTitle>
                    <CardDescription>O sistema utiliza esses dados para enviar e-mails automáticos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted/50">
                      <div className="space-y-0.5">
                        <p className="font-semibold">E-mails Automáticos</p>
                        <p className="text-sm text-muted-foreground">Enviar avisos de status para integradores</p>
                      </div>
                      <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Servidor SMTP</Label>
                        <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Porta</Label>
                        <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>E-mail de Envio (User)</Label>
                      <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Senha SMTP</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={smtpPass}
                          onChange={e => setSmtpPass(e.target.value)}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-muted/40">
                      <div className="flex items-center gap-3">
                        <Input
                          value={testEmailTo}
                          onChange={e => setTestEmailTo(e.target.value)}
                          placeholder="E-mail para teste"
                          className="max-w-xs h-9 text-sm"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testEmailMut.mutate()}
                          disabled={testEmailMut.isPending}
                          className="h-9 hover-elevate"
                        >
                          <Send className="h-3.5 w-3.5 mr-2" />
                          {testEmailMut.isPending ? "Enviando..." : "Enviar Teste"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 space-y-6">
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Mercado Pago</CardTitle>
                    <CardDescription>Configure o recebimento automático de projetos via PIX ou Cartão.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="space-y-0.5">
                        <p className="font-semibold">Pagamento Integrado</p>
                        <p className="text-sm text-muted-foreground">Habilitar checkout Mercado Pago no portal</p>
                      </div>
                      <Switch checked={mpEnabled} onCheckedChange={setMpEnabled} />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <Input value={mpPublicKey} onChange={e => setMpPublicKey(e.target.value)} placeholder="APP_USR-..." />
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
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowMpToken(!showMpToken)}>
                            {showMpToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Banco Inter */}
                <Card className="border-muted/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Banco Inter — PIX</CardTitle>
                        <CardDescription>Configure o recebimento via PIX diretamente pelo Banco Inter (mTLS).</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="space-y-0.5">
                        <p className="font-semibold">PIX Banco Inter</p>
                        <p className="text-sm text-muted-foreground">Habilitar PIX via Banco Inter no portal do integrador</p>
                      </div>
                      <Switch checked={interEnabled} onCheckedChange={setInterEnabled} data-testid="switch-inter-enabled" />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ambiente</Label>
                        <Select value={interEnvironment} onValueChange={(v) => setInterEnvironment(v as "sandbox" | "production")}>
                          <SelectTrigger data-testid="select-inter-environment">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="production">Produção</SelectItem>
                            <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client ID</Label>
                          <Input
                            value={interClientId}
                            onChange={e => setInterClientId(e.target.value)}
                            placeholder="seu-client-id"
                            data-testid="input-inter-client-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Chave PIX (recebimento)</Label>
                          <Input
                            value={interPixKey}
                            onChange={e => setInterPixKey(e.target.value)}
                            placeholder="CPF, CNPJ, e-mail ou chave aleatória"
                            data-testid="input-inter-pix-key"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <div className="relative">
                          <Input
                            type={showInterSecret ? "text" : "password"}
                            value={interClientSecret}
                            onChange={e => setInterClientSecret(e.target.value)}
                            placeholder="client-secret"
                            className="pr-10"
                            data-testid="input-inter-client-secret"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowInterSecret(!showInterSecret)}>
                            {showInterSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Certificado (.crt) — Conteúdo PEM</Label>
                        <div className="relative">
                          <Textarea
                            value={showInterCert ? interCertificate : (interCertificate && interCertificate !== "••••••••" ? "••••••••" : interCertificate)}
                            onChange={e => setInterCertificate(e.target.value)}
                            onFocus={() => setShowInterCert(true)}
                            placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
                            rows={4}
                            className="font-mono text-xs resize-none"
                            data-testid="textarea-inter-certificate"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cole o conteúdo completo do arquivo .crt gerado pelo portal Inter.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Chave Privada (.key) — Conteúdo PEM</Label>
                        <div className="relative">
                          <Textarea
                            value={showInterKey ? interPrivateKey : (interPrivateKey && interPrivateKey !== "••••••••" ? "••••••••" : interPrivateKey)}
                            onChange={e => setInterPrivateKey(e.target.value)}
                            onFocus={() => setShowInterKey(true)}
                            placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                            rows={4}
                            className="font-mono text-xs resize-none"
                            data-testid="textarea-inter-private-key"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cole o conteúdo completo do arquivo .key gerado pelo portal Inter.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Webhook Key (opcional)</Label>
                        <div className="relative">
                          <Input
                            type="password"
                            value={interWebhookKey}
                            onChange={e => setInterWebhookKey(e.target.value)}
                            placeholder="Chave HMAC para validação de webhooks"
                            data-testid="input-inter-webhook-key"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 space-y-2">
                        <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">Como obter as credenciais:</p>
                        <ol className="text-xs text-orange-700 dark:text-orange-400 space-y-1 list-decimal list-inside">
                          <li>Acesse <strong>developers.inter.co</strong> e crie uma aplicação</li>
                          <li>Gere o certificado digital (baixe o .crt e o .key)</li>
                          <li>Copie o Client ID e Client Secret gerados</li>
                          <li>Informe sua chave PIX cadastrada no Inter para recebimento</li>
                        </ol>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => testInterMut.mutate()}
                        disabled={testInterMut.isPending || !interClientId || !interPixKey}
                        className="w-full"
                        data-testid="button-test-inter"
                      >
                        {testInterMut.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testando conexão...</>
                        ) : (
                          <><ShieldCheck className="h-4 w-4 mr-2" />Testar Conexão com Banco Inter</>
                        )}
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
