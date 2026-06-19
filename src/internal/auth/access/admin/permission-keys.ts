export const PERMISSIONS = {
  ADMINS_READ: 'admins.read',
  ADMINS_WRITE: 'admins.write',
  ADMINS_DELETE: 'admins.delete',
  ADMIN_ROLES_READ: 'adminRoles.read',
  ADMIN_ROLES_WRITE: 'adminRoles.write',
  ADMIN_ROLES_DELETE: 'adminRoles.delete',
  SELLERS_READ: 'sellers.read',
  SELLERS_APPROVE: 'sellers.approve',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_WRITE: 'categories.write',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const OWNER_ONLY_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.ADMINS_WRITE,
  PERMISSIONS.ADMINS_DELETE,
  PERMISSIONS.ADMIN_ROLES_WRITE,
  PERMISSIONS.ADMIN_ROLES_DELETE,
];

export const ASSIGNABLE_PERMISSIONS: PermissionKey[] = ALL_PERMISSIONS.filter(
  (permission) => !OWNER_ONLY_PERMISSIONS.includes(permission)
);

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  [PERMISSIONS.ADMINS_READ]: 'Admin listesini görüntüle',
  [PERMISSIONS.ADMINS_WRITE]: 'Admin oluştur ve rol ata',
  [PERMISSIONS.ADMINS_DELETE]: 'Admin sil',
  [PERMISSIONS.ADMIN_ROLES_READ]: 'Rolleri görüntüle',
  [PERMISSIONS.ADMIN_ROLES_WRITE]: 'Rol oluştur ve düzenle',
  [PERMISSIONS.ADMIN_ROLES_DELETE]: 'Rol sil',
  [PERMISSIONS.SELLERS_READ]: 'Satıcıları görüntüle',
  [PERMISSIONS.SELLERS_APPROVE]: 'Satıcı onayla / reddet',
  [PERMISSIONS.CATEGORIES_READ]: 'Kategorileri görüntüle',
  [PERMISSIONS.CATEGORIES_WRITE]: 'Kategori yönet',
};

export const isPermissionKey = (value: string): value is PermissionKey =>
  ALL_PERMISSIONS.includes(value as PermissionKey);
