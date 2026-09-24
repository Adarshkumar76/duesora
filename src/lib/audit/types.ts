export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface LogAuditInput {
  workspaceId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface ListAuditLogsOptions {
  search?: string | null;
  action?: string | null;
  entityType?: string | null;
  actorId?: string | null;
  page?: number;
  pageSize?: number;
}
