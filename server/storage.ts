import {
  users, clients, projects, partners, siteSettings, documents, timeline,
  pricingRanges, clientPricing, chatMessages, statusConfigs, notifications, auditLogs,
  solarIrradiation, solarPanels, solarInverters,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Partner, type InsertPartner,
  type SiteSetting,
  type Document, type InsertDocument,
  type Timeline, type InsertTimeline,
  type PricingRange, type InsertPricingRange,
  type ClientPricing, type InsertClientPricing,
  type ChatMessage, type InsertChatMessage,
  type StatusConfig,
  type Notification, type InsertNotification,
  type AuditLog, type InsertAuditLog,
  type SolarIrradiation, type InsertSolarIrradiation,
  type SolarPanel, type InsertSolarPanel,
  type SolarInverter, type InsertSolarInverter,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, isNull, not, gte, lte, and, or, ilike } from "drizzle-orm";

export type IntegradorInfo = {
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
};

export type ProjectWithIntegrador = Project & {
  client: Client | null;
  integrador: IntegradorInfo | null;
};

export interface IStorage {
  // Users / Auth
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Projects
  getProjects(): Promise<ProjectWithIntegrador[]>;
  getArchivedProjects(): Promise<ProjectWithIntegrador[]>;
  getProjectsByClient(clientId: string): Promise<ProjectWithIntegrador[]>;
  getProject(id: string): Promise<ProjectWithIntegrador | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  // Documents
  getDocumentsByProject(projectId: string): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Timeline
  getTimelineByProject(projectId: string): Promise<Timeline[]>;
  addTimelineEntry(entry: InsertTimeline): Promise<Timeline>;

  // Partners
  getPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<void>;

  // Site Settings
  getSiteSettings(): Promise<SiteSetting[]>;
  setSiteSetting(key: string, value: string): Promise<SiteSetting>;

  // Pricing Ranges
  getPricingRanges(): Promise<PricingRange[]>;
  getPricingRangeById(id: string): Promise<PricingRange | undefined>;
  getPriceForKwp(kwp: number): Promise<{ range: PricingRange; price: number } | null>;
  createPricingRange(range: InsertPricingRange): Promise<PricingRange>;
  updatePricingRange(id: string, range: Partial<InsertPricingRange>): Promise<PricingRange | undefined>;
  deletePricingRange(id: string): Promise<void>;

  // Client Pricing (Promotional)
  getClientPricing(clientId: string, rangeId?: string | null): Promise<ClientPricing | undefined>;
  getAllClientPricing(): Promise<(ClientPricing & { clientName: string; rangeLabel?: string })[]>;
  setClientPricing(data: InsertClientPricing): Promise<ClientPricing>;
  deleteClientPricing(id: string): Promise<void>;

  // Financial Stats
  getFinancialStats(): Promise<{ todayTotal: number; monthTotal: number; paidCount: number; pendingTotal: number }>;
  getFinancialProjects(filter: "today" | "month" | "paid" | "pending"): Promise<(Project & { client: Client | null })[]>;

  // Chat Messages
  getChatMessages(projectId: string): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  markChatMessagesRead(projectId: string, role: "admin" | "integrador"): Promise<void>;
  getUnreadChatCount(userId: string, role: string): Promise<number>;

  // Notifications
  getNotifications(limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;

  // Audit Logs
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, entityType?: string): Promise<AuditLog[]>;

  // Search
  searchAll(q: string): Promise<{ projects: any[]; clients: any[] }>;

  // AI — Solar Equipment & Irradiation
  getSolarIrradiation(): Promise<SolarIrradiation[]>;
  getSolarIrradiationByCity(city: string, state: string): Promise<SolarIrradiation | undefined>;
  createSolarIrradiation(data: InsertSolarIrradiation): Promise<SolarIrradiation>;
  getSolarPanels(): Promise<SolarPanel[]>;
  createSolarPanel(data: InsertSolarPanel): Promise<SolarPanel>;
  updateSolarPanel(id: string, data: Partial<InsertSolarPanel>): Promise<SolarPanel | undefined>;
  deleteSolarPanel(id: string): Promise<void>;
  getSolarInverters(): Promise<SolarInverter[]>;
  createSolarInverter(data: InsertSolarInverter): Promise<SolarInverter>;
  updateSolarInverter(id: string, data: Partial<InsertSolarInverter>): Promise<SolarInverter | undefined>;
  deleteSolarInverter(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ── Users ──
  async getUser(id: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.username, username));
    return u;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.googleId, googleId));
    return u;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [u] = await db.insert(users).values(user).returning();
    return u;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [u] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return u;
  }
  async deleteUser(id: string): Promise<void> {
    // Desvincular clientes ligados a este usuário antes de deletar (evita FK constraint)
    await db.update(clients).set({ userId: null }).where(eq(clients.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  // ── Clients ──
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }
  async getClient(id: string): Promise<Client | undefined> {
    const [c] = await db.select().from(clients).where(eq(clients.id, id));
    return c;
  }
  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [c] = await db.select().from(clients).where(eq(clients.userId, userId));
    return c;
  }
  async createClient(client: InsertClient): Promise<Client> {
    const [c] = await db.insert(clients).values(client).returning();
    return c;
  }
  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [c] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return c;
  }
  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // ── Projects ──
  private async enrichWithIntegrador(rows: { projects: Project; clients: Client | null }[]): Promise<ProjectWithIntegrador[]> {
    const result: ProjectWithIntegrador[] = [];
    for (const r of rows) {
      let integrador: IntegradorInfo | null = null;
      if (r.clients?.userId) {
        const [u] = await db.select({
          name: users.name,
          email: users.email,
          cpfCnpj: users.cpfCnpj,
          rua: users.rua,
          numero: users.numero,
          bairro: users.bairro,
          cep: users.cep,
          cidade: users.cidade,
          estado: users.estado,
        }).from(users).where(eq(users.id, r.clients.userId));
        if (u) integrador = {
          name: u.name,
          email: u.email,
          cpfCnpj: u.cpfCnpj,
          rua: u.rua,
          numero: u.numero,
          bairro: u.bairro,
          cep: u.cep,
          cidade: u.cidade,
          estado: u.estado,
        };
      }
      result.push({ ...r.projects, client: r.clients ?? null, integrador });
    }
    return result;
  }

  async getProjects(): Promise<ProjectWithIntegrador[]> {
    const rows = await db.select().from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.archived, false))
      .orderBy(desc(projects.createdAt));
    return this.enrichWithIntegrador(rows);
  }

  async getArchivedProjects(): Promise<ProjectWithIntegrador[]> {
    const rows = await db.select().from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.archived, true))
      .orderBy(desc(projects.updatedAt));
    return this.enrichWithIntegrador(rows);
  }

  async getProjectsByClient(clientId: string): Promise<ProjectWithIntegrador[]> {
    const rows = await db.select().from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));
    return this.enrichWithIntegrador(rows);
  }
  async getProject(id: string): Promise<ProjectWithIntegrador | undefined> {
    const [r] = await db.select().from(projects).leftJoin(clients, eq(projects.clientId, clients.id)).where(eq(projects.id, id));
    if (!r) return undefined;
    const [enriched] = await this.enrichWithIntegrador([r]);
    return enriched;
  }
  async createProject(project: InsertProject): Promise<Project> {
    const [{ total }] = await db.select({ total: count() }).from(projects);
    const ticketNumber = `RS-${String(Number(total) + 1).padStart(4, "0")}`;
    const [p] = await db.insert(projects).values({ ...project, ticketNumber }).returning();
    return p;
  }
  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [p] = await db.update(projects).set({ ...project, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return p;
  }
  async deleteProject(id: string): Promise<void> {
    await db.delete(timeline).where(eq(timeline.projectId, id));
    await db.delete(documents).where(eq(documents.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // ── Documents ──
  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.projectId, projectId)).orderBy(desc(documents.createdAt));
  }
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [d] = await db.insert(documents).values(doc).returning();
    return d;
  }
  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // ── Timeline ──
  async getTimelineByProject(projectId: string): Promise<Timeline[]> {
    return db.select().from(timeline).where(eq(timeline.projectId, projectId)).orderBy(desc(timeline.createdAt));
  }
  async addTimelineEntry(entry: InsertTimeline): Promise<Timeline> {
    const [t] = await db.insert(timeline).values(entry).returning();
    return t;
  }

  // ── Partners ──
  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners).orderBy(partners.sortOrder);
  }
  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [p] = await db.insert(partners).values(partner).returning();
    return p;
  }
  async updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [p] = await db.update(partners).set(partner).where(eq(partners.id, id)).returning();
    return p;
  }
  async deletePartner(id: string): Promise<void> {
    await db.delete(partners).where(eq(partners.id, id));
  }

  // ── Site Settings ──
  async getSiteSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }
  async setSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const [s] = await db
      .insert(siteSettings).values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } })
      .returning();
    return s;
  }

  // ── Pricing Ranges ──
  async getPricingRanges(): Promise<PricingRange[]> {
    return db.select().from(pricingRanges).orderBy(pricingRanges.sortOrder);
  }
  async getPricingRangeById(id: string): Promise<PricingRange | undefined> {
    const [r] = await db.select().from(pricingRanges).where(eq(pricingRanges.id, id));
    return r;
  }
  async getPriceForKwp(kwp: number): Promise<{ range: PricingRange; price: number } | null> {
    const ranges = await db.select().from(pricingRanges)
      .where(eq(pricingRanges.active, true))
      .orderBy(pricingRanges.sortOrder);
    const match = ranges.find(r => kwp >= Number(r.minKwp) && kwp <= Number(r.maxKwp));
    if (!match) return null;
    return { range: match, price: Number(match.price) };
  }
  async createPricingRange(range: InsertPricingRange): Promise<PricingRange> {
    const [r] = await db.insert(pricingRanges).values(range).returning();
    return r;
  }
  async updatePricingRange(id: string, range: Partial<InsertPricingRange>): Promise<PricingRange | undefined> {
    const [r] = await db.update(pricingRanges).set(range).where(eq(pricingRanges.id, id)).returning();
    return r;
  }
  async deletePricingRange(id: string): Promise<void> {
    await db.delete(pricingRanges).where(eq(pricingRanges.id, id));
  }

  // ── Client Pricing (Promocional) ──
  async getClientPricing(clientId: string, rangeId?: string | null): Promise<ClientPricing | undefined> {
    const conditions = [eq(clientPricing.clientId, clientId), eq(clientPricing.active, true)];
    if (rangeId) conditions.push(eq(clientPricing.rangeId, rangeId));
    else conditions.push(isNull(clientPricing.rangeId));
    const [cp] = await db.select().from(clientPricing).where(and(...conditions));
    return cp;
  }
  async getAllClientPricing(): Promise<(ClientPricing & { clientName: string; rangeLabel?: string })[]> {
    const rows = await db.select().from(clientPricing)
      .leftJoin(clients, eq(clientPricing.clientId, clients.id))
      .leftJoin(pricingRanges, eq(clientPricing.rangeId, pricingRanges.id))
      .orderBy(desc(clientPricing.createdAt));
    return rows.map(r => ({
      ...r.client_pricing,
      clientName: r.clients?.name || "—",
      rangeLabel: r.pricing_ranges?.label || undefined,
    }));
  }
  async setClientPricing(data: InsertClientPricing): Promise<ClientPricing> {
    // Deactivate existing promotional price for this client + same range
    const deactivateWhere = data.rangeId
      ? and(eq(clientPricing.clientId, data.clientId), eq(clientPricing.rangeId, data.rangeId))
      : and(eq(clientPricing.clientId, data.clientId), isNull(clientPricing.rangeId));
    await db.update(clientPricing).set({ active: false }).where(deactivateWhere!);
    const [cp] = await db.insert(clientPricing).values(data).returning();
    return cp;
  }
  async deleteClientPricing(id: string): Promise<void> {
    await db.delete(clientPricing).where(eq(clientPricing.id, id));
  }

  // ── Financial Stats ──
  async getFinancialStats(): Promise<{ todayTotal: number; monthTotal: number; paidCount: number; pendingTotal: number }> {
    const allProjectsList = await db.select().from(projects).where(eq(projects.archived, false));
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayTotal = 0;
    let monthTotal = 0;
    let paidCount = 0;
    let pendingTotal = 0;

    const parseValor = (v: string | null) => {
      if (!v) return 0;
      return parseFloat(v.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
    };

    for (const p of allProjectsList) {
      if (p.paymentStatus === "approved" && p.valor) {
        const val = parseValor(p.valor);
        paidCount++;
        if (p.updatedAt && p.updatedAt >= monthStart) monthTotal += val;
        if (p.updatedAt && p.updatedAt >= todayStart) todayTotal += val;
      } else if (p.paymentStatus !== "approved" && p.valor) {
        pendingTotal += parseValor(p.valor);
      }
    }
    return { todayTotal, monthTotal, paidCount, pendingTotal };
  }

  async getFinancialProjects(filter: "today" | "month" | "paid" | "pending"): Promise<(Project & { client: Client | null })[]> {
    const allProjects = await db.select().from(projects).where(eq(projects.archived, false)).orderBy(projects.updatedAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered: typeof allProjects;
    if (filter === "today") {
      filtered = allProjects.filter(p => p.paymentStatus === "approved" && p.updatedAt && p.updatedAt >= todayStart);
    } else if (filter === "month") {
      filtered = allProjects.filter(p => p.paymentStatus === "approved" && p.updatedAt && p.updatedAt >= monthStart);
    } else if (filter === "paid") {
      filtered = allProjects.filter(p => p.paymentStatus === "approved");
    } else {
      filtered = allProjects.filter(p => p.paymentStatus !== "approved" && p.valor);
    }

    const clientList = await db.select().from(clients);
    const clientMap = new Map(clientList.map(c => [c.id, c]));
    return filtered.map(p => ({ ...p, client: clientMap.get(p.clientId ?? "") ?? null })).reverse();
  }

  // ── Chat ──
  async getChatMessages(projectId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const [m] = await db.insert(chatMessages).values(msg).returning();
    return m;
  }

  async markChatMessagesRead(projectId: string, role: "admin" | "integrador"): Promise<void> {
    if (role === "admin") {
      await db.update(chatMessages).set({ readByAdmin: true })
        .where(eq(chatMessages.projectId, projectId));
    } else {
      await db.update(chatMessages).set({ readByIntegrador: true })
        .where(eq(chatMessages.projectId, projectId));
    }
  }

  async getStatusConfigs(): Promise<StatusConfig[]> {
    return db.select().from(statusConfigs).orderBy(statusConfigs.sortOrder);
  }

  async upsertStatusConfig(key: string, data: Partial<{ label: string; color: string; showInKanban: boolean; sortOrder: number }>): Promise<StatusConfig> {
    const existing = await db.select().from(statusConfigs).where(eq(statusConfigs.key, key));
    if (existing.length > 0) {
      const [updated] = await db.update(statusConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(statusConfigs.key, key))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(statusConfigs)
        .values({ key, label: data.label ?? key, color: data.color ?? "slate", showInKanban: data.showInKanban ?? true, sortOrder: data.sortOrder ?? 0 })
        .returning();
      return inserted;
    }
  }

  async seedStatusConfigs(defaults: { key: string; label: string; color: string; showInKanban: boolean; sortOrder: number }[]): Promise<void> {
    const existing = await db.select().from(statusConfigs);
    if (existing.length > 0) return;
    for (const d of defaults) {
      await db.insert(statusConfigs).values(d).onConflictDoNothing();
    }
  }

  async getUnreadChatCount(userId: string, role: string): Promise<number> {
    const isAdmin = ["admin", "engenharia", "financeiro"].includes(role);
    const allMessages = await db.select().from(chatMessages);
    if (isAdmin) {
      return allMessages.filter(m => !m.readByAdmin && m.senderRole !== "admin" && m.senderRole !== "engenharia" && m.senderRole !== "financeiro").length;
    } else {
      const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
      if (!client) return 0;
      const userProjects = await db.select().from(projects).where(eq(projects.clientId, client.id));
      const projectIds = userProjects.map(p => p.id);
      return allMessages.filter(m => projectIds.includes(m.projectId) && !m.readByIntegrador && ["admin", "engenharia", "financeiro"].includes(m.senderRole)).length;
    }
  }

  // ── Notifications ──
  async getNotifications(limit = 50): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadNotificationCount(): Promise<number> {
    const result = await db.select({ cnt: count() }).from(notifications).where(isNull(notifications.readAt));
    return result[0]?.cnt ?? 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(data).returning();
    return notif;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ readAt: new Date() }).where(isNull(notifications.readAt));
  }

  // ── Audit Logs ──
  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs(limit = 100, entityType?: string): Promise<AuditLog[]> {
    const q = db.select().from(auditLogs);
    if (entityType) {
      return q.where(eq(auditLogs.entityType, entityType)).orderBy(desc(auditLogs.createdAt)).limit(limit);
    }
    return q.orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  // ── Search ──
  async searchAll(q: string): Promise<{ projects: any[]; clients: any[] }> {
    const term = `%${q}%`;
    const [matchedProjects, matchedClients] = await Promise.all([
      db.select({
        id: projects.id,
        ticketNumber: projects.ticketNumber,
        title: projects.title,
        status: projects.status,
        clientId: projects.clientId,
        potencia: projects.potencia,
        numeroInstalacao: projects.numeroInstalacao,
        createdAt: projects.createdAt,
      })
        .from(projects)
        .where(
          and(
            eq(projects.archived, false),
            or(
              ilike(projects.title, term),
              ilike(projects.ticketNumber, term),
              ilike(projects.numeroInstalacao, term),
              ilike(projects.nomeCliente, term),
              ilike(projects.cpfCnpjCliente, term),
            )
          )
        )
        .limit(10),
      db.select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        cpfCnpj: clients.cpfCnpj,
        company: clients.company,
        type: clients.type,
      })
        .from(clients)
        .where(
          or(
            ilike(clients.name, term),
            ilike(clients.email, term),
            ilike(clients.cpfCnpj, term),
            ilike(clients.company, term),
          )
        )
        .limit(10),
    ]);
    return { projects: matchedProjects, clients: matchedClients };
  }

  // ── AI — Solar Irradiation ──
  async getSolarIrradiation(): Promise<SolarIrradiation[]> {
    return db.select().from(solarIrradiation).orderBy(solarIrradiation.state, solarIrradiation.city);
  }
  async getSolarIrradiationByCity(city: string, state: string): Promise<SolarIrradiation | undefined> {
    const [r] = await db.select().from(solarIrradiation)
      .where(and(ilike(solarIrradiation.city, city), ilike(solarIrradiation.state, state)));
    return r;
  }
  async createSolarIrradiation(data: InsertSolarIrradiation): Promise<SolarIrradiation> {
    const [r] = await db.insert(solarIrradiation).values(data).returning();
    return r;
  }

  // ── AI — Solar Panels ──
  async getSolarPanels(): Promise<SolarPanel[]> {
    return db.select().from(solarPanels).orderBy(desc(solarPanels.powerW));
  }
  async createSolarPanel(data: InsertSolarPanel): Promise<SolarPanel> {
    const [r] = await db.insert(solarPanels).values(data).returning();
    return r;
  }
  async updateSolarPanel(id: string, data: Partial<InsertSolarPanel>): Promise<SolarPanel | undefined> {
    const [r] = await db.update(solarPanels).set(data).where(eq(solarPanels.id, id)).returning();
    return r;
  }
  async deleteSolarPanel(id: string): Promise<void> {
    await db.delete(solarPanels).where(eq(solarPanels.id, id));
  }

  // ── AI — Solar Inverters ──
  async getSolarInverters(): Promise<SolarInverter[]> {
    return db.select().from(solarInverters).orderBy(solarInverters.powerKw);
  }
  async createSolarInverter(data: InsertSolarInverter): Promise<SolarInverter> {
    const [r] = await db.insert(solarInverters).values(data).returning();
    return r;
  }
  async updateSolarInverter(id: string, data: Partial<InsertSolarInverter>): Promise<SolarInverter | undefined> {
    const [r] = await db.update(solarInverters).set(data).where(eq(solarInverters.id, id)).returning();
    return r;
  }
  async deleteSolarInverter(id: string): Promise<void> {
    await db.delete(solarInverters).where(eq(solarInverters.id, id));
  }
}

export const storage = new DatabaseStorage();
