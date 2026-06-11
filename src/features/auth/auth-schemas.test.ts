import { describe, expect, it } from 'vitest';
import {
  resetPasswordByCodeSchema,
  resetPasswordByTokenSchema,
  resetPasswordSchema,
} from './reset-password/schemas/reset-password.schema';
import {
  verifyEmailByCodeSchema,
  verifyEmailByTokenSchema,
  verifyEmailSchema,
} from './verify-email/schemas/verify-email.schema';

describe('verifyEmailSchema', () => {
  it('token gövdesini kabul eder', () => {
    const result = verifyEmailSchema.safeParse({ token: 'eyJ.valid.token' });
    expect(result.success).toBe(true);
  });

  it('email + code gövdesini kabul eder', () => {
    const result = verifyEmailSchema.safeParse({
      email: 'user@example.com',
      code: '482913',
    });
    expect(result.success).toBe(true);
  });

  it('5 haneli kodu reddeder', () => {
    const result = verifyEmailByCodeSchema.safeParse({
      email: 'user@example.com',
      code: '48291',
    });
    expect(result.success).toBe(false);
  });

  it('harf içeren kodu reddeder', () => {
    const result = verifyEmailByCodeSchema.safeParse({
      email: 'user@example.com',
      code: '48291a',
    });
    expect(result.success).toBe(false);
  });

  it('boş tokeni reddeder', () => {
    const result = verifyEmailByTokenSchema.safeParse({ token: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('token + newPassword gövdesini kabul eder', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'eyJ.valid.token',
      newPassword: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });

  it('email + code + newPassword gövdesini kabul eder', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'user@example.com',
      code: '482913',
      newPassword: 'SecurePass1',
    });
    expect(result.success).toBe(true);
  });

  it('zayıf şifreyi reddeder', () => {
    const result = resetPasswordByTokenSchema.safeParse({
      token: 'eyJ.valid.token',
      newPassword: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('eksik kod alanını reddeder', () => {
    const result = resetPasswordByCodeSchema.safeParse({
      email: 'user@example.com',
      newPassword: 'SecurePass1',
    });
    expect(result.success).toBe(false);
  });
});
