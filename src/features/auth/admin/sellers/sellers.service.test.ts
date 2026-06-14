import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS } from '@/features/auth/admin/access/permission-keys';
import type { AdminAccessContext } from '@/features/auth/core/queries/admin-context';

const mockUserFindById = vi.fn();
const mockSellerFindById = vi.fn();
const mockSendApproved = vi.fn();
const mockSendRejected = vi.fn();

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockReturnValue({
    lean: vi.fn().mockResolvedValue(value),
  }),
});

vi.mock('@/db', () => ({
  User: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
  Seller: {
    findById: (...args: unknown[]) => mockSellerFindById(...args),
  },
}));

vi.mock('@/features/auth/admin/mail/send-seller-notifications', () => ({
  sendSellerApprovedEmail: (...args: unknown[]) => mockSendApproved(...args),
  sendSellerRejectedEmail: (...args: unknown[]) => mockSendRejected(...args),
}));

import { approveSeller, rejectSeller } from '@/features/auth/admin/sellers/sellers.service';

const userId = '550e8400-e29b-41d4-a716-446655440000';

const ownerCtx: AdminAccessContext = {
  userId: '660e8400-e29b-41d4-a716-446655440000',
  roleId: '770e8400-e29b-41d4-a716-446655440000',
  roleSlug: 'owner',
  roleName: 'Owner',
  permissions: new Set(Object.values(PERMISSIONS)),
  isOwner: true,
};

const limitedCtx: AdminAccessContext = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
  roleId: '770e8400-e29b-41d4-a716-446655440001',
  roleSlug: 'limited',
  roleName: 'Limited',
  permissions: new Set([PERMISSIONS.SELLERS_READ]),
  isOwner: false,
};

const mockPendingSeller = (save: ReturnType<typeof vi.fn>) => ({
  _id: userId,
  approvalStatus: 'pending',
  companyName: 'Test A.Ş.',
  rejectionReason: null,
  save,
});

describe('sellers.service bildirimleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindById.mockReturnValue(
      chainFindById({
        role: 'seller',
        email: 'seller@example.com',
      })
    );
    mockSendApproved.mockResolvedValue(undefined);
    mockSendRejected.mockResolvedValue(undefined);
  });

  it('onay sonrası satıcıya mail gönderir', async () => {
    const save = vi.fn();
    mockSellerFindById.mockResolvedValue(mockPendingSeller(save));

    await approveSeller(ownerCtx, userId);

    expect(save).toHaveBeenCalled();
    expect(mockSendApproved).toHaveBeenCalledWith('seller@example.com', 'Test A.Ş.');
  });

  it('red sonrası sebeple birlikte mail gönderir', async () => {
    const save = vi.fn();
    mockSellerFindById.mockResolvedValue(mockPendingSeller(save));

    await rejectSeller(ownerCtx, userId, 'Vergi levhası okunamıyor');

    expect(save).toHaveBeenCalled();
    expect(mockSendRejected).toHaveBeenCalledWith(
      'seller@example.com',
      'Vergi levhası okunamıyor',
      'Test A.Ş.'
    );
  });

  it('mail gönderilemese bile onay işlemi tamamlanır', async () => {
    const save = vi.fn();
    mockSellerFindById.mockResolvedValue(mockPendingSeller(save));
    mockSendApproved.mockRejectedValue(new Error('Resend hatası'));

    const result = await approveSeller(ownerCtx, userId);

    expect(result.approvalStatus).toBe('approved');
  });

  it('sellers.approve yetkisi olmadan satıcı onaylanamaz', async () => {
    await expect(approveSeller(limitedCtx, userId)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Satıcı onaylama yetkin yok',
    });
  });

  it('sellers.approve yetkisi olmadan satıcı reddedilemez', async () => {
    await expect(rejectSeller(limitedCtx, userId, 'Sebep')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Satıcı onaylama yetkin yok',
    });
  });
});
