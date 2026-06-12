import type { AdminRole } from '@/db';

export const canManageSellers = (role: AdminRole) => role === 'owner';

export const canListAdmins = (role: AdminRole) => role === 'owner';

export const canCreateAdminRole = (creatorRole: AdminRole, targetRole: AdminRole) => {
  if (creatorRole === 'owner') {
    return true;
  }

  return creatorRole === 'helper' && targetRole === 'helper';
};

export const canDeleteAdmin = (actorRole: AdminRole) => actorRole === 'owner';

export const canViewAdmin = (
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return true;
  }

  return actorRole === 'owner';
};

export const canUpdateAdminRole = (
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return false;
  }

  return actorRole === 'owner';
};

export const canAssignAdminRole = (actorRole: AdminRole, targetRole: AdminRole) => {
  return canCreateAdminRole(actorRole, targetRole);
};

export const canUpdateAdminProfile = (
  actorRole: AdminRole,
  actorUserId: string,
  targetUserId: string
) => {
  if (actorUserId === targetUserId) {
    return true;
  }

  return actorRole === 'owner';
};
