import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { validateProfileUpdate } from './validate-profile-update';

const createReply = () => {
  const reply = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return reply as unknown as FastifyReply & { statusCode: number; body: unknown };
};

describe('validateProfileUpdate', () => {
  it('auth yoksa 401 döner', async () => {
    const reply = createReply();
    const request = { auth: undefined, body: {} } as FastifyRequest;

    await validateProfileUpdate(request, reply);

    expect(reply.statusCode).toBe(401);
    expect(reply.body).toEqual({ message: 'Giriş gerekli' });
  });

  it('admin 403 alır', async () => {
    const reply = createReply();
    const request = {
      auth: { userId: '507f1f77bcf86cd799439011', role: 'admin' },
      body: { firstName: 'Ali' },
    } as FastifyRequest;

    await validateProfileUpdate(request, reply);

    expect(reply.statusCode).toBe(403);
    expect(reply.body).toEqual({
      message: 'Admin profili /auth/admin/profile üzerinden yönetilir',
    });
  });

  it('geçersiz buyer gövdesinde 400 döner', async () => {
    const reply = createReply();
    const request = {
      auth: { userId: '507f1f77bcf86cd799439011', role: 'buyer' },
      body: {},
    } as FastifyRequest;

    await validateProfileUpdate(request, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.body).toMatchObject({ message: 'Geçersiz istek verisi' });
  });

  it('geçerli buyer gövdesini parse eder', async () => {
    const reply = createReply();
    const request = {
      auth: { userId: '507f1f77bcf86cd799439011', role: 'buyer' },
      body: { firstName: 'Ali' },
    } as FastifyRequest;

    await validateProfileUpdate(request, reply);

    expect(reply.statusCode).toBe(200);
    expect(request.body).toEqual({ firstName: 'Ali' });
  });

  it('tehlikeli operatör keylerini bodyden temizler', async () => {
    const reply = createReply();
    const request = {
      auth: { userId: '507f1f77bcf86cd799439011', role: 'buyer' },
      body: { firstName: 'Ali', $set: { role: 'admin' } },
    } as FastifyRequest;

    await validateProfileUpdate(request, reply);

    expect(reply.statusCode).toBe(200);
    expect(request.body).toEqual({ firstName: 'Ali' });
  });
});
