import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Star,
  Settings,
  Zap,
  UserCog,
  LogOut,
  KanbanSquare,
  DollarSign,
  BarChart3,
  Settings2,
  TrendingUp,
  Shield,
  Calculator,
  Database,
  LineChart,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SECTION_OPERACIONAL = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projetos", url: "/projetos", icon: FolderOpen },
  { title: "Kanban", url: "/kanban", icon: KanbanSquare },
  { title: "Clientes", url: "/clientes", icon: Users },
];

const SECTION_FINANCEIRO = [
  { title: "Preços", url: "/precos", icon: DollarSign, roles: ["admin", "financeiro"] },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, roles: ["admin", "financeiro"] },
  { title: "Analytics", url: "/analytics", icon: TrendingUp, roles: ["admin", "financeiro", "engenharia"] },
];

const SECTION_AI = [
  { title: "Calculadora Solar", url: "/ai-calculator", icon: Calculator, roles: ["admin", "engenharia"] },
  { title: "Simulador", url: "/production-simulator", icon: LineChart, roles: ["admin", "engenharia"] },
  { title: "Equipamentos", url: "/equipment-db", icon: Database, roles: ["admin", "engenharia"] },
  { title: "Rel. Engenharia", url: "/engineering-report", icon: FileText, roles: ["admin", "engenharia"] },
];

const SECTION_ADMIN = [
  { title: "Parceiros", url: "/parceiros", icon: Star, roles: ["admin", "financeiro"] },
  { title: "Status", url: "/status-config", icon: Settings2, roles: ["admin"] },
  { title: "Usuários", url: "/usuarios", icon: UserCog, roles: ["admin"] },
  { title: "Auditoria", url: "/audit-log", icon: Shield, roles: ["admin"] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin", "financeiro"] },
];

function NavSection({
  items,
  location,
  userRole,
  unreadCount,
}: {
  items: { title: string; url: string; icon: any; roles?: string[] }[];
  location: string;
  userRole: string;
  unreadCount: number;
}) {
  const visible = items.filter(i => !i.roles || i.roles.includes(userRole));
  if (visible.length === 0) return null;
  return (
    <SidebarMenu>
      {visible.map(item => {
        const isActive = location === item.url;
        const showBadge = item.url === "/projetos" && unreadCount > 0;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              data-active={isActive}
              data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "group transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-none" 
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
            >
              <Link href={item.url} className="flex items-center w-full px-3 py-2">
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                )} />
                <span className="ml-3 flex-1">{item.title}</span>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] animate-pulse"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
                {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary opacity-50" />}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function UserFooter({ user, logout, roleLabel }: { user: any; logout: () => void; roleLabel: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1 py-2">
        <Avatar className="h-9 w-9 border border-sidebar-border shadow-sm">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold truncate leading-tight">{user?.name}</span>
          <div className="flex items-center mt-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-sidebar-accent/50 text-muted-foreground border-none">
              {roleLabel}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        onClick={logout}
        data-testid="button-admin-logout"
      >
        <LogOut className="h-4 w-4 mr-2" /> 
        <span className="font-medium">Encerrar Sessão</span>
      </Button>
    </div>
  );
}

export function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const { data: chatUnread } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread"],
    queryFn: () => apiRequest("GET", "/api/chat/unread").then(r => r.json()),
    refetchInterval: 30000,
  });

  const unreadCount = chatUnread?.count ?? 0;
  const companyName = settings?.company_name || "Randoli Engenharia";
  const logoUrl = settings?.logo_url;
  const userRole = user?.role ?? "";

  const roleLabel: Record<string, string> = {
    admin: "Administrador",
    engenharia: "Engenharia",
    financeiro: "Financeiro",
    integrador: "Integrador",
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3.5 group cursor-default">
          <div className="relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-10 object-contain rounded-xl shadow-md transition-transform group-hover:scale-105"
                data-testid="img-sidebar-logo"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Zap className="h-6 w-6 text-primary-foreground fill-current" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-sidebar animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-sidebar-foreground tracking-tight truncate leading-tight" data-testid="text-company-name">
              {companyName}
            </span>
            <span className="text-[11px] font-medium text-primary uppercase tracking-widest mt-0.5">Engenharia Solar</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <div className="space-y-6">
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Operacional</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavSection
                items={SECTION_OPERACIONAL}
                location={location}
                userRole={userRole}
                unreadCount={unreadCount}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {["admin", "financeiro"].includes(userRole) && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Financeiro</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_FINANCEIRO}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {["admin", "engenharia"].includes(userRole) && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">IA Solar</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_AI}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {["admin", "financeiro"].includes(userRole) && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_ADMIN}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6 bg-sidebar-accent/20 border-t border-sidebar-border mt-auto">
        <UserFooter 
          user={user} 
          logout={logout} 
          roleLabel={roleLabel[userRole] ?? "Usuário"} 
        />
      </SidebarFooter>
    </Sidebar>
  );
}
