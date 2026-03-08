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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

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
              data-active={isActive}
              data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Link href={item.url}>
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.title}</span>
                {showBadge && (
                  <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-orange-500 text-white text-[10px] font-bold px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function UserAvatar({ name }: { name?: string }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map(n => n[0])
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary-foreground">{initials}</span>
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
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-9 w-9 object-contain rounded-md"
              data-testid="img-sidebar-logo"
            />
          ) : (
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate" data-testid="text-company-name">
              {companyName}
            </span>
            <span className="text-xs text-muted-foreground">Painel Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel>Operacional</SidebarGroupLabel>
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
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_FINANCEIRO}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {["admin", "engenharia"].includes(userRole) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>IA Solar</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_AI}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {["admin", "financeiro"].includes(userRole) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavSection
                  items={SECTION_ADMIN}
                  location={location}
                  userRole={userRole}
                  unreadCount={unreadCount}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <UserAvatar name={user?.name} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate">{user?.name}</span>
            <span className="text-[11px] text-muted-foreground">{roleLabel[userRole] ?? "Usuário"}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={logout}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
