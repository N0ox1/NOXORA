import { db } from './index';
import { 
  tenants, barbershops, employees, services, clients, appointments,
  // type Tenant, type Barbershop, type Employee, type Service, type Client, type Appointment // Removido - não existem
} from './schema';
import { eq, and, desc, asc, between, like, sql } from 'drizzle-orm';
import { 
  type TenantFilters, type BarbershopFilters, type EmployeeFilters,
  type ServiceFilters, type ClientFilters, type AppointmentFilters,
  type PaginationOptions, type PaginatedResult
} from '@/types/core';

// Queries para Tenants
export async function getTenantById(id: string): Promise<any> {
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0] || null;
}

export async function getTenants(filters: TenantFilters = {}): Promise<any[]> {
  let query = db.select().from(tenants);
  
  const conditions = [];
  if (filters.plan) conditions.push(eq(tenants.plan, filters.plan));
  if (filters.status) conditions.push(eq(tenants.status, filters.status));
  if (filters.isActive !== undefined) conditions.push(eq(tenants.isActive, filters.isActive));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(tenants.createdAt));
}

// Queries para Barbershops
export async function getBarbershopById(id: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(barbershops)
    .where(and(eq(barbershops.id, id), eq(barbershops.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getBarbershopBySlug(slug: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(barbershops)
    .where(and(eq(barbershops.slug, slug), eq(barbershops.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getBarbershops(filters: BarbershopFilters): Promise<any[]> {
  const query = db.select().from(barbershops);
  
  const conditions = [eq(barbershops.tenantId, filters.tenantId)];
  if (filters.isActive !== undefined) conditions.push(eq(barbershops.isActive, filters.isActive));
  
  return await query
    .where(and(...conditions))
    .orderBy(asc(barbershops.name));
}

// Queries para Employees
export async function getEmployeeById(id: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getEmployees(filters: EmployeeFilters): Promise<any[]> {
  const query = db.select().from(employees);
  
  const conditions = [eq(employees.tenantId, filters.tenantId)];
  if (filters.barbershopId) conditions.push(eq(employees.barbershopId, filters.barbershopId));
  if (filters.role) conditions.push(eq(employees.role, filters.role));
  if (filters.active !== undefined) conditions.push(eq(employees.active, filters.active));
  
  return await query
    .where(and(...conditions))
    .orderBy(asc(employees.name));
}

// Queries para Services
export async function getServiceById(id: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getServices(filters: ServiceFilters): Promise<any[]> {
  const query = db.select().from(services);
  
  const conditions = [eq(services.tenantId, filters.tenantId)];
  if (filters.barbershopId) conditions.push(eq(services.barbershopId, filters.barbershopId));
  if (filters.isActive !== undefined) conditions.push(eq(services.isActive, filters.isActive));
  
  return await query
    .where(and(...conditions))
    .orderBy(asc(services.name));
}

// Queries para Clients
export async function getClientById(id: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getClients(filters: ClientFilters): Promise<any[]> {
  const query = db.select().from(clients);
  
  const conditions = [eq(clients.tenantId, filters.tenantId)];
  if (filters.name) conditions.push(like(clients.name, `%${filters.name}%`));
  if (filters.phone) conditions.push(like(clients.phone, `%${filters.phone}%`));
  
  return await query
    .where(and(...conditions))
    .orderBy(asc(clients.name));
}

// Queries para Appointments
export async function getAppointmentById(id: string, tenantId: string): Promise<any> {
  const result = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
    .limit(1);
  return result[0] || null;
}

export async function getAppointments(filters: AppointmentFilters): Promise<any[]> {
  const query = db.select().from(appointments);
  
  const conditions = [eq(appointments.tenantId, filters.tenantId)];
  if (filters.barbershopId) conditions.push(eq(appointments.barbershopId, filters.barbershopId));
  if (filters.employeeId) conditions.push(eq(appointments.employeeId, filters.employeeId));
  if (filters.clientId) conditions.push(eq(appointments.clientId, filters.clientId));
  if (filters.status) conditions.push(eq(appointments.status, filters.status));
  if (filters.startAt && filters.endAt) {
    conditions.push(between(appointments.startAt, filters.startAt, filters.endAt));
  }
  
  return await query
    .where(and(...conditions))
    .orderBy(asc(appointments.startAt));
}

// Queries com paginação
export async function getAppointmentsPaginated(
  filters: AppointmentFilters,
  pagination: PaginationOptions
): Promise<PaginatedResult<any>> {
  const { page, limit, sortBy = 'startAt', sortOrder = 'asc' } = pagination;
  const offset = (page - 1) * limit;
  
  // Query para contar total
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(appointments);
  
  const conditions = [eq(appointments.tenantId, filters.tenantId)];
  if (filters.barbershopId) conditions.push(eq(appointments.barbershopId, filters.barbershopId));
  if (filters.employeeId) conditions.push(eq(appointments.employeeId, filters.employeeId));
  if (filters.clientId) conditions.push(eq(appointments.clientId, filters.clientId));
  if (filters.status) conditions.push(eq(appointments.status, filters.status));
  if (filters.startAt && filters.endAt) {
    conditions.push(between(appointments.startAt, filters.startAt, filters.endAt));
  }
  
  const whereClause = and(...conditions);
  
  const [countResult] = await countQuery.where(whereClause);
  const total = countResult.count;
  
  // Query para dados
  let dataQuery = db.select().from(appointments).where(whereClause);
  
  // Aplicar ordenação
  if (sortBy === 'startAt') {
    dataQuery = (sortOrder === 'asc' 
      ? dataQuery.orderBy(asc(appointments.startAt))
      : dataQuery.orderBy(desc(appointments.startAt))) as any;
  } else if (sortBy === 'createdAt') {
    dataQuery = (sortOrder === 'asc'
      ? dataQuery.orderBy(asc(appointments.createdAt))
      : dataQuery.orderBy(desc(appointments.createdAt))) as any;
  }
  
  const data = await dataQuery.limit(limit).offset(offset);
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Queries para dashboard/estatísticas
export async function getTenantStats(tenantId: string) {
  const [barbershopCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(barbershops)
    .where(eq(barbershops.tenantId, tenantId));
  
  const [employeeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.tenantId, tenantId));
  
  const [clientCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(eq(clients.tenantId, tenantId));
  
  const [appointmentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.tenantId, tenantId));
  
  return {
    barbershops: barbershopCount.count,
    employees: employeeCount.count,
    clients: clientCount.count,
    appointments: appointmentCount.count,
  };
}

export async function getBarbershopStats(barbershopId: string, tenantId: string) {
  const [employeeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(and(eq(employees.barbershopId, barbershopId), eq(employees.tenantId, tenantId)));
  
  const [serviceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .where(and(eq(services.barbershopId, barbershopId), eq(services.tenantId, tenantId)));
  
  const [appointmentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(eq(appointments.barbershopId, barbershopId), eq(appointments.tenantId, tenantId)));
  
  return {
    employees: employeeCount.count,
    services: serviceCount.count,
    appointments: appointmentCount.count,
  };
}

// Queries para agendamentos por período
export async function getAppointmentsByDateRange(
  tenantId: string,
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.barbershopId, barbershopId),
        between(appointments.startAt, startDate, endDate)
      )
    )
    .orderBy(asc(appointments.startAt));
}

// Queries para funcionários disponíveis
export async function getAvailableEmployees(
  tenantId: string,
  barbershopId: string,
  date: Date
): Promise<any[]> {
  // Buscar funcionários ativos da barbearia
  const employees = await getEmployees({
    tenantId,
    barbershopId,
    active: true,
  });
  
  // Filtrar por disponibilidade (implementar lógica de horários)
  // Por enquanto, retorna todos os funcionários ativos
  return employees;
}


