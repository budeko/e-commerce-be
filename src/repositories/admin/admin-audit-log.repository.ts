import { AdminAuditLog, type AdminAuditAction } from '@/integrations/mongo';

export type CreateAdminAuditLogData = {
  _id: string;
  actorUserId: string;
  action: AdminAuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown> | null;
};

export const createAdminAuditLog = async (data: CreateAdminAuditLogData) =>
  AdminAuditLog.create(data);
