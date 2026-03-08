import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Zap, User, Building2, ArrowLeft, CheckCircle2, ShieldCheck, Mail, Phone, Lock, Fingerprint, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatCpfCnpj, formatCep, formatPhone, lookupCep, validateCpfCnpj } from "@/lib/utils";
import { PasswordStrength } from "@/components/password-strength";

interface RegisterForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password: string;
  confirmPassword: string;
  company: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientType, setClientType] = useState<"PF" | "PJ">("PF");
  const [loading, setLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    name: "", username: "", email: "", phone: "",
    cpfCnpj: "", password: "", confirmPassword: "",
    company: "", rua: "", numero: "", bairro: "",
    cep: "", cidade: "", estado: "",
  });

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";

  const set = (k: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleCpfCnpj = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, cpfCnpj: formatCpfCnpj(e.target.value) }));

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }));

  const lookupCnpj = async (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!res.ok) { toast({ title: "CNPJ não encontrado", variant: "destructive" }); return; }
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        name: data.razao_social || prev.name,
        company: data.nome_fantasia || prev.company,
        rua: data.logradouro || prev.rua,
        numero: data.numero || prev.numero,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        cep: data.cep ? data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") : prev.cep,
        phone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : prev.phone,
      }));
      toast({ title: "CNPJ encontrado!", description: "Dados preenchidos automaticamente." });
    } catch { toast({ title: "Erro ao buscar CNPJ", variant: "destructive" }); }
    finally { setCnpjLoading(false); }
  };

  const handleCep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setForm(prev => ({ ...prev, cep: formatted }));
    const data = await lookupCep(formatted);
    if (data) {
      setForm(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (form.cpfCnpj) {
      const cpfCnpjError = validateCpfCnpj(form.cpfCnpj);
      if (cpfCnpjError !== true) {
        toast({ title: cpfCnpjError, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        username: form.username,
        password: form.password,
        name: clientType === "PJ" ? form.company || form.name : form.name,
        email: form.email,
        phone: form.phone,
        cpfCnpj: form.cpfCnpj,
        clientType,
        company: clientType === "PJ" ? form.company : undefined,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        cep: form.cep,
        cidade: form.cidade,
        estado: form.estado,
      });
      const user = await res.json();
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation("/portal");
    } catch (err: any) {
      toast({ title: "Erro ao criar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col lg:flex-row items-stretch">
      {/* Left Decoration / Info */}
      <div className="hidden lg:flex lg:w-1/3 flex-col justify-between p-12 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px]" />
        
        <Link href="/login" className="relative z-10 flex items-center gap-2 text-sm font-semibold text-sky-200 hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar para o login
        </Link>

        <div className="relative z-10 max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 mb-8">
            <Zap className="h-8 w-8 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-6">
            Junte-se à maior rede de integradores do Brasil
          </h2>
          <div className="space-y-6">
            {[
              { icon: ShieldCheck, title: "Segurança Total", desc: "Seus dados e projetos protegidos com criptografia de ponta." },
              { icon: Zap, title: "Agilidade", desc: "Aprovação de projetos em tempo recorde com auxílio de IA." },
              { icon: CheckCircle2, title: "Transparência", desc: "Acompanhe cada etapa da homologação em tempo real." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{item.title}</h3>
                  <p className="text-sky-100/60 text-xs leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
            © 2024 {companyName}
          </p>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto bg-background">
        <div className="w-full max-w-2xl space-y-8 py-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Crie sua conta</h1>
            <p className="text-muted-foreground font-medium">Preencha os dados abaixo para começar sua jornada.</p>
          </div>

          <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 space-y-1 py-6">
              <CardTitle className="text-xl">Informações de Cadastro</CardTitle>
              <CardDescription>Selecione o tipo de conta e preencha o formulário</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={clientType} onValueChange={v => setClientType(v as "PF" | "PJ")} className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
                    <TabsTrigger value="PF" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-pf">
                      <User className="h-4 w-4 mr-2" /> Pessoa Física
                    </TabsTrigger>
                    <TabsTrigger value="PJ" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-pj">
                      <Building2 className="h-4 w-4 mr-2" /> Pessoa Jurídica
                    </TabsTrigger>
                  </TabsList>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                  {/* Basic Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Fingerprint className="h-3.5 w-3.5" />
                      Dados Identificadores
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientType === "PJ" && (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-semibold">Razão Social *</Label>
                          <Input value={form.company} onChange={set("company")} placeholder="Empresa Solar Ltda" required={clientType === "PJ"} data-testid="input-company" className="h-11" />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{clientType === "PF" ? "Nome Completo *" : "Nome do Responsável *"}</Label>
                        <Input value={form.name} onChange={set("name")} placeholder="Ex: João da Silva" required data-testid="input-name" className="h-11" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{clientType === "PF" ? "CPF *" : "CNPJ *"}</Label>
                        <div className="flex gap-2">
                          <Input value={form.cpfCnpj} onChange={handleCpfCnpj} placeholder={clientType === "PF" ? "000.000.000-00" : "00.000.000/0001-00"} data-testid="input-cpfcnpj" className="h-11 flex-1" />
                          {clientType === "PJ" && (
                            <Button type="button" size="sm" variant="secondary" className="h-11 px-4 font-bold active:scale-[0.98] transition-transform" disabled={cnpjLoading} onClick={() => lookupCnpj(form.cpfCnpj)} data-testid="button-lookup-cnpj-register">
                              {cnpjLoading ? <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : "Consultar"}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">E-mail Corporativo *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" required data-testid="input-email" className="h-11 pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">WhatsApp / Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input value={form.phone} onChange={handlePhone} placeholder="(00) 00000-0000" data-testid="input-phone" className="h-11 pl-10" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <MapPin className="h-3.5 w-3.5" />
                      Localização
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">CEP</Label>
                        <Input value={form.cep} onChange={handleCep} placeholder="00000-000" maxLength={9} data-testid="input-cep" className="h-11" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-semibold">Logradouro / Rua</Label>
                        <Input value={form.rua} onChange={set("rua")} placeholder="Nome da rua" data-testid="input-rua" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Número</Label>
                        <Input value={form.numero} onChange={set("numero")} placeholder="123" data-testid="input-numero" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Bairro</Label>
                        <Input value={form.bairro} onChange={set("bairro")} placeholder="Seu bairro" data-testid="input-bairro" className="h-11" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Cidade</Label>
                          <Input value={form.cidade} onChange={set("cidade")} placeholder="Cidade" data-testid="input-cidade" className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">UF</Label>
                          <Input value={form.estado} onChange={set("estado")} placeholder="SP" maxLength={2} data-testid="input-estado" className="h-11 uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auth Section */}
                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Lock className="h-3.5 w-3.5" />
                      Segurança de Acesso
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-semibold">Nome de Usuário *</Label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">@</span>
                          <Input value={form.username} onChange={set("username")} placeholder="nome.sobrenome" required data-testid="input-username" className="h-11 pl-8" />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1">Este será seu login de acesso ao portal.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Senha *</Label>
                        <Input type="password" value={form.password} onChange={set("password")} placeholder="Mín. 6 caracteres" required data-testid="input-password" className="h-11" />
                        <PasswordStrength password={form.password} />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Confirmar Senha *</Label>
                        <Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repita a senha" required data-testid="input-confirm-password" className="h-11" />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all" disabled={loading} data-testid="button-register-submit">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Criando conta de parceiro...
                      </div>
                    ) : (
                      "Finalizar Cadastro"
                    )}
                  </Button>
                </form>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm font-medium text-muted-foreground mt-8">
            Já possui uma conta ativa?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4" data-testid="link-go-login">
              Entrar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

