import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSellerFindById = vi.fn();
const mockSellerFindByIdAndUpdate = vi.fn();

vi.mock('@/db', () => ({
  Seller: {
    findById: (...args: unknown[]) => mockSellerFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockSellerFindByIdAndUpdate(...args),
  },
}));

import { updateSellerProfile } from '@/features/auth/account/profile/seller.service';

const userId = '550e8400-e29b-41d4-a716-446655440000';

const completeBireyselSeller = {
  sellerType: 'bireysel',
  firstName: 'Ali',
  lastName: 'Veli',
  phone: '05551234567',
  companyName: 'Ali Shop',
  taxNumber: '1234567890',
  taxOffice: 'Kadıköy',
  country: 'TR',
  city: 'Istanbul',
  district: 'Kadıköy',
  companyAddress: 'Şirket adresi burada',
  taxCertificateUrl: 'https://example.com/tax.pdf',
  bankName: 'Ziraat',
  iban: 'TR330006100519786457841326',
  accountHolderName: 'Ali Veli',
  companyLogoUrl: 'https://example.com/logo.png',
  companyDescription: 'Bu bir test şirket tanıtım metnidir.',
};

describe('updateSellerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('satıcı profili yoksa 404 döner', async () => {
    mockSellerFindById.mockResolvedValue(null);

    await expect(updateSellerProfile(userId, { firstName: 'Ali' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Satıcı profili bulunamadı',
    });
  });

  it('onay beklerken profil güncellenemez', async () => {
    mockSellerFindById.mockResolvedValue({ approvalStatus: 'pending' });

    await expect(updateSellerProfile(userId, { firstName: 'Ali' })).rejects.toMatchObject({
      statusCode: 403,
      message: 'Onay beklenirken profil güncellenemez',
    });
  });

  it('onaylı satıcıda kritik alan değişince pending olur', async () => {
    mockSellerFindById.mockResolvedValue({
      approvalStatus: 'approved',
      companyName: 'Eski Şirket',
      toObject: () => ({ approvalStatus: 'approved', companyName: 'Eski Şirket' }),
    });
    mockSellerFindByIdAndUpdate.mockResolvedValue({
      approvalStatus: 'pending',
      toObject: () => ({ approvalStatus: 'pending', ...completeBireyselSeller }),
    });

    const result = await updateSellerProfile(userId, { companyName: 'Yeni Şirket' });

    expect(mockSellerFindByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      {
        $set: expect.objectContaining({
          companyName: 'Yeni Şirket',
          approvalStatus: 'pending',
          rejectionReason: null,
        }),
      },
      { returnDocument: 'after' }
    );
    expect(result.approvalStatus).toBe('pending');
  });

  it('draft profil tamamlanınca pending olur', async () => {
    const save = vi.fn();
    mockSellerFindById.mockResolvedValue({
      approvalStatus: 'draft',
      toObject: () => ({ approvalStatus: 'draft' }),
    });
    mockSellerFindByIdAndUpdate.mockResolvedValue({
      approvalStatus: 'draft',
      rejectionReason: null,
      save,
      toObject: () => ({ approvalStatus: 'draft', ...completeBireyselSeller }),
    });

    const result = await updateSellerProfile(userId, { firstName: 'Ali' });

    expect(save).toHaveBeenCalled();
    expect(result.approvalStatus).toBe('pending');
  });
});
