import { Admin, type AdminRole } from '@/db';

export const getAdminRole = async (userId: string): Promise<AdminRole | null> => {
  const admin = await Admin.findById(userId).select('adminRole').lean();
  return admin?.adminRole ?? null;
};
