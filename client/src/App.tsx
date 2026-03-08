import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { PortalSidebar } from "@/components/portal-sidebar";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import ClientsPage from "@/pages/clients";
import PartnersPage from "@/pages/partners";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import KanbanPage from "@/pages/kanban";
import PrecosPage from "@/pages/precos";
import RelatoriosPage from "@/pages/relatorios";
import PlanosPage from "@/pages/planos";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import PortalHomePage from "@/pages/portal/home";
import PortalProjetoPage from "@/pages/portal/projeto";
import PortalProjetosPage from "@/pages/portal/projetos";
import NovoProjetoPage from "@/pages/portal/novo-projeto";
import ContaPage from "@/pages/portal/conta";
import CompletarPerfilPage from "@/pages/completar-perfil";
import NotFound from "@/pages/not-found";
import StatusConfigPage from "@/pages/status-config";
import AuditLogPage from "@/pages/audit-log";
import AnalyticsPage from "@/pages/analytics";
import AiCalculatorPage from "@/pages/ai-calculator";
import EquipmentDbPage from "@/pages/equipment-db";
import ProductionSimulatorPage from "@/pages/production-simulator";
import EngineeringReportPage from "@/pages/engineering-report";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";

import type { ReactNode } from "react";

function RoleGuard({ allow, children }: { allow: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return <Redirect to="/" />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-3 w-64">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function AdminLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "17rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <GlobalSearch />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Portal Admin</span>
            <NotificationBell />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/projetos" component={ProjectsPage} />
              <Route path="/kanban" component={KanbanPage} />
              <Route path="/clientes" component={ClientsPage} />
              <Route path="/precos">
                <RoleGuard allow={["admin", "financeiro"]}><PrecosPage /></RoleGuard>
              </Route>
              <Route path="/relatorios">
                <RoleGuard allow={["admin", "financeiro"]}><RelatoriosPage /></RoleGuard>
              </Route>
              <Route path="/parceiros">
                <RoleGuard allow={["admin", "financeiro"]}><PartnersPage /></RoleGuard>
              </Route>
              <Route path="/usuarios">
                <RoleGuard allow={["admin"]}><UsersPage /></RoleGuard>
              </Route>
              <Route path="/configuracoes">
                <RoleGuard allow={["admin", "financeiro"]}><SettingsPage /></RoleGuard>
              </Route>
              <Route path="/status-config">
                <RoleGuard allow={["admin"]}><StatusConfigPage /></RoleGuard>
              </Route>
              <Route path="/audit-log">
                <RoleGuard allow={["admin"]}><AuditLogPage /></RoleGuard>
              </Route>
              <Route path="/analytics">
                <RoleGuard allow={["admin", "financeiro", "engenharia"]}><AnalyticsPage /></RoleGuard>
              </Route>
              <Route path="/ai-calculator">
                <RoleGuard allow={["admin", "engenharia"]}><AiCalculatorPage /></RoleGuard>
              </Route>
              <Route path="/equipment-db">
                <RoleGuard allow={["admin", "engenharia"]}><EquipmentDbPage /></RoleGuard>
              </Route>
              <Route path="/production-simulator">
                <RoleGuard allow={["admin", "engenharia"]}><ProductionSimulatorPage /></RoleGuard>
              </Route>
              <Route path="/engineering-report">
                <RoleGuard allow={["admin", "engenharia"]}><EngineeringReportPage /></RoleGuard>
              </Route>
              <Route><Redirect to="/" /></Route>
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PortalLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <PortalSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-portal-sidebar-toggle" />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground font-medium hidden sm:block">Portal do Integrador</span>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/portal" component={PortalHomePage} />
              <Route path="/portal/novo-projeto" component={NovoProjetoPage} />
              <Route path="/portal/projetos" component={PortalProjetosPage} />
              <Route path="/portal/projetos/:id" component={PortalProjetoPage} />
              <Route path="/portal/conta" component={ContaPage} />
              <Route><Redirect to="/portal" /></Route>
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <LoadingScreen />;

  const publicPaths = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha", "/planos"];
  const isPublicPath = publicPaths.some(p => location === p || location.startsWith(p + "?"));

  if (location === "/planos") {
    return <PlanosPage />;
  }

  if (location === "/completar-perfil") {
    if (!user) return <Redirect to="/login" />;
    return <CompletarPerfilPage />;
  }

  if (isPublicPath) {
    if (user) {
      if (user.needsProfileCompletion) return <Redirect to="/completar-perfil" />;
      const isAdminRole = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);
      return <Redirect to={isAdminRole ? "/" : "/portal"} />;
    }
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/cadastro" component={RegisterPage} />
        <Route path="/esqueci-senha" component={ForgotPasswordPage} />
        <Route path="/redefinir-senha" component={ResetPasswordPage} />
      </Switch>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.needsProfileCompletion) {
    return <Redirect to="/completar-perfil" />;
  }

  const isAdminRole = ["admin", "engenharia", "financeiro", "tecnico"].includes(user.role);

  if (isAdminRole) {
    if (location.startsWith("/portal")) {
      return <Redirect to="/" />;
    }
    return <AdminLayout />;
  }

  if (!location.startsWith("/portal")) {
    return <Redirect to="/portal" />;
  }
  return <PortalLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
