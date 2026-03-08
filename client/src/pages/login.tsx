import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Eye, EyeOff, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings/public"], retry: false });
  const companyName = settings?.company_name || "Randoli Engenharia Solar";
  const logoUrl = settings?.logo_url;

  const loginBadgeText = settings?.login_badge_text || "Portal SaaS de Homologação";
  const loginHeadline = settings?.login_headline || "Gerencie projetos de energia solar de forma simples e eficiente";
  const loginHighlight = settings?.login_headline_highlight || "energia solar";
  const loginDescription = settings?.login_description || "Acompanhe cada etapa da homologação fotovoltaica, do orçamento à aprovação final, com total transparência.";
  const loginFeature1 = settings?.login_feature_1 || "Acompanhamento em tempo real de cada etapa";
  const loginFeature2 = settings?.login_feature_2 || "Documentos e ART centralizados no portal";
  const loginFeature3 = settings?.login_feature_3 || "Status atualizado automaticamente pela nossa equipe";
  const loginBgType = settings?.login_bg_type || "gradient";
  const loginBgImage = settings?.login_bg_image || "";

  const headlineNode = (() => {
    if (!loginHighlight || !loginHeadline.includes(loginHighlight)) return <>{loginHeadline}</>;
    const parts = loginHeadline.split(loginHighlight);
    return <>{parts[0]}<span className="text-sky-300">{loginHighlight}</span>{parts.slice(1).join(loginHighlight)}</>;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Erro ao entrar", description: err.message || "Credenciais inválidas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col p-12 relative overflow-hidden"
        style={loginBgType === "image" && loginBgImage
          ? { backgroundImage: `url(${loginBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: "linear-gradient(135deg, hsl(215 60% 15%) 0%, hsl(215 60% 10%) 50%, hsl(215 60% 5%) 100%)" }
        }
      >
        {/* Overlay for image bg */}
        {loginBgType === "image" && loginBgImage && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        )}
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -left-16 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />

        {/* Logo */}
        <div className="flex items-center gap-4 relative z-10 mb-auto">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
              <Zap className="h-7 w-7 text-white" />
            </div>
          )}
          <span className="text-white font-bold text-xl tracking-tight drop-shadow-sm">{companyName}</span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 backdrop-blur-md border border-sky-400/30 rounded-full px-4 py-1.5 text-xs text-sky-200 font-semibold uppercase tracking-wider mb-8 shadow-lg">
            <Zap className="h-3.5 w-3.5 fill-sky-400 text-sky-400" />
            {loginBadgeText}
          </div>
          
          <h1 className="text-4xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-6 drop-shadow-md">
            {headlineNode}
          </h1>
          
          <p className="text-lg text-sky-100/70 leading-relaxed mb-10 font-medium">
            {loginDescription}
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-5">
            {[
              { icon: CheckCircle, text: loginFeature1, color: "text-emerald-400" },
              { icon: ShieldCheck, text: loginFeature2, color: "text-sky-400" },
              { icon: Clock, text: loginFeature3, color: "text-amber-400" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <span className="text-base text-sky-50/90 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Partners strip */}
        {settings?.partners_enabled !== "false" && (
          <div className="relative z-10 mt-auto pt-10 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-6 font-bold">
              Trusted by leading solar installers
            </p>
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-12 items-center py-2">
                <PartnersList dark />
                <PartnersList dark />
              </div>
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Mobile logo */}
        <div className="flex flex-col items-center gap-3 mb-12 lg:hidden relative z-10">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{companyName}</h1>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Portal do Integrador</p>
          </div>
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Acesse sua conta</h2>
            <p className="text-muted-foreground font-medium mt-2">Gestão inteligente para sua empresa solar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold ml-1">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="nome.usuario"
                autoComplete="username"
                className="h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all duration-200"
                data-testid="input-login-username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
                <Link href="/esqueci-senha" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors" data-testid="link-forgot-password">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 bg-muted/30 border-muted-foreground/20 focus:bg-background pr-12 transition-all duration-200"
                  data-testid="input-login-password"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform" disabled={loading} data-testid="button-login-submit">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Autenticando...
                </div>
              ) : (
                "Entrar no Portal"
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                <span className="bg-background px-4 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-3 font-semibold border-muted-foreground/20 hover:bg-muted/50 transition-colors"
              disabled
              data-testid="button-login-google"
            >
              <SiGoogle className="h-5 w-5 text-[#4285F4]" />
              Google
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-muted-foreground mt-10">
            Ainda não é parceiro?{" "}
            <Link href="/cadastro" className="text-primary font-bold hover:underline underline-offset-4" data-testid="link-go-register">
              Cadastre sua empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PartnersList({ dark }: { dark?: boolean }) {
  const { data: partners } = useQuery<any[]>({ queryKey: ["/api/partners"] });

  if (!partners || partners.length === 0) return null;

  return (
    <>
      {partners.map((partner) => (
        <div
          key={partner.id}
          className={`flex-shrink-0 transition-all duration-300 ${dark ? "grayscale brightness-200 opacity-40 hover:opacity-70" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"}`}
          title={partner.name}
        >
          {partner.logoUrl ? (
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="h-10 w-auto object-contain max-w-[120px]"
            />
          ) : (
            <span className={`text-sm font-bold whitespace-nowrap ${dark ? "text-white/50" : "text-muted-foreground"}`}>{partner.name}</span>
          )}
        </div>
      ))}
    </>
  );
}
