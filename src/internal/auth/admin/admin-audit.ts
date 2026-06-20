import type { AdminAuditAction } from '@/integrations/mongo';
import { createAdminAuditLog } from '@/repositories/admin/admin-audit-log.repository';
import { createUserId } from '@/internal/common/ids';
import { createLogger } from '@/internal/common/logging';

const log = createLogger({ module: 'admin-audit' });

export type RecordAdminActionInput = {
  actorUserId: string;
  action: AdminAuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
};

export const recordAdminAction = async (input: RecordAdminActionInput): Promise<void> => {
  try {
    await createAdminAuditLog({
      _id: createUserId(),
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? null,
    });

    log.info(
      {
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      },
      'Admin action recorded'
    );
  } catch (error) {
    log.error(
      {
        err: error,
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      },
      'Admin audit log yazılamadı'
    );
  }
};
