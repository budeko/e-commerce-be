import { describe, expect, it } from 'vitest';
import {
  canAssignAdminRole,
  canCreateAdminRole,
  canDeleteAdmin,
  canListAdmins,
  canManageSellers,
  canUpdateAdminProfile,
  canUpdateAdminRole,
  canViewAdmin,
} from '@/features/auth/admin/access/permissions';

describe('canCreateAdminRole', () => {
  it('owner her iki rolü de oluşturabilir', () => {
    expect(canCreateAdminRole('owner', 'owner')).toBe(true);
    expect(canCreateAdminRole('owner', 'helper')).toBe(true);
  });

  it('helper sadece helper oluşturabilir', () => {
    expect(canCreateAdminRole('helper', 'helper')).toBe(true);
    expect(canCreateAdminRole('helper', 'owner')).toBe(false);
  });
});

describe('canDeleteAdmin', () => {
  it('sadece owner silebilir', () => {
    expect(canDeleteAdmin('owner')).toBe(true);
    expect(canDeleteAdmin('helper')).toBe(false);
  });
});

describe('canManageSellers', () => {
  it('sadece owner satıcı yönetebilir', () => {
    expect(canManageSellers('owner')).toBe(true);
    expect(canManageSellers('helper')).toBe(false);
  });
});

describe('canListAdmins', () => {
  it('sadece owner admin listesini görebilir', () => {
    expect(canListAdmins('owner')).toBe(true);
    expect(canListAdmins('helper')).toBe(false);
  });
});

describe('canViewAdmin', () => {
  const actorId = '550e8400-e29b-41d4-a716-446655440000';
  const otherId = '550e8400-e29b-41d4-a716-446655440001';

  it('her admin kendi profilini görebilir', () => {
    expect(canViewAdmin('owner', actorId, actorId)).toBe(true);
    expect(canViewAdmin('helper', actorId, actorId)).toBe(true);
  });

  it('owner başka admini görebilir', () => {
    expect(canViewAdmin('owner', actorId, otherId)).toBe(true);
  });

  it('helper başka admini göremez', () => {
    expect(canViewAdmin('helper', actorId, otherId)).toBe(false);
  });
});

describe('canUpdateAdminRole', () => {
  const actorId = '550e8400-e29b-41d4-a716-446655440000';
  const otherId = '550e8400-e29b-41d4-a716-446655440001';

  it('kimse kendi rolünü bu endpoint ile değiştiremez', () => {
    expect(canUpdateAdminRole('owner', actorId, actorId)).toBe(false);
    expect(canUpdateAdminRole('helper', actorId, actorId)).toBe(false);
  });

  it('owner başka admini güncelleyebilir', () => {
    expect(canUpdateAdminRole('owner', actorId, otherId)).toBe(true);
  });

  it('helper başka admini güncelleyemez', () => {
    expect(canUpdateAdminRole('helper', actorId, otherId)).toBe(false);
  });
});

describe('canUpdateAdminProfile', () => {
  const actorId = '550e8400-e29b-41d4-a716-446655440000';
  const otherId = '550e8400-e29b-41d4-a716-446655440001';

  it('her admin kendi profilini güncelleyebilir', () => {
    expect(canUpdateAdminProfile('owner', actorId, actorId)).toBe(true);
    expect(canUpdateAdminProfile('helper', actorId, actorId)).toBe(true);
  });

  it('owner başka admin profilini güncelleyebilir', () => {
    expect(canUpdateAdminProfile('owner', actorId, otherId)).toBe(true);
  });

  it('helper başka admin profilini güncelleyemez', () => {
    expect(canUpdateAdminProfile('helper', actorId, otherId)).toBe(false);
  });
});

describe('canAssignAdminRole', () => {
  it('owner owner veya helper atayabilir', () => {
    expect(canAssignAdminRole('owner', 'owner')).toBe(true);
    expect(canAssignAdminRole('owner', 'helper')).toBe(true);
  });

  it('helper sadece helper atayabilir', () => {
    expect(canAssignAdminRole('helper', 'helper')).toBe(true);
    expect(canAssignAdminRole('helper', 'owner')).toBe(false);
  });
});
