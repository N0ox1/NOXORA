import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, pgEnum, varchar, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums para os schemas
export const tenantPlanEnum = pgEnum('tenant_plan', ['STARTER', 'PRO', 'SCALE']);
export const tenantStatusEnum = pgEnum('tenant_status', ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']);
export const employeeRoleEnum = pgEnum('employee_role', ['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['CONFIRMED', 'CANCELED', 'NO_SHOW', 'DONE']);

// Tabela de tenants
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: tenantPlanEnum('plan').notNull().default('STARTER'),
  status: tenantStatusEnum('status').notNull().default('ACTIVE'),
  domain: text('domain'),
  settings: jsonb('settings').$type<Record<string, any>>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de barbearias
export const barbershops = pgTable('barbershops', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de funcionários
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id),
  name: text('name').notNull(),
  role: employeeRoleEnum('role').notNull().default('BARBER'),
  email: text('email'),
  phone: text('phone'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de serviços
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id),
  name: text('name').notNull(),
  description: text('description'),
  durationMin: integer('duration_min').notNull(), // em minutos
  priceCents: integer('price_cents').notNull(), // em centavos
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de clientes
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de agendamentos
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  barbershopId: uuid('barbershop_id').notNull().references(() => barbershops.id),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: appointmentStatusEnum('status').notNull().default('CONFIRMED'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de logs de auditoria
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 256 }).primaryKey(),
    tenantId: varchar('tenant_id', { length: 256 }).notNull(),
    actorId: varchar('actor_id', { length: 256 }).notNull(),
    action: varchar('action', { length: 256 }).notNull(), // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    entity: varchar('entity', { length: 256 }).notNull(), // e.g., 'appointment', 'user', 'barbershop'
    entityId: varchar('entity_id', { length: 256 }).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    actorType: varchar('actor_type', { length: 50 }), // 'user', 'system', 'api'
    actorName: varchar('actor_name', { length: 256 }),
    actorEmail: varchar('actor_email', { length: 256 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 512 }),
    sessionId: varchar('session_id', { length: 256 }),
    requestId: varchar('request_id', { length: 256 }),
    changes: jsonb('changes'), // JSON array of { field, old_value, new_value }
    metadata: jsonb('metadata'), // Additional context
    severity: varchar('severity', { length: 50 }), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status: varchar('status', { length: 50 }), // 'SUCCESS', 'FAILURE', 'PENDING'
    errorMessage: text('error_message'),
    stackTrace: text('stack_trace'),
  },
  (table) => {
    return {
      tenantIdIdx: index('audit_tenant_id_idx').on(table.tenantId),
      actorIdIdx: index('audit_actor_id_idx').on(table.actorId),
      entityIdx: index('audit_entity_idx').on(table.entity),
      entityIdIdx: index('audit_entity_id_idx').on(table.entityId),
      tsIdx: index('audit_ts_idx').on(table.ts),
      actionIdx: index('audit_action_idx').on(table.action),
      severityIdx: index('audit_severity_idx').on(table.severity),
    };
  }
);

// Relações
export const tenantsRelations = relations(tenants, ({ many }) => ({
  barbershops: many(barbershops),
  employees: many(employees),
  services: many(services),
  clients: many(clients),
  appointments: many(appointments),
}));

export const barbershopsRelations = relations(barbershops, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [barbershops.tenantId],
    references: [tenants.id],
  }),
  employees: many(employees),
  services: many(services),
  appointments: many(appointments),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [employees.tenantId],
    references: [tenants.id],
  }),
  barbershop: one(barbershops, {
    fields: [employees.barbershopId],
    references: [barbershops.id],
  }),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  barbershop: one(barbershops, {
    fields: [services.barbershopId],
    references: [barbershops.id],
  }),
  appointments: many(appointments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [clients.tenantId],
    references: [tenants.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [appointments.tenantId],
    references: [tenants.id],
  }),
  barbershop: one(barbershops, {
    fields: [appointments.barbershopId],
    references: [barbershops.id],
  }),
  employee: one(employees, {
    fields: [appointments.employeeId],
    references: [employees.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

// Relação para logs de auditoria
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));
