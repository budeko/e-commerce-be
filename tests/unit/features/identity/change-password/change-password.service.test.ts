import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockComparePassword = vi.fn();
const mockHashPassword = vi.fn();

vi.mock('@/integrations/mongo', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

vi.mock('@/internal/common/security', () => ({
  comparePassword: (...args: unknown[]) => mockComparePassword(...args),
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));

import { changePassword } from '@/features/identity/change-password/change-password.service';

describe('changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue({ _id: '550e8400-e29b-41d4-a716-446655440000', password: 'hash' });
    mockComparePassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue('new-hash');
    mockFindByIdAndUpdate.mockResolvedValue({});
  });

  it('şifreyi günceller ve passwordChangedAt yazar', async () => {
    await changePassword(
      { userId: '550e8400-e29b-41d4-a716-446655440000', role: 'buyer' },
      { currentPassword: 'OldPass1', newPassword: 'NewPass1' }
    );

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      expect.objectContaining({
        password: 'new-hash',
        passwordChangedAt: expect.any(Date),
      })
    );
  });
});
