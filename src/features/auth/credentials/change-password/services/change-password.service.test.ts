import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindById = vi.fn();
const mockFindByIdAndUpdate = vi.fn();
const mockComparePassword = vi.fn();
const mockHashPassword = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

vi.mock('../../../../../lib/common/password', () => ({
  comparePassword: (...args: unknown[]) => mockComparePassword(...args),
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));

import { changePassword } from './change-password.service';

describe('changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', password: 'hash' });
    mockComparePassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue('new-hash');
    mockFindByIdAndUpdate.mockResolvedValue({});
  });

  it('şifreyi günceller ve passwordChangedAt yazar', async () => {
    await changePassword(
      { userId: '507f1f77bcf86cd799439011', role: 'buyer' },
      { currentPassword: 'OldPass1', newPassword: 'NewPass1' }
    );

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.objectContaining({
        password: 'new-hash',
        passwordChangedAt: expect.any(Date),
      })
    );
  });
});
