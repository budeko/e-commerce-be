import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindById = vi.fn();
const mockBuildAuthUserFields = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

vi.mock('../../../shared/responses/user.response', () => ({
  buildAuthUserFields: (...args: unknown[]) => mockBuildAuthUserFields(...args),
}));

import { getMe } from '@/features/auth/account/me/services/me.service';

const userId = '507f1f77bcf86cd799439011';

describe('getMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kullanıcı bulunamazsa 404 döner', async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await expect(getMe({ userId, role: 'buyer' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Kullanıcı bulunamadı',
    });
  });

  it('buyer için email ve durum alanlarını döner', async () => {
    mockFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        email: 'buyer@example.com',
        role: 'buyer',
        isActive: true,
        isEmailVerified: true,
      }),
    });
    mockBuildAuthUserFields.mockResolvedValue({
      userId,
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });

    const result = await getMe({ userId, role: 'buyer' });

    expect(result).toEqual({
      email: 'buyer@example.com',
      userId,
      role: 'buyer',
      isEmailVerified: true,
      isActive: true,
    });
  });
});
