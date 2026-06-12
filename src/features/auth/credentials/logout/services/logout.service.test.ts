import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindByIdAndUpdate = vi.fn();

vi.mock('../../../../../db', () => ({
  User: {
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

import { logoutAllSessions } from '@/features/auth/credentials/logout/services/logout.service';

describe('logoutAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUpdate.mockResolvedValue({});
  });

  it('sessionsRevokedAt günceller', async () => {
    await logoutAllSessions('507f1f77bcf86cd799439011');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { sessionsRevokedAt: expect.any(Date) }
    );
  });
});
