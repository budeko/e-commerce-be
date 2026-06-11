import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindOne = vi.fn();
const mockFindById = vi.fn();
const mockCountDocuments = vi.fn();

vi.mock('../../../../db', () => ({
  Admin: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    countDocuments: (...args: unknown[]) => mockCountDocuments(...args),
  },
  User: {
    findById: (...args: unknown[]) => mockFindById(...args),
  },
}));

const chainFindById = (value: unknown) => ({
  select: vi.fn().mockResolvedValue(value),
});

const { getAdminByUserId, updateAdmin } = await import('./admins.service');

const ownerId = '507f1f77bcf86cd799439011';
const helperId = '507f1f77bcf86cd799439012';

const helperAdmin = {
  userId: helperId,
  adminRole: 'helper' as const,
  createdBy: ownerId,
  save: vi.fn(),
};

const helperUser = {
  _id: helperId,
  email: 'helper@example.com',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date(),
};

describe('getAdminByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOne.mockResolvedValue(helperAdmin);
    mockFindById.mockReturnValue(chainFindById(helperUser));
  });

  it('helper başka admini göremez', async () => {
    await expect(getAdminByUserId('helper', helperId, ownerId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe('updateAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOne.mockResolvedValue({ ...helperAdmin, save: vi.fn().mockResolvedValue(undefined) });
    mockFindById.mockReturnValue(chainFindById(helperUser));
    mockCountDocuments.mockResolvedValue(2);
  });

  it('helper başka admini güncelleyemez', async () => {
    await expect(
      updateAdmin('helper', helperId, ownerId, { adminRole: 'helper' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('owner helper rolünü güncelleyebilir', async () => {
    const result = await updateAdmin('owner', ownerId, helperId, { adminRole: 'helper' });

    expect(result.adminRole).toBe('helper');
  });

  it('admin kendi rolünü güncelleyemez', async () => {
    await expect(
      updateAdmin('owner', ownerId, ownerId, { adminRole: 'helper' })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
