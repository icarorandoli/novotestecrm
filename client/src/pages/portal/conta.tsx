import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save, MapPin } from "lucide-react";
import { formatPhone } from "@/lib/utils";

function formatCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.replace(/(\d{5})(\d{1,3})/, "$1-$2") : d;
}

export default function ContaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    cpfCnpj: (user as any)?.cpfCnpj || "",
    rua: (user as any)?.rua || "",
    numero: (user as any)?.numero || "",
    bairro: (user as any)?.bairro || "",
    cep: (user as any)?.cep || "",
    cidade: (user as any)?.cidade || "",
    estado: (user as any)?.estado || "",
  });

  const [cepLoading, setCepLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/auth/me", data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/me"], updated);
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" }),
  });

  const handleCepChange = async (raw: string) => {
    const fmt = formatCep(raw);
    setProfile(p => ({ ...p, cep: fmt }));
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await r.json();
        if (!data.erro) {
          setProfile(p => ({
            ...p,
            rua: data.logradouro || p.rua,
            bairro: data.bairro || p.bairro,
            cidade: data.localidade || p.cidade,
            estado: data.uf || p.estado,
          }));
        }
      } catch {
        toast({ title: "Não foi possível buscar o CEP", description: "Verifique o número e tente novamente.", variant: "destructive" });
      }
      setCepLoading(false);
    }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate(profile);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    updateMut.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Minha Conta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas informações de cadastro</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Usuário:</span>
              <span className="font-mono font-medium">{user?.username}</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${user?.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {user?.role === "admin" ? "Administrador" : "Integrador"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  data-testid="input-profile-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  data-testid="input-profile-phone"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CPF / CNPJ</Label>
                <Input
                  value={profile.cpfCnpj}
                  onChange={e => setProfile(p => ({ ...p, cpfCnpj: e.target.value }))}
                  placeholder="000.000.000-00"
                  data-testid="input-profile-cpfcnpj"
                />
              </div>
              {user?.clientType === "PJ" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Empresa</Label>
                  <Input
                    value={profile.company}
                    onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                    data-testid="input-profile-company"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium flex items-center gap-1.5 mb-3">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Endereço
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input
                    value={profile.cep}
                    onChange={e => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    data-testid="input-profile-cep"
                  />
                  {cepLoading && <p className="text-xs text-muted-foreground">Buscando...</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input
                    value={profile.bairro}
                    onChange={e => setProfile(p => ({ ...p, bairro: e.target.value }))}
                    placeholder="Bairro"
                    data-testid="input-profile-bairro"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rua / Logradouro</Label>
                  <Input
                    value={profile.rua}
                    onChange={e => setProfile(p => ({ ...p, rua: e.target.value }))}
                    placeholder="Nome da rua"
                    data-testid="input-profile-rua"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input
                    value={profile.numero}
                    onChange={e => setProfile(p => ({ ...p, numero: e.target.value }))}
                    placeholder="123"
                    data-testid="input-profile-numero"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input
                    value={profile.cidade}
                    onChange={e => setProfile(p => ({ ...p, cidade: e.target.value }))}
                    placeholder="Cidade"
                    data-testid="input-profile-cidade"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado (UF)</Label>
                  <Input
                    value={profile.estado}
                    onChange={e => setProfile(p => ({ ...p, estado: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="SP"
                    maxLength={2}
                    data-testid="input-profile-estado"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={updateMut.isPending} data-testid="button-save-profile">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {updateMut.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                data-testid="input-current-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Mín. 6 caracteres"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                  data-testid="input-confirm-new-password"
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={updateMut.isPending} data-testid="button-change-password">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              {updateMut.isPending ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
