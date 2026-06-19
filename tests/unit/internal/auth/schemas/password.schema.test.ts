import { describe, expect, it } from 'vitest';
import { passwordSchema } from '@/internal/auth/schemas/password.schema';

describe('passwordSchema', () => {
  it('zayıf şifreyi reddeder', () => {
    expect(passwordSchema.safeParse('password').success).toBe(false);
  });
});
