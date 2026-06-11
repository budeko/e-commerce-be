import type { AdminRole } from '../../db/auth/admin.model';

type AdminRecord = {
  userId: unknown;
  adminRole: AdminRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdBy?: unknown;
  createdAt?: Date;
};

type AdminUserRecord = {
  email?: string;
  isEmailVerified?: boolean;
  createdAt?: Date;
};

export const formatAdminResponse = (admin: AdminRecord, user?: AdminUserRecord | null) => ({
  userId: admin.userId,
  email: user?.email,
  isEmailVerified: user?.isEmailVerified,
  adminRole: admin.adminRole,
  createdAt: user?.createdAt ?? admin.createdAt,
  createdBy: admin.createdBy,
  profile: {
    firstName: admin.firstName ?? null,
    lastName: admin.lastName ?? null,
    phone: admin.phone ?? null,
  },
});
