import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindByIdAndUpdate = vi.fn();

vi.mock('@/db', () => ({
  User: {
    findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
  },
}));

import { logoutAllSessions } from '@/features/auth/credentials/logout/logout.service';

describe('logoutAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByIdAndUpdate.mockResolvedValue({});
  });

  it('sessionsRevokedAt günceller', async () => {
    await logoutAllSessions('550e8400-e29b-41d4-a716-446655440000');

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      { sessionsRevokedAt: expect.any(Date) }
    );
  });
});
