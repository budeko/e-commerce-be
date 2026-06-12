import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUpload = vi.fn();
const mockUpdateSellerProfile = vi.fn();

vi.mock('../../../../../lib/storage/supabase', () => ({
  uploadToSellerStorage: (...args: unknown[]) => mockUpload(...args),
}));

vi.mock('./seller.service', () => ({
  updateSellerProfile: (...args: unknown[]) => mockUpdateSellerProfile(...args),
}));

import { uploadSellerDocument } from './documents.service';

const userId = '507f1f77bcf86cd799439011';
const pdfBuffer = Buffer.from('%PDF-1.4 test');

describe('uploadSellerDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue('https://xxx.supabase.co/storage/v1/object/public/seller-documents/a.pdf');
    mockUpdateSellerProfile.mockResolvedValue({
      approvalStatus: 'draft',
      profile: { taxCertificateUrl: 'https://xxx.supabase.co/...' },
    });
  });

  it('buyer yükleyemez', async () => {
    await expect(
      uploadSellerDocument(
        { userId, role: 'buyer' },
        { docType: 'taxCertificate', mimeType: 'application/pdf', buffer: pdfBuffer }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Bu endpoint sadece satıcılar içindir',
    });
  });

  it('vergi levhası yükler ve profile yazar', async () => {
    const result = await uploadSellerDocument(
      { userId, role: 'seller' },
      { docType: 'taxCertificate', mimeType: 'application/pdf', buffer: pdfBuffer }
    );

    expect(mockUpload).toHaveBeenCalled();
    expect(mockUpdateSellerProfile).toHaveBeenCalledWith(userId, {
      taxCertificateUrl: 'https://xxx.supabase.co/storage/v1/object/public/seller-documents/a.pdf',
    });
    expect(result.field).toBe('taxCertificateUrl');
    expect(result.url).toContain('supabase.co');
  });

  it('pdf olmayan vergi levhasını reddeder', async () => {
    await expect(
      uploadSellerDocument(
        { userId, role: 'seller' },
        { docType: 'taxCertificate', mimeType: 'image/png', buffer: pdfBuffer }
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Geçersiz dosya türü',
    });
  });

  it('geçersiz docType reddedilir', async () => {
    await expect(
      uploadSellerDocument(
        { userId, role: 'seller' },
        { docType: 'invalid', mimeType: 'application/pdf', buffer: pdfBuffer }
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Geçersiz belge tipi',
    });
  });
});
