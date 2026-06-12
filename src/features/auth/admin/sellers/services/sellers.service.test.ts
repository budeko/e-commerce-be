import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockSendApproved = vi.fn();
const mockSendRejected = vi.fn();

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockReturnValue({
    lean: vi.fn().mockResolvedValue(value),
  }),
});

vi.mock('../../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
  Seller: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}));

vi.mock('../../mail/send-seller-notifications', () => ({
  sendSellerApprovedEmail: (...args: unknown[]) => mockSendApproved(...args),
  sendSellerRejectedEmail: (...args: unknown[]) => mockSendRejected(...args),
}));

import { approveSeller, rejectSeller } from './sellers.service';

const userId = '507f1f77bcf86cd799439011';

describe('sellers.service bildirimleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockReturnValue(
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
    mockFindOne.mockResolvedValue({
      userId,
      approvalStatus: 'pending',
      companyName: 'Test A.Ş.',
      rejectionReason: null,
      save,
    });

    await approveSeller('owner', userId);

    expect(save).toHaveBeenCalled();
    expect(mockSendApproved).toHaveBeenCalledWith('seller@example.com', 'Test A.Ş.');
  });

  it('red sonrası sebeple birlikte mail gönderir', async () => {
    const save = vi.fn();
    mockFindOne.mockResolvedValue({
      userId,
      approvalStatus: 'pending',
      companyName: 'Test A.Ş.',
      rejectionReason: null,
      save,
    });

    await rejectSeller('owner', userId, 'Vergi levhası okunamıyor');

    expect(save).toHaveBeenCalled();
    expect(mockSendRejected).toHaveBeenCalledWith(
      'seller@example.com',
      'Vergi levhası okunamıyor',
      'Test A.Ş.'
    );
  });

  it('mail gönderilemese bile onay işlemi tamamlanır', async () => {
    const save = vi.fn();
    mockFindOne.mockResolvedValue({
      userId,
      approvalStatus: 'pending',
      companyName: 'Test A.Ş.',
      rejectionReason: null,
      save,
    });
    mockSendApproved.mockRejectedValue(new Error('Resend hatası'));

    const result = await approveSeller('owner', userId);

    expect(result.approvalStatus).toBe('approved');
  });

  it('helper satıcı onaylayamaz', async () => {
    await expect(approveSeller('helper', userId)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Satıcı yönetimi için yetkin yok',
    });
  });

  it('helper satıcı reddedemez', async () => {
    await expect(rejectSeller('helper', userId, 'Sebep')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Satıcı yönetimi için yetkin yok',
    });
  });
});
