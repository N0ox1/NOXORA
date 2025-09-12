// Tipos baseados no core.json
export type TenantPlan = 'STARTER' | 'PRO' | 'SCALE';
export type TenantStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
export type EmployeeRole = 'OWNER' | 'MANAGER' | 'BARBER' | 'ASSISTANT';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'NO_SHOW' | 'DONE';

// Interfaces principais
export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  domain?: string;
  settings?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barbershop {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  tenantId: string;
  barbershopId: string;
  name: string;
  role: EmployeeRole;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  tenantId: string;
  barbershopId: string;
  name: string;
  description?: string;
  durationMin: number;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  tenantId: string;
  barbershopId: string;
  employeeId: string;
  clientId: string;
  serviceId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para criação (sem IDs e timestamps)
export type CreateTenant = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateBarbershop = Omit<Barbershop, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateEmployee = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateService = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateAppointment = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;

// Tipos para atualização (parciais)
export type UpdateTenant = Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateBarbershop = Partial<Omit<Barbershop, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateEmployee = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateService = Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateClient = Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateAppointment = Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>;

// Tipos para consultas com relacionamentos
export interface BarbershopWithRelations extends Barbershop {
  tenant: Tenant;
  employees: Employee[];
  services: Service[];
  appointments: Appointment[];
}

export interface EmployeeWithRelations extends Employee {
  tenant: Tenant;
  barbershop: Barbershop;
  appointments: Appointment[];
}

export interface ServiceWithRelations extends Service {
  tenant: Tenant;
  barbershop: Barbershop;
  appointments: Appointment[];
}

export interface ClientWithRelations extends Client {
  tenant: Tenant;
  appointments: Appointment[];
}

export interface AppointmentWithRelations extends Appointment {
  tenant: Tenant;
  barbershop: Barbershop;
  employee: Employee;
  client: Client;
  service: Service;
}

// Tipos para filtros de consulta
export interface TenantFilters {
  plan?: TenantPlan;
  status?: TenantStatus;
  isActive?: boolean;
}

export interface BarbershopFilters {
  tenantId: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  tenantId: string;
  barbershopId?: string;
  role?: EmployeeRole;
  active?: boolean;
}

export interface ServiceFilters {
  tenantId: string;
  barbershopId?: string;
  isActive?: boolean;
}

export interface ClientFilters {
  tenantId: string;
  name?: string;
  phone?: string;
}

export interface AppointmentFilters {
  tenantId: string;
  barbershopId?: string;
  employeeId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  startAt?: Date;
  endAt?: Date;
}

// Tipos para paginação
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


